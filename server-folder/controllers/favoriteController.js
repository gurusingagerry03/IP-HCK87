const { Favorite, Team } = require('../models');
const { User } = require('../models');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../helpers/customErrors');
// error throw

class favoriteController {
  static async addFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { teamId } = req.params;

      if (!teamId || isNaN(teamId) || parseInt(teamId) <= 0) {
        throw new BadRequestError('Team ID must be a positive number');
      }
      const newFavorite = await Favorite.create({
        userId,
        teamId: parseInt(teamId),
      });
      return res.status(201).json({
        success: true,
        data: newFavorite,
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }

  static async getFavoritesByUserId(req, res, next) {
    try {
      const userId = req.user.id; // Assuming userId is obtained from authenticated user
      const favorites = await Favorite.findAll({
        where: { userId },
        include: [
          {
            model: Team,
          },
        ],
      });
      return res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeFavorite(req, res, next) {
    try {
      const userId = req.user.id; // Assuming userId is obtained from authenticated user
      const { id } = req.params;
      const favoriteId = parseInt(id);

      if (!favoriteId || isNaN(favoriteId) || favoriteId <= 0) {
        throw new BadRequestError('Favorite ID must be a positive number');
      }
      const favorite = await Favorite.findOne({
        where: { id: favoriteId, userId },
      });

      if (!favorite) {
        throw new NotFoundError(`Favorite with ID ${id} not found for this user`);
      }
      await favorite.destroy();
      return res.status(200).json({
        success: true,
        message: `Favorite with ID ${id} has been removed`,
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = favoriteController;
