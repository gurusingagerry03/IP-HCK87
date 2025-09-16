const { Team, League, Player } = require('../models');
const { Op } = require('sequelize');
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

      const queryOptions = {
        where: {},
        order: [['name', 'ASC']],
        include: [
          {
            model: League,
            attributes: ['name', 'country'],
          },
        ],
      };

      // Only add pagination if page is provided
      if (page?.number && page?.size) {
        queryOptions.limit = Math.min(parseInt(page.size), 50);
        queryOptions.offset = (parseInt(page.number) - 1) * Math.min(parseInt(page.size), 50);
      }

      if (filter && filter.trim() !== '') {
        queryOptions.where.country = filter;
      }

      if (q && q.trim() !== '') {
        queryOptions.where.name = { [Op.iLike]: `%${q}%` };
      }

      const result = await Team.findAndCountAll(queryOptions);

      // Build pagination metadata
      let paginationMeta = null;
      if (page?.number && page?.size) {
        const totalPages = Math.ceil(result.count / queryOptions.limit);
        paginationMeta = {
          page: parseInt(page.number),
          totalPages: totalPages,
          total: result.count,
          hasNext: parseInt(page.number) < totalPages,
          hasPrev: parseInt(page.number) > 1,
        };
      } else {
        // No pagination - return simple meta
        paginationMeta = {
          total: result.count,
        };
      }

      res.status(200).json({
        success: true,
        data: result.rows,
        meta: paginationMeta,
        message: 'Teams retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get teams by league ID
   * @route GET /api/teams/league/:leagueId
   */
  static async getTeamsByLeague(req, res, next) {
    try {
      const { leagueId } = req.params;
      const { page } = qs.parse(req.query);

      // Validate league ID
      if (!leagueId || isNaN(leagueId)) {
        const error = new Error('Valid league ID is required');
        error.name = 'BadRequest';
        throw error;
      }

      // Check if league exists
      const league = await League.findByPk(leagueId);
      if (!league) {
        const error = new Error('League not found');
        error.name = 'NotFound';
        throw error;
      }

      const queryOptions = {
        where: { leagueId: leagueId },
        order: [['name', 'ASC']],
        include: [
          {
            model: League,
            attributes: ['name', 'country'],
          },
        ],
      };

      // Only add pagination if page is provided
      if (page?.number && page?.size) {
        queryOptions.limit = Math.min(parseInt(page.size), 50);
        queryOptions.offset = (parseInt(page.number) - 1) * Math.min(parseInt(page.size), 50);
      }

      const result = await Team.findAndCountAll(queryOptions);

      // Build pagination metadata
      let paginationMeta = null;
      if (page?.number && page?.size) {
        const totalPages = Math.ceil(result.count / queryOptions.limit);
        paginationMeta = {
          page: parseInt(page.number),
          totalPages: totalPages,
          total: result.count,
          hasNext: parseInt(page.number) < totalPages,
          hasPrev: parseInt(page.number) > 1,
        };
      } else {
        // No pagination - return simple meta
        paginationMeta = {
          total: result.count,
        };
      }

      res.status(200).json({
        success: true,
        data: result.rows,
        meta: paginationMeta,
        message: 'Teams retrieved successfully',
        league: league.name,
      });
    } catch (error) {
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
        const error = new Error('Valid team ID is required');
        error.name = 'BadRequest';
        throw error;
      }

      const team = await Team.findOne({
        where: { id: id },
        include: [
          {
            model: League,
            attributes: ['name', 'country'],
          },
          {
            model: Player,
            limit: 10,
            order: [['shirtNumber', 'ASC']],
          },
        ],
      });

      if (!team) {
        const error = new Error('Team not found');
        error.name = 'NotFound';
        throw error;
      }

      res.status(200).json({
        success: true,
        data: team,
        message: 'Team retrieved successfully',
      });
    } catch (error) {
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
        const error = new Error('Valid league ID is required');
        error.name = 'BadRequest';
        throw error;
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        const error = new Error('League not found');
        error.name = 'NotFound';
        throw error;
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

      // Helper function to synchronize team from API
      const synchronizeTeamFromAPI = async (teamData, leagueId) => {
        try {
          // Validate required data
          if (!teamData.team_name || !teamData.team_key) {
            throw new Error('Missing required team data: team_name or team_key');
          }

          const team = await Team.upsert({
            leagueId: leagueId,
            name: teamData.team_name,
            logoUrl: teamData.team_badge || null,
            foundedYear: teamData.team_founded || null,
            country: teamData.team_country || null,
            stadiumName: teamData.venue?.venue_name || null,
            venueAddress: teamData.venue?.venue_address || null,
            stadiumCity: teamData.venue?.venue_city || null,
            stadiumCapacity: teamData.venue?.venue_capacity || null,
            coach: teamData.coaches?.[0]?.coach_name || null,
            externalRef: teamData.team_key,
            lastSyncedAt: new Date(),
          });

          return team;
        } catch (error) {
          throw error;
        }
      };

      // Helper function to batch synchronize players
      const batchSynchronizePlayers = async (playersData, teamId) => {
        try {
          const results = {
            successful: 0,
            failed: 0,
            errors: [],
          };

          if (!Array.isArray(playersData) || playersData.length === 0) {
            return results;
          }

          const playerPromises = playersData.map(async (playerData) => {
            try {
              // Validate required data
              if (!playerData.player_name || !playerData.player_id) {
                throw new Error('Missing required player data: player_name or player_id');
              }

              await Player.upsert({
                fullName: playerData.player_name,
                primaryPosition: playerData.player_type || null,
                thumbUrl: playerData.player_image || null,
                externalRef: playerData.player_id,
                age: playerData.player_age || null,
                teamId: teamId,
                shirtNumber: playerData.player_number || null,
              });

              results.successful++;
              return { success: true, playerName: playerData.player_name };
            } catch (error) {
              results.failed++;
              const errorInfo = {
                playerName: playerData.player_name,
                error: error.message,
              };
              results.errors.push(errorInfo);
              return { success: false, ...errorInfo };
            }
          });

          await Promise.all(playerPromises);

          return results;
        } catch (error) {
          throw error;
        }
      };

      // Process teams sequentially to avoid overwhelming the database
      for (const teamData of response.data) {
        try {
          // Sync team
          const team = await synchronizeTeamFromAPI(teamData, leagueId);
          const teamId = team[0].id;
          totalTeamsSynced++;

          // Sync players for this team
          const playerResults = await batchSynchronizePlayers(teamData.players || [], teamId);

          totalPlayersSynced += playerResults.successful;

          syncResults.push({
            team: teamData.team_name,
            teamSynced: true,
            playersTotal: teamData.players?.length || 0,
            playersSynced: playerResults.successful,
            playerErrors: playerResults.errors,
          });
        } catch (error) {
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
      next(error);
    }
  }
}

module.exports = TeamController;
