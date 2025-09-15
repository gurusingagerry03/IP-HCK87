const LeagueService = require('../services/leagueService');
const { Team } = require('../models');
const { http } = require('../helpers/http');

/**
 * League Controller - Handles league-related HTTP requests
 */
class LeagueController {
  /**
   * Get all leagues with associated teams
   * @route GET /api/leagues
   */
  static async getAllLeagues(req, res, next) {
    try {
      const leagues = await LeagueService.getAllLeagues([
        {
          model: Team,
        },
      ]);

      res.status(200).json({
        success: true,
        data: leagues,
        message: 'Leagues retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getAllLeagues:', error);
      next(error);
    }
  }

  /**
   * Get league by ID
   * @route GET /api/leagues/:id
   */
  static async getLeagueById(req, res, next) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid league ID is required',
        });
      }

      const league = await LeagueService.getLeagueById(id);

      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
      }

      res.status(200).json({
        success: true,
        data: league,
        message: 'League retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getLeagueById:', error);
      next(error);
    }
  }

  /**
   * Synchronize league from external API to database
   * @route POST /api/leagues/sync
   */
  static async synchronizeLeagueFromAPI(req, res, next) {
    try {
      const { leagueName, leagueCountry } = req.body;

      // Validate required fields
      if (!leagueName?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'League name is required and cannot be empty',
        });
      }

      if (!leagueCountry?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Country is required and cannot be empty',
        });
      }

      // Check if league already exists
      const existingLeague = await LeagueService.findExistingLeague(leagueName, leagueCountry);

      if (existingLeague) {
        return res.status(409).json({
          success: false,
          message: 'League already exists in database',
          data: existingLeague,
        });
      }

      // Fetch leagues from external API
      const response = await http('/', {
        params: {
          action: 'get_leagues',
        },
      });

      if (!response.data || !Array.isArray(response.data)) {
        return res.status(502).json({
          success: false,
          message: 'Invalid response from external API',
        });
      }

      // Find matching league
      const apiLeagueData = response.data.find(
        (league) =>
          league.league_name === leagueName.trim() && league.country_name === leagueCountry.trim()
      );

      if (!apiLeagueData) {
        return res.status(404).json({
          success: false,
          message: `League '${leagueName}' from '${leagueCountry}' not found in external API`,
        });
      }

      // Create league in database
      const newLeague = await LeagueService.createLeague(apiLeagueData);

      res.status(201).json({
        success: true,
        data: newLeague,
        message: 'League synchronized successfully',
      });
    } catch (error) {
      console.error('Error in synchronizeLeagueFromAPI:', error);
      next(error);
    }
  }
}

module.exports = LeagueController;
