const { Match, Team, League } = require('../models');
const { http } = require('../helpers/http');
const { Op } = require('sequelize');

class matchController {
  static async getMatchesByLeagueId(req, res, next) {
    try {
      const { id } = req.params;
      const leagueId = parseInt(id);

      if (!leagueId || isNaN(leagueId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid League ID',
        });
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
      }

      // Extract query parameters
      const { status, date, 'page[number]': pageNumber, 'page[size]': pageSize } = req.query;

      // Check if any query parameters exist
      const hasQueryParams = status || date || pageNumber || pageSize;

      // Build where clause for filtering
      const whereClause = {};

      // Filter by status
      if (status && status !== 'all') {
        if (status === 'upcoming') {
          whereClause.status = { [Op.or]: ['', null, 'upcoming'] };
        } else {
          whereClause.status = status;
        }
      }

      // Filter by date (expecting MM/DD/YYYY format from client)
      if (date) {
        try {
          // Convert MM/DD/YYYY to YYYY-MM-DD for database comparison
          const [month, day, year] = date.split('/');
          const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          whereClause.match_date = formattedDate;
        } catch (dateError) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format. Expected MM/DD/YYYY',
          });
        }
      }

      // If no query parameters, return all data without pagination
      if (!hasQueryParams) {
        const matches = await Match.findAll({
          where: whereClause,
          include: [
            {
              model: Team,
              as: 'HomeTeam',
              where: { leagueId },
              attributes: ['id', 'name', 'logoUrl', 'country'],
            },
            {
              model: Team,
              as: 'AwayTeam',
              where: { leagueId },
              attributes: ['id', 'name', 'logoUrl', 'country'],
            },
          ],
          order: [
            ['match_date', 'ASC'],
            ['match_time', 'ASC'],
          ],
        });

        return res.status(200).json({
          success: true,
          data: matches,
        });
      }

      // Pagination parameters (only when query params exist)
      const page = parseInt(pageNumber) || 1;
      const limit = parseInt(pageSize) || 10;
      const offset = (page - 1) * limit;

      // Get total count for pagination metadata
      const totalItems = await Match.count({
        where: whereClause,
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            where: { leagueId },
            attributes: [],
          },
          {
            model: Team,
            as: 'AwayTeam',
            where: { leagueId },
            attributes: [],
          },
        ],
      });

      // Get matches with filtering and pagination
      const matches = await Match.findAll({
        where: whereClause,
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            where: { leagueId },
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            where: { leagueId },
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
        ],
        order: [
          ['match_date', 'ASC'],
          ['match_time', 'ASC'],
        ],
        limit,
        offset,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return res.status(200).json({
        success: true,
        data: matches,
        meta: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async synchronizeMatchesByLeagueId(req, res, next) {
    try {
      const { leagueId } = req.params;

      if (!leagueId || isNaN(leagueId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid League ID',
        });
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
      }

      // Fetch matches from API
      let matchesResponse;
      try {
        matchesResponse = await http('/', {
          params: {
            action: 'get_events',
            league_id: league.externalRef || league.id,
            from: '2025-06-01',
            to: '2026-09-02',
          },
        });
      } catch (apiError) {
        return res.status(400).json({
          success: false,
          message: 'Failed to connect to external matches API',
        });
      }

      if (!matchesResponse.data || !Array.isArray(matchesResponse.data)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid response from external API',
        });
      }

      // Get all teams in this league for reference
      const teams = await Team.findAll({
        where: { leagueId: leagueId },
      });

      const teamsByExternalRef = teams.reduce((acc, team) => {
        acc[team.externalRef] = team;
        return acc;
      }, {});

      const syncResults = {
        matchesAdded: 0,
        matchesUpdated: 0,
        errors: [],
      };

      try {
        // DEDUPLICATION: Remove duplicate matches berdasarkan match_id
        const uniqueMatchesMap = new Map();

        matchesResponse.data
          .filter((e) => e.league_year == '2025/2026')
          .forEach((apiMatchData) => {
            const homeTeam = teamsByExternalRef[apiMatchData.match_hometeam_id];
            const awayTeam = teamsByExternalRef[apiMatchData.match_awayteam_id];

            if (homeTeam && awayTeam && apiMatchData.match_id) {
              if (!uniqueMatchesMap.has(apiMatchData.match_id)) {
                uniqueMatchesMap.set(apiMatchData.match_id, {
                  league_id: leagueId,
                  home_team_id: homeTeam.id,
                  away_team_id: awayTeam.id,
                  match_date: apiMatchData.match_date || null,
                  match_time: apiMatchData.match_time || null,
                  home_score: apiMatchData.match_hometeam_ft_score,
                  away_score: apiMatchData.match_awayteam_ft_score,
                  status: apiMatchData.match_status?.toLowerCase() || 'upcoming',
                  venue: homeTeam.stadiumName || null,
                  externalRef: apiMatchData.match_id,
                });
              }
            }
          });

        // Convert map to array for bulk create
        const matchesData = Array.from(uniqueMatchesMap.values());

        if (matchesData.length > 0) {
          // Bulk create/update matches
          const matchResults = await Match.bulkCreate(matchesData, {
            updateOnDuplicate: [
              'match_date',
              'match_time',
              'home_score',
              'away_score',
              'status',
              'venue',
            ],
            returning: true,
          });

          syncResults.matchesAdded = matchResults.filter(
            (result) => result._options.isNewRecord
          ).length;
          syncResults.matchesUpdated = matchResults.length - syncResults.matchesAdded;
        }
      } catch (bulkError) {
        console.error('Bulk matches sync error:', bulkError);
        syncResults.errors.push(`Bulk operation failed: ${bulkError.message}`);
      }

      return res.status(200).json({
        success: true,
        data: syncResults,
        message: `Successfully synchronized ${
          syncResults.matchesAdded + syncResults.matchesUpdated
        } matches`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = matchController;
