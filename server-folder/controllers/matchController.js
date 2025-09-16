const { Match, League, Team } = require('../models');
const { Op } = require('sequelize');
const { http } = require('../helpers/http');
const qs = require('qs');

/**
 * Match Controller - Handles match-related HTTP requests
 */
class MatchController {
  /**
   * Get matches with filtering, search, pagination, and support for league-specific queries
   * @route GET /api/matches
   * @route GET /api/matches/league/:leagueId
   */
  static async getAllMatchesWithFilters(req, res, next) {
    try {
      const { page, status, date } = qs.parse(req.query);
      const { leagueId } = req.params; // Support for league-specific route

      // If leagueId is provided via params, validate it
      if (leagueId) {
        if (isNaN(leagueId)) {
          const error = new Error('Valid league ID is required');
          error.name = 'BadRequest';
          throw error;
        }

        const league = await League.findByPk(leagueId);
        if (!league) {
          const error = new Error('League not found');
          error.name = 'NotFound';
          throw error;
        }
      }

      // Process date parameter
      let processedDate = null;
      if (date) {
        // Handle URL encoded date (e.g., "09%2F14%2F2025" becomes "09/14/2025")
        const decodedDate = decodeURIComponent(date);

        // Try to parse different date formats
        let parsedDate;
        if (decodedDate.includes('/')) {
          // Handle MM/DD/YYYY format
          const [month, day, year] = decodedDate.split('/');
          parsedDate = new Date(year, month - 1, day); // month is 0-indexed
        } else if (decodedDate.includes('-')) {
          // Handle YYYY-MM-DD format
          parsedDate = new Date(decodedDate);
        } else {
          parsedDate = new Date(decodedDate);
        }

        if (!isNaN(parsedDate.getTime())) {
          processedDate = parsedDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        }
      }

      const whereConditions = {};

      // Apply filters
      if (leagueId) {
        whereConditions.league_id = leagueId;
      }

      if (status) {
        whereConditions.status = status;
      }

      if (processedDate) {
        // Convert date string to proper format for database comparison
        const parsedDate = new Date(processedDate);
        if (!isNaN(parsedDate.getTime())) {
          // Create date range for the entire day
          const startOfDay = new Date(parsedDate);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(parsedDate);
          endOfDay.setHours(23, 59, 59, 999);

          whereConditions.match_date = {
            [Op.between]: [startOfDay, endOfDay],
          };
        }
      }

      const options = {
        where: whereConditions,
        order: [['match_date', 'DESC']],
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            attributes: ['name', 'logoUrl'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            attributes: ['name', 'logoUrl'],
          },
          {
            model: League,
            attributes: ['name', 'country'],
          },
        ],
      };

      // Only add pagination if page is provided
      if (page?.number && page?.size) {
        options.limit = parseInt(page.size);
        options.offset = (parseInt(page.number) - 1) * parseInt(page.size);
      }

      const { count, rows } = await Match.findAndCountAll(options);

      // Build pagination metadata
      let paginationMeta = null;
      if (page?.number && page?.size) {
        const totalPages = Math.ceil(count / parseInt(page.size));
        paginationMeta = {
          currentPage: parseInt(page.number),
          totalPages: totalPages,
          totalItems: count,
          itemsPerPage: parseInt(page.size),
          hasNext: parseInt(page.number) < totalPages,
          hasPrev: parseInt(page.number) > 1,
        };
      } else {
        // No pagination - return simple meta
        paginationMeta = {
          totalItems: count,
        };
      }

      // If it's a league-specific request, add league info to response
      const response = {
        success: true,
        data: rows,
        meta: paginationMeta,
        message: 'Matches retrieved successfully',
      };

      if (leagueId) {
        const league = await League.findByPk(leagueId);
        response.league = league?.name;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Synchronize matches from external API to database
   * @route POST /api/matches/sync/:leagueId
   */
  static async synchronizeMatchesFromAPI(req, res, next) {
    try {
      const { leagueId } = req.params;

      // Validate league ID
      if (!leagueId || isNaN(leagueId)) {
        const error = new Error('Valid league ID is required');
        error.name = 'BadRequest';
        throw error;
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        const error = new Error('League not found');
        error.name = 'NotFound';
        throw error;
      }

      // Fetch matches from external API
      const response = await http('/', {
        params: {
          action: 'get_events',
          league_id: league.externalRef,
          from: '2025-06-01',
          to: '2026-09-02',
        },
      });

      const matches = response.data.filter((e) => e.league_year === '2025/2026');

      if (!matches || matches.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No matches found for synchronization',
          totalMatches: 0,
        });
      }

      // Helper function to get team by external ref
      const getTeamByExternalRef = async (externalRef) => {
        try {
          if (!externalRef) {
            return null;
          }
          return await Team.findOne({ where: { externalRef } });
        } catch (error) {
          // Error getting team by externalRef
          return null;
        }
      };

      // Synchronize matches
      const results = {
        successful: 0,
        failed: 0,
        details: [],
      };

      // Process matches in parallel with proper error handling
      const syncPromises = matches.map(async (matchData) => {
        try {
          const [homeTeam, awayTeam] = await Promise.all([
            getTeamByExternalRef(matchData.match_hometeam_id),
            getTeamByExternalRef(matchData.match_awayteam_id),
          ]);

          // Skip if teams are not found
          if (!homeTeam || !awayTeam) {
            const result = {
              success: false,
              matchId: matchData.match_id,
              reason: 'Teams not found',
              homeTeam: homeTeam?.name || 'N/A',
              awayTeam: awayTeam?.name || 'N/A',
            };
            results.failed++;
            results.details.push(result);
            return result;
          }

          // Synchronize match
          const [matchResult] = await Match.upsert({
            league_id: league.id,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            match_date: matchData.match_date || null,
            match_time: matchData.match_time || null,
            home_score: matchData.match_hometeam_ft_score || null,
            away_score: matchData.match_awayteam_ft_score || null,
            status: matchData.match_status || 'upcoming',
            venue: homeTeam.stadiumName || null,
            externalRef: matchData.match_id,
          });

          const result = {
            success: true,
            matchId: matchData.match_id,
            match: matchResult,
          };

          results.successful++;
          results.details.push(result);
          return result;
        } catch (error) {
          const errorResult = {
            success: false,
            matchId: matchData.match_id,
            error: error.message,
          };
          results.failed++;
          results.details.push(errorResult);
          return errorResult;
        }
      });

      await Promise.all(syncPromises);

      res.status(200).json({
        success: true,
        message: 'Match synchronization completed',
        totalMatches: matches.length,
        successful: results.successful,
        failed: results.failed,
        syncedAt: new Date(),
        details: process.env.NODE_ENV === 'development' ? results.details : undefined,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MatchController;
