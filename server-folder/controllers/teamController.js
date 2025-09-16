const { Team, League, Player } = require('../models');
const { http } = require('../helpers/http');
const { Op } = require('sequelize');
const { BadRequestError, NotFoundError } = require('../helpers/customErrors');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({});

async function descriptionGeneration(teamData) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: ` Generate a professional club information description for this football team. 
      Keep it exactly 2-3 sentences, around 50-70 words maximum.
      Include: team name, location, founding year, and brief history/characteristics.
      DO NOT mention stadium name or capacity.
      Make it sound professional and informative like a club profile.
      
      Team Details:
      - Name: ${teamData.name}
      - Country: ${teamData.country}  
      - Founded: ${teamData.foundedYear}

      - Coach: ${teamData.coach || 'N/A'}
      
      Example format: "[Team] is a professional football club based in [City], [Country]. Founded in [Year], the club has a rich history and continues to compete at the highest level of football."`,
  });

  return response.text;
}

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
        throw new BadRequestError('Team ID must be a positive number');
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
        throw new NotFoundError(`Team with ID ${id} not found`);
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
        throw new BadRequestError('League ID is required');
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        throw new NotFoundError('League not found');
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
        throw new BadRequestError('Failed to connect to external team API');
      }

      if (!teamsResponse.data || !Array.isArray(teamsResponse.data)) {
        throw new BadRequestError('Invalid response from external API');
      }

      const syncResults = {
        totalTeam: 0,
        totalPlayer: 0,
        errors: [],
      };

      try {
        // DEDUPLICATION: Remove duplicate teams berdasarkan externalRef
        const uniqueTeamsMap = new Map();
        teamsResponse.data.forEach((apiTeamData) => {
          if (!uniqueTeamsMap.has(apiTeamData.team_key)) {
            uniqueTeamsMap.set(apiTeamData.team_key, apiTeamData);
          }
        });

        // OPTIMASI: Bulk create/update teams dengan bulkCreate
        const teamsData = Array.from(uniqueTeamsMap.values()).map((apiTeamData) => ({
          leagueId: leagueId,
          name: apiTeamData.team_name,
          logoUrl: apiTeamData.team_badge || null,
          foundedYear: apiTeamData.team_founded ? parseInt(apiTeamData.team_founded) : null,
          country: apiTeamData.team_country || league.country,
          stadiumName: apiTeamData.venue?.venue_name || null,
          venueAddress: apiTeamData.venue?.venue_address || null,
          stadiumCity: apiTeamData.venue?.venue_city || null,
          stadiumCapacity: apiTeamData.venue?.venue_capacity
            ? parseInt(apiTeamData.venue.venue_capacity)
            : null,
          coach: apiTeamData.coaches?.[0]?.coach_name || null,
          externalRef: apiTeamData.team_key,
          lastSyncedAt: new Date(),
        }));

        // Bulk create/update teams dengan field yang benar
        const teamResults = await Team.bulkCreate(teamsData, {
          updateOnDuplicate: [
            'name',
            'logoUrl',
            'foundedYear',
            'country',
            'stadiumName',
            'venueAddress',
            'stadiumCity',
            'stadiumCapacity',
            'coach',
            'lastSyncedAt',
          ],
          returning: true,
        });

        syncResults.totalTeam = teamResults.filter((result) => result._options.isNewRecord).length;

        // OPTIMASI: Bulk create/update players dengan deduplication
        const uniquePlayersMap = new Map();

        // Use unique teams data instead of original response
        for (const apiTeamData of Array.from(uniqueTeamsMap.values())) {
          if (apiTeamData.players && Array.isArray(apiTeamData.players)) {
            // Find team ID dari hasil bulk create
            const team = teamResults.find((t) => t.externalRef === apiTeamData.team_key);

            if (team) {
              // DEDUPLICATION: Remove duplicate players berdasarkan externalRef
              apiTeamData.players.forEach((apiPlayerData) => {
                if (!uniquePlayersMap.has(apiPlayerData.player_id)) {
                  uniquePlayersMap.set(apiPlayerData.player_id, {
                    fullName: apiPlayerData.player_name,
                    primaryPosition: apiPlayerData.player_type || null,
                    thumbUrl: apiPlayerData.player_image || null,
                    externalRef: apiPlayerData.player_id,
                    age: apiPlayerData.player_age ? parseInt(apiPlayerData.player_age) : null,
                    teamId: team.id,
                    shirtNumber: apiPlayerData.player_number
                      ? parseInt(apiPlayerData.player_number)
                      : null,
                  });
                }
              });
            }
          }
        }

        // Convert map to array untuk bulk create
        const uniquePlayersData = Array.from(uniquePlayersMap.values());

        if (uniquePlayersData.length > 0) {
          // Bulk create/update players
          const playerResults = await Player.bulkCreate(uniquePlayersData, {
            updateOnDuplicate: [
              'fullName',
              'primaryPosition',
              'thumbUrl',
              'age',
              'teamId',
              'shirtNumber',
            ],
            returning: true,
          });

          syncResults.totalPlayer = playerResults.filter(
            (result) => result._options.isNewRecord
          ).length;
        }
      } catch (bulkError) {
        console.error('Bulk operation error:', bulkError);
        syncResults.errors.push(`Bulk operation failed: ${bulkError.message}`);
      }
      return res.status(200).json({
        success: true,
        data: syncResults,
        message: 'Teams and players synchronization completed',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}

module.exports = teamController;
