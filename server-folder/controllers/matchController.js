const MatchService = require('../services/matchService');
const LeagueService = require('../services/leagueService');
const TeamService = require('../services/teamService');
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
          return res.status(400).json({
            success: false,
            message: 'Valid league ID is required',
          });
        }

        const league = await LeagueService.getLeagueById(leagueId);
        if (!league) {
          return res.status(404).json({
            success: false,
            message: 'League not found',
          });
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

      const filters = {
        leagueId: leagueId,
        status: status,
        date: processedDate,
        // Only add pagination if page is provided
        page: page?.number || null,
        limit: page?.size || null,
        includeModels: [
          {
            model: require('../models').Team,
            as: 'HomeTeam',
            attributes: ['name', 'logoUrl'],
          },
          {
            model: require('../models').Team,
            as: 'AwayTeam',
            attributes: ['name', 'logoUrl'],
          },
          {
            model: require('../models').League,
            attributes: ['name', 'country'],
          },
        ],
      };

      const result = await MatchService.getMatchesWithPagination(filters);

      // If it's a league-specific request, add league info to response
      const response = {
        success: true,
        data: result.matches,
        meta: result.pagination,
        message: 'Matches retrieved successfully',
      };

      if (leagueId) {
        const league = await LeagueService.getLeagueById(leagueId);
        response.league = league?.name;
      }

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getAllMatchesWithFilters:', error);
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
        return res.status(400).json({
          success: false,
          message: 'Valid league ID is required',
        });
      }

      const league = await LeagueService.getLeagueById(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
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

      // Synchronize matches using the service
      const results = await MatchService.batchSynchronizeMatches(
        matches,
        league,
        TeamService.getTeamByExternalRef
      );

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
      console.error('Error in synchronizeMatchesFromAPI:', error);
      next(error);
    }
  }
}

module.exports = MatchController;
