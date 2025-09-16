const { Player, Team, League } = require('../models');

class playerController {
  static async getPlayersByTeamId(req, res, next) {
    try {
      const { id } = req.params;
      const teamId = parseInt(id);

      if (!teamId || isNaN(teamId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Team ID',
        });
      }

      const team = await Team.findByPk(teamId, {
        include: [
          {
            model: League,
            attributes: ['id', 'name', 'country'],
          },
        ],
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      const players = await Player.findAll({
        where: { teamId },
        include: [
          {
            model: Team,
            attributes: ['id', 'name', 'logoUrl', 'country'],
            include: [
              {
                model: League,
                attributes: ['id', 'name', 'country'],
              },
            ],
          },
        ],
        order: [['name', 'ASC']],
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
