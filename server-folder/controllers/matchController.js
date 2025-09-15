const MatchService = require('../services/matchService');
const LeagueService = require('../services/leagueService');
const TeamService = require('../services/teamService');
const { http } = require('../helpers/http');

/**
 * Match Controller - Handles match-related HTTP requests
 */
class MatchController {
  /**
   * Get matches by league ID
   * @route GET /api/matches/league/:leagueId
   */
  static async getMatchesByLeague(req, res, next) {
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

      const matches = await MatchService.getMatchesByLeague(leagueId, [
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
      ]);

      res.status(200).json({
        success: true,
        data: matches,
        league: league.name,
        message: 'Matches retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getMatchesByLeague:', error);
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
