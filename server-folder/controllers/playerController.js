const PlayerService = require('../services/playerService');
const TeamService = require('../services/teamService');
const { Team } = require('../models');

/**
 * Player Controller - Handles player-related HTTP requests
 */
class PlayerController {
  /**
   * Get all players with team information
   * @route GET /api/players
   */
  static async getAllPlayers(req, res, next) {
    try {
      const players = await PlayerService.getAllPlayers([
        {
          model: Team,
          attributes: ['name', 'country'],
        },
      ]);

      res.status(200).json({
        success: true,
        data: players,
        message: 'Players retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getAllPlayers:', error);
      next(error);
    }
  }

  /**
   * Get players by team ID
   * @route GET /api/players/team/:teamId
   */
  static async getPlayersByTeamId(req, res, next) {
    try {
      const { teamId } = req.params;

      // Validate teamId
      if (!teamId || isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid team ID is required',
        });
      }

      // Check if team exists
      const team = await TeamService.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      const players = await PlayerService.getPlayersByTeamId(teamId, [
        {
          model: Team,
          attributes: ['name', 'country'],
        },
      ]);

      res.status(200).json({
        success: true,
        data: players,
        team: team.name,
        message: 'Players retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getPlayersByTeamId:', error);
      next(error);
    }
  }

  /**
   * Get player by ID
   * @route GET /api/players/:id
   */
  static async getPlayerById(req, res, next) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid player ID is required',
        });
      }

      const player = await Player.findByPk(id, {
        include: [
          {
            model: Team,
            attributes: ['name', 'country', 'logoUrl'],
          },
        ],
      });

      if (!player) {
        return res.status(404).json({
          success: false,
          message: 'Player not found',
        });
      }

      res.status(200).json({
        success: true,
        data: player,
        message: 'Player retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getPlayerById:', error);
      next(error);
    }
  }
}

module.exports = PlayerController;
