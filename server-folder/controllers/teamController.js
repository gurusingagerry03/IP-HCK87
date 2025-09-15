const TeamService = require('../services/teamService');
const PlayerService = require('../services/playerService');
const { League, Player } = require('../models');
const { http } = require('../helpers/http');
const qs = require('qs');

/**
 * Team Controller - Handles team-related HTTP requests
 */
class TeamController {
  /**
   * Get teams with filtering, search, and pagination
   * @route GET /api/teams
   */
  static async getAllTeamsWithFilters(req, res, next) {
    try {
      const { filter, q, page } = qs.parse(req.query);

      const filters = {
        country: filter,
        search: q,
        page: page?.number || 1,
        limit: page?.size || 9,
        includeModels: [
          {
            model: League,
            attributes: ['name', 'country'],
          },
        ],
      };

      const result = await TeamService.getTeamsWithPagination(filters);

      res.status(200).json({
        success: true,
        data: result.teams,
        meta: result.pagination,
        message: 'Teams retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getAllTeamsWithFilters:', error);
      next(error);
    }
  }

  /**
   * Get team by ID with details
   * @route GET /api/teams/:id
   */
  static async getTeamById(req, res, next) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid team ID is required',
        });
      }

      const team = await TeamService.getTeamById(id, [
        {
          model: League,
          attributes: ['name', 'country'],
        },
        {
          model: Player,
          limit: 10,
          order: [['shirtNumber', 'ASC']],
        },
      ]);

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      res.status(200).json({
        success: true,
        data: team,
        message: 'Team retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getTeamById:', error);
      next(error);
    }
  }

  /**
   * Synchronize teams and players from external API to database
   * @route POST /api/teams/sync/:leagueId
   */
  static async synchronizeTeamsAndPlayersFromAPI(req, res, next) {
    try {
      const { leagueId } = req.params;

      // Validate league ID
      if (!leagueId || isNaN(leagueId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid league ID is required',
        });
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
      }

      // Fetch teams from external API
      const response = await http('/', {
        params: {
          action: 'get_teams',
          league_id: league.externalRef,
        },
      });

      if (!response.data || response.data.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No teams found for synchronization',
          totalTeams: 0,
          totalPlayers: 0,
        });
      }

      let totalTeamsSynced = 0;
      let totalPlayersSynced = 0;
      const syncResults = [];

      // Process teams sequentially to avoid overwhelming the database
      for (const teamData of response.data) {
        try {
          // Sync team
          const team = await TeamService.synchronizeTeamFromAPI(teamData, leagueId);
          const teamId = team[0].id;
          totalTeamsSynced++;

          // Sync players for this team
          const playerResults = await PlayerService.batchSynchronizePlayers(
            teamData.players || [],
            teamId
          );

          totalPlayersSynced += playerResults.successful;

          syncResults.push({
            team: teamData.team_name,
            teamSynced: true,
            playersTotal: teamData.players?.length || 0,
            playersSynced: playerResults.successful,
            playerErrors: playerResults.errors,
          });
        } catch (error) {
          console.error(`Error syncing team ${teamData.team_name}:`, error);
          syncResults.push({
            team: teamData.team_name,
            teamSynced: false,
            error: error.message,
            playersTotal: 0,
            playersSynced: 0,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Team and player synchronization completed',
        totalTeams: response.data.length,
        totalTeamsSynced,
        totalPlayersSynced,
        syncedAt: new Date(),
        details: process.env.NODE_ENV === 'development' ? syncResults : undefined,
      });
    } catch (error) {
      console.error('Error in synchronizeTeamsAndPlayersFromAPI:', error);
      next(error);
    }
  }
}

module.exports = TeamController;
