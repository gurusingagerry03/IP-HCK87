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
      const { filter, q, page, date, status } = qs.parse(req.query);
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

      const filters = {
        leagueId: leagueId || filter?.league, // Use leagueId from params or query
        status: filter?.status || status,
        date: filter?.date || date,
        search: q,
        page: page?.number || 1,
        limit: page?.size || 10,
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
