const { League, Team } = require('../models');
const { http } = require('../helpers/http');
const { NotFoundError, BadRequestError, ConflictError } = require('../helpers/customErrors');

/**
 * League Controller - Handles league-related HTTP requests
 */
class LeagueController {
  /**
   * Get all leagues with enhanced information and filtering
   * @route GET /api/leagues
   */
  static async getAllLeagues(req, res, next) {
    try {
      const { country, search, includeTeams = 'true' } = req.query;

      let whereCondition = {};

      // Add country filter
      if (country?.trim()) {
        whereCondition.country = {
          [require('sequelize').Op.iLike]: `%${country.trim()}%`,
        };
      }

      // Add search functionality
      if (search?.trim()) {
        whereCondition = {
          ...whereCondition,
          [require('sequelize').Op.or]: [
            { name: { [require('sequelize').Op.iLike]: `%${search.trim()}%` } },
            { country: { [require('sequelize').Op.iLike]: `%${search.trim()}%` } },
          ],
        };
      }

      const options = {
        where: whereCondition,
        order: [['createdAt', 'DESC']],
        ...(includeTeams === 'true' && {
          include: [
            {
              model: Team,
              attributes: ['id', 'name', 'logoUrl', 'country'],
            },
          ],
        }),
      };

      const leagues = await League.findAll(options);

      // Calculate statistics
      const stats = {
        totalLeagues: leagues.length,
        ...(includeTeams === 'true' && {
          totalTeams: leagues.reduce((acc, league) => acc + (league.Teams?.length || 0), 0),
          averageTeamsPerLeague:
            leagues.length > 0
              ? Math.round(
                  (leagues.reduce((acc, league) => acc + (league.Teams?.length || 0), 0) /
                    leagues.length) *
                    100
                ) / 100
              : 0,
        }),
        ...(country && { filteredByCountry: country }),
        ...(search && { searchQuery: search }),
      };

      res.status(200).json({
        success: true,
        data: leagues,
        meta: {
          statistics: stats,
          filters: {
            ...(country && { country }),
            ...(search && { search }),
            includeTeams: includeTeams === 'true',
          },
        },
        message: `Successfully retrieved ${leagues.length} league(s)${
          country ? ` from ${country}` : ''
        }${search ? ` matching "${search}"` : ''}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get league by ID with detailed information
   * @route GET /api/leagues/:id
   */
  static async getLeagueById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeTeams = 'true' } = req.query;

      // Enhanced validation
      if (!id || isNaN(id) || parseInt(id) <= 0) {
        throw new BadRequestError('League ID must be a positive number', {
          providedValue: id,
          expectedFormat: 'positive integer',
        });
      }

      const leagueOptions = {
        where: { id: parseInt(id) },
        ...(includeTeams === 'true' && {
          include: [
            {
              model: Team,
              attributes: ['id', 'name', 'logoUrl', 'country', 'foundedYear', 'stadiumName'],
              order: [['name', 'ASC']],
            },
          ],
        }),
      };

      const league = await League.findOne(leagueOptions);

      if (!league) {
        throw new NotFoundError(`League with ID ${id} not found`, {
          resource: 'League',
          searchedId: id,
        });
      }

      // Enhanced league information
      const enhancedLeague = {
        ...league.toJSON(),
        meta: {
          ...(includeTeams === 'true' && {
            totalTeams: league.Teams?.length || 0,
            teamCountries:
              [...new Set(league.Teams?.map((team) => team.country).filter(Boolean))] || [],
          }),
          dataSource: league.externalRef ? 'External API' : 'Manual Entry',
          lastUpdated: league.updatedAt,
        },
      };

      res.status(200).json({
        success: true,
        data: enhancedLeague,
        message: `League details for ${league.name} retrieved successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Synchronize league from external API with enhanced validation and feedback
   * @route POST /api/leagues/sync
   */
  static async synchronizeLeagueFromAPI(req, res, next) {
    try {
      const { leagueName, leagueCountry } = req.body;

      // Enhanced validation
      const validationErrors = [];

      if (!leagueName?.trim()) {
        validationErrors.push({
          field: 'leagueName',
          message: 'League name is required and cannot be empty',
        });
      } else if (leagueName.trim().length < 2) {
        validationErrors.push({
          field: 'leagueName',
          message: 'League name must be at least 2 characters long',
        });
      }

      if (!leagueCountry?.trim()) {
        validationErrors.push({
          field: 'leagueCountry',
          message: 'Country is required and cannot be empty',
        });
      } else if (leagueCountry.trim().length < 2) {
        validationErrors.push({
          field: 'leagueCountry',
          message: 'Country must be at least 2 characters long',
        });
      }

      if (validationErrors.length > 0) {
        throw new BadRequestError('League synchronization validation failed', {
          validationErrors,
          suggestion: 'Please provide valid league name and country',
        });
      }

      // Check if league already exists
      const existingLeague = await League.findOne({
        where: {
          name: leagueName.trim(),
          country: leagueCountry.trim(),
        },
      });

      if (existingLeague) {
        throw new ConflictError(
          `League "${leagueName}" from "${leagueCountry}" already exists in database`,
          {
            existingLeague: {
              id: existingLeague.id,
              name: existingLeague.name,
              country: existingLeague.country,
              createdAt: existingLeague.createdAt,
            },
          }
        );
      }

      // Fetch leagues from external API
      let response;
      try {
        response = await http('/', {
          params: {
            action: 'get_leagues',
          },
        });
      } catch (apiError) {
        const error = new Error('Failed to connect to external league API');
        error.name = 'BadGateway';
        error.statusCode = 502;
        error.originalError = apiError.message;
        throw error;
      }

      if (!response.data || !Array.isArray(response.data)) {
        const error = new Error('Invalid response format from external API');
        error.name = 'BadGateway';
        error.statusCode = 502;
        error.details = {
          responseType: typeof response.data,
          isArray: Array.isArray(response.data),
        };
        throw error;
      }

      // Find matching league with case-insensitive search
      const apiLeagueData = response.data.find(
        (league) =>
          league.league_name?.toLowerCase().trim() === leagueName.toLowerCase().trim() &&
          league.country_name?.toLowerCase().trim() === leagueCountry.toLowerCase().trim()
      );

      if (!apiLeagueData) {
        // Provide helpful suggestions
        const similarLeagues = response.data
          .filter(
            (league) =>
              league.league_name?.toLowerCase().includes(leagueName.toLowerCase()) ||
              league.country_name?.toLowerCase().includes(leagueCountry.toLowerCase())
          )
          .slice(0, 5);

        throw new NotFoundError(
          `League "${leagueName}" from "${leagueCountry}" not found in external API`,
          {
            searchedFor: { leagueName, leagueCountry },
            totalAvailableLeagues: response.data.length,
            ...(similarLeagues.length > 0 && {
              suggestions: similarLeagues.map((league) => ({
                name: league.league_name,
                country: league.country_name,
                id: league.league_id,
              })),
            }),
          }
        );
      }

      // Create league in database
      const newLeague = await League.create({
        name: apiLeagueData.league_name,
        country: apiLeagueData.country_name,
        externalRef: apiLeagueData.league_id,
        logoUrl: apiLeagueData.league_logo || null,
      });

      res.status(201).json({
        success: true,
        data: {
          league: newLeague,
          sourceData: {
            externalApiId: apiLeagueData.league_id,
            logoAvailable: !!apiLeagueData.league_logo,
            syncedAt: new Date(),
          },
        },
        message: `League "${newLeague.name}" from "${newLeague.country}" synchronized successfully from external API`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LeagueController;
