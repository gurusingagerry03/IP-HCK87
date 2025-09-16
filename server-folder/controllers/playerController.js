const { Player, Team } = require('../models');

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
      const options = {
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Team,
            attributes: ['name', 'country'],
          },
        ],
      };

      const players = await Player.findAll(options);

      res.status(200).json({
        success: true,
        data: players,
        message: 'Players retrieved successfully',
      });
    } catch (error) {
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
        const error = new Error('Valid team ID is required');
        error.name = 'BadRequest';
        throw error;
      }

      // Check if team exists
      const team = await Team.findOne({ where: { id: teamId } });
      if (!team) {
        const error = new Error('Team not found');
        error.name = 'NotFound';
        throw error;
      }

      const options = {
        where: { teamId },
        order: [
          ['shirtNumber', 'ASC'],
          ['fullName', 'ASC'],
        ],
        include: [
          {
            model: Team,
            attributes: ['name', 'country'],
          },
        ],
      };

      const players = await Player.findAll(options);

      res.status(200).json({
        success: true,
        data: players,
        team: team.name,
        message: 'Players retrieved successfully',
      });
    } catch (error) {
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
        const error = new Error('Valid player ID is required');
        error.name = 'BadRequest';
        throw error;
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
        const error = new Error('Player not found');
        error.name = 'NotFound';
        throw error;
      }

      res.status(200).json({
        success: true,
        data: player,
        message: 'Player retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PlayerController;
