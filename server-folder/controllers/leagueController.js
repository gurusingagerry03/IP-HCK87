const { League, Team } = require('../models');
const { http } = require('../helpers/http');
const { BadRequestError, NotFoundError, ConflictError } = require('../helpers/customErrors');

class leagueController {
  static async getAllLeagues(req, res, next) {
    try {
      const leagues = await League.findAll();
      res.status(200).json({
        success: true,
        data: leagues,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeagueById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id) || parseInt(id) <= 0) {
        throw new BadRequestError('League ID must be a positive number');
      }

      const leagueOptions = {
        where: { id: parseInt(id) },
      };

      const league = await League.findOne(leagueOptions);

      if (!league) {
        throw new NotFoundError(`League with ID ${id} not found`);
      }

      res.status(200).json({
        success: true,
        data: league,
      });
    } catch (error) {
      next(error);
    }
  }

  static async synchronizeLeagueFromAPI(req, res, next) {
    try {
      const { leagueName, leagueCountry } = req.body;

      if (!leagueName) {
        throw new BadRequestError('League name is required');
      }

      if (!leagueCountry) {
        throw new BadRequestError('Country is required');
      }

      const existingLeague = await League.findOne({
        where: {
          name: leagueName.trim(),
          country: leagueCountry.trim(),
        },
      });

      if (existingLeague) {
        throw new ConflictError(`League ${leagueName} from ${leagueCountry} already exists`);
      }

      let response;
      try {
        response = await http('/', {
          params: {
            action: 'get_leagues',
          },
        });
      } catch (apiError) {
        throw new BadRequestError('Failed to connect to external league API');
      }

      if (!response.data || !Array.isArray(response.data)) {
        throw new BadRequestError('Invalid response from external API');
      }

      const apiLeagueData = response.data.find(
        (league) =>
          league.league_name?.toLowerCase().trim() === leagueName.toLowerCase().trim() &&
          league.country_name?.toLowerCase().trim() === leagueCountry.toLowerCase().trim()
      );

      if (!apiLeagueData) {
        throw new NotFoundError(
          `League "${leagueName}" from "${leagueCountry}" not found in external API`
        );
      }

      const newLeague = await League.create({
        name: apiLeagueData.league_name,
        country: apiLeagueData.country_name,
        externalRef: apiLeagueData.league_id,
        logoUrl: apiLeagueData.league_logo || null,
      });

      res.status(201).json({
        success: true,
        message: 'League synchronized successfully',
        data: newLeague,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = leagueController;
