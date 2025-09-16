const { Team, League, Player } = require('../models');
const { http } = require('../helpers/http');
const { Op } = require('sequelize');

class teamController {
  static async getAllTeams(req, res, next) {
    try {
      const {
        q: search,
        filter: country,
        sort = 'name',
        'page[number]': pageNumber = 1,
        'page[size]': pageSize = 10,
      } = req.query;

      let whereCondition = {};

      if (search?.trim()) {
        whereCondition = {
          ...whereCondition,
          [Op.or]: [
            { name: { [Op.iLike]: `%${search.trim()}%` } },
            { country: { [Op.iLike]: `%${search.trim()}%` } },
          ],
        };
      }

      if (country?.trim()) {
        whereCondition.country = {
          [Op.iLike]: `%${country.trim()}%`,
        };
      }

      const limit = Math.min(parseInt(pageSize), 50);
      const offset = (parseInt(pageNumber) - 1) * limit;

      const { count, rows } = await Team.findAndCountAll({
        where: whereCondition,
        limit: limit,
        offset: offset,
        order: [[sort, 'ASC']],
        include: [
          {
            model: League,
            attributes: ['id', 'name', 'country'],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);
      const currentPage = parseInt(pageNumber);

      res.status(200).json({
        data: rows,
        meta: {
          page: currentPage,
          totalPages: totalPages,
          total: count,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id) || parseInt(id) <= 0) {
        throw { name: 'BadRequest', message: 'Team ID must be a positive number' };
      }

      const team = await Team.findByPk(parseInt(id), {
        include: [
          {
            model: League,
          },
          {
            model: Player,
          },
        ],
      });

      if (!team) {
        throw { name: 'NotFound', message: `Team with ID ${id} not found` };
      }

      res.status(200).json(team);
    } catch (error) {
      console.log(error);

      next(error);
    }
  }

  static async synchronizeTeamsAndPlayersFromAPI(req, res, next) {
    try {
      const { leagueId } = req.params;

      if (!leagueId) {
        throw { name: 'BadRequest', message: 'League ID is required' };
      }

      // Check if league exists
      const league = await League.findByPk(leagueId);
      if (!league) {
        throw { name: 'NotFound', message: 'League not found' };
      }

      let teamsResponse;
      try {
        teamsResponse = await http('/', {
          params: {
            action: 'get_teams',
            league_id: league.externalRef || league.id,
          },
        });
      } catch (apiError) {
        throw { name: 'BadRequest', message: 'Failed to connect to external team API' };
      }

      if (!teamsResponse.data || !Array.isArray(teamsResponse.data)) {
        throw { name: 'BadRequest', message: 'Invalid response from external API' };
      }

      const syncResults = {
        teamsAdded: 0,
        teamsUpdated: 0,
        playersAdded: 0,
        playersUpdated: 0,
        errors: [],
      };

      // Process each team
      for (const apiTeamData of teamsResponse.data) {
        try {
          // Check if team exists
          let team = await Team.findOne({
            where: {
              externalRef: apiTeamData.team_key,
            },
          });

          if (!team) {
            // Create new team
            team = await Team.create({
              name: apiTeamData.team_name,
              logoUrl: apiTeamData.team_logo || null,
              country: apiTeamData.team_country || league.country,
              foundedYear: apiTeamData.team_founded || null,
              stadiumName: apiTeamData.venue_name || null,
              leagueId: leagueId,
              externalRef: apiTeamData.team_key,
            });
            syncResults.teamsAdded++;
          } else {
            // Update existing team
            await team.update({
              name: apiTeamData.team_name,
              logoUrl: apiTeamData.team_logo || null,
              country: apiTeamData.team_country || league.country,
              foundedYear: apiTeamData.team_founded || null,
              stadiumName: apiTeamData.venue_name || null,
            });
            syncResults.teamsUpdated++;
          }

          // Sync players for this team
          let playersResponse;
          try {
            playersResponse = await http('/', {
              params: {
                action: 'get_players',
                team_id: apiTeamData.team_key,
              },
            });

            if (playersResponse.data && Array.isArray(playersResponse.data)) {
              // Process each player
              for (const apiPlayerData of playersResponse.data) {
                try {
                  let player = await Player.findOne({
                    where: {
                      externalRef: apiPlayerData.player_key,
                    },
                  });
                  if (!player) {
                    // Create new player
                    await Player.create({
                      fullName: apiPlayerData.player_name,
                      primaryPosition: apiPlayerData.player_type || null,
                      teamId: team.id,
                      age: apiPlayerData.player_age || null,
                      externalRef: apiPlayerData.player_key,
                    });
                    syncResults.playersAdded++;
                  } else {
                    // Update existing player
                    await player.update({
                      name: apiPlayerData.player_name,
                      position: apiPlayerData.player_type || null,
                      age: apiPlayerData.player_age || null,
                      nationality: apiPlayerData.player_country || null,
                      teamId: team.id,
                    });
                    syncResults.playersUpdated++;
                  }
                } catch (playerError) {
                  console.error(`Error syncing player ${apiPlayerData.player_name}:`, playerError);
                  syncResults.errors.push(
                    `Player ${apiPlayerData.player_name}: ${playerError.message}`
                  );
                }
              }
            }
          } catch (playersApiError) {
            console.error(
              `Error fetching players for team ${apiTeamData.team_name}:`,
              playersApiError
            );
            syncResults.errors.push(
              `Players for ${apiTeamData.team_name}: Failed to fetch from API`
            );
          }
        } catch (teamError) {
          console.error(`Error syncing team ${apiTeamData.team_name}:`, teamError);
          syncResults.errors.push(`Team ${apiTeamData.team_name}: ${teamError.message}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Teams and players synchronization completed',
        data: syncResults,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = teamController;
