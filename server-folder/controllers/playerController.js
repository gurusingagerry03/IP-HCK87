const { Player, Team, League } = require('../models');
const { BadRequestError, NotFoundError } = require('../helpers/customErrors');

class playerController {
  static async getAllPlayers(req, res, next) {
    try {
      const players = await Player.findAll({});

      return res.status(200).json({
        success: true,
        data: players,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPlayersByTeamId(req, res, next) {
    try {
      const { id } = req.params;
      const teamId = parseInt(id);

      if (!teamId || isNaN(teamId)) {
        throw new BadRequestError('Invalid Team ID');
      }

      const team = await Team.findByPk(teamId, {
        include: [
          {
            model: League,
          },
        ],
      });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      const players = await Player.findAll({
        where: { teamId },
        include: [
          {
            model: Team,
            include: [
              {
                model: League,
              },
            ],
          },
        ],
        order: [['fullName', 'ASC']],
      });

      return res.status(200).json({
        success: true,
        data: players,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = playerController;
