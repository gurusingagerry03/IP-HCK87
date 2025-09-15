const { Op } = require('sequelize');
const { http } = require('../helpers/http');
const { League, Team, Player, Match } = require('../models');
const qs = require('qs');

/**
 * Synchronizes team data from external API to database
 * @param {Object} data - Team data from external API
 * @param {number} leagueId - League ID to associate team with
 * @returns {Promise<Array>} Upserted team result
 */
const syncTeam = async (data, leagueId) => {
  try {
    // Validate required data
    if (!data.team_name || !data.team_key) {
      throw new Error('Missing required team data: team_name or team_key');
    }

    const team = await Team.upsert(
      {
        leagueId: leagueId,
        name: data.team_name,
        logoUrl: data.team_badge || null,
        foundedYear: data.team_founded || null,
        country: data.team_country || null,
        stadiumName: data.venue?.venue_name || null,
        venueAddress: data.venue?.venue_address || null,
        stadiumCity: data.venue?.venue_city || null,
        stadiumCapacity: data.venue?.venue_capacity || null,
        coach: data.coaches?.[0]?.coach_name || null,
        externalRef: data.team_key,
        lastSyncedAt: new Date(),
      },
      {
        where: { externalRef: data.team_key },
      }
    );
    return team;
  } catch (error) {
    console.error(`Error syncing team ${data.team_name}:`, error);
    throw error;
  }
};

/**
 * Synchronizes player data from external API to database
 * @param {Object} data - Player data from external API
 * @param {number} teamId - Team ID to associate player with
 * @returns {Promise<Array>} Upserted player result
 */
const syncPlayer = async (data, teamId) => {
  try {
    // Validate required data
    if (!data.player_name || !data.player_id) {
      throw new Error('Missing required player data: player_name or player_id');
    }

    return await Player.upsert(
      {
        fullName: data.player_name,
        primaryPosition: data.player_type || null,
        thumbUrl: data.player_image || null,
        externalRef: data.player_id,
        age: data.player_age || null,
        teamId: teamId,
        shirtNumber: data.player_number || null,
      },
      {
        where: { externalRef: data.player_id },
      }
    );
  } catch (error) {
    console.error(`Error syncing player ${data.player_name}:`, error);
    throw error;
  }
};

/**
 * Gets team by external reference ID
 * @param {string} externalRef - External reference ID
 * @returns {Promise<Object|null>} Team object or null
 */
const getTeamByExternalRef = async (externalRef) => {
  try {
    if (!externalRef) {
      return null;
    }
    return await Team.findOne({ where: { externalRef } });
  } catch (error) {
    console.error(`Error getting team by externalRef ${externalRef}:`, error);
    return null;
  }
};

class LeagueController {
  /**
   * Get all leagues with associated teams
   */
  static async getLeagues(req, res, next) {
    try {
      const data = await League.findAll({
        include: {
          model: Team,
        },
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data,
        message: 'Leagues retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getLeagues:', error);
      next(error);
    }
  }

  /**
   * Get all players
   */
  static async getPlayers(req, res, next) {
    try {
      const data = await Player.findAll({
        include: {
          model: Team,
          attributes: ['name', 'country'],
        },
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data,
        message: 'Players retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getPlayers:', error);
      next(error);
    }
  }

  /**
   * Get players by team ID
   */
  static async getPlayersById(req, res, next) {
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
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      const data = await Player.findAll({
        where: { teamId },
        include: {
          model: Team,
          attributes: ['name', 'country'],
        },
        order: [
          ['shirtNumber', 'ASC'],
          ['fullName', 'ASC'],
        ],
      });

      res.status(200).json({
        success: true,
        data,
        team: team.name,
        message: 'Players retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getPlayersById:', error);
      next(error);
    }
  }

  /**
   * Get team by ID
   */
  static async getTeamsById(req, res, next) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid team ID is required',
        });
      }

      const data = await Team.findByPk(id, {
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

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      res.status(200).json({
        success: true,
        data,
        message: 'Team retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getTeamsById:', error);
      next(error);
    }
  }

  /**
   * Synchronize matches from external API to database
   */
  static async syncMatches(req, res, next) {
    try {
      const { id } = req.params;

      // Validate league ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid league ID is required',
        });
      }

      const league = await League.findByPk(id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
      }

      // Fetch matches from external API
      const response = await http('/', {
        params: {
          action: 'get_events',
          league_id: league.externalRef,
          from: '2025-06-01',
          to: '2026-09-02',
        },
      });

      const matches = response.data.filter((e) => e.league_year === '2025/2026');

      if (!matches || matches.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No matches found for synchronization',
          totalMatches: 0,
        });
      }

      // Synchronize matches in parallel with proper error handling
      const syncPromises = matches.map(async (match) => {
        try {
          const [homeTeam, awayTeam] = await Promise.all([
            getTeamByExternalRef(match.match_hometeam_id),
            getTeamByExternalRef(match.match_awayteam_id),
          ]);

          // Skip if teams are not found
          if (!homeTeam || !awayTeam) {
            console.warn(
              `Skipping match ${match.match_id}: Teams not found - Home: ${
                homeTeam?.name || 'N/A'
              }, Away: ${awayTeam?.name || 'N/A'}`
            );
            return { success: false, matchId: match.match_id, reason: 'Teams not found' };
          }

          const [matchResult] = await Match.upsert(
            {
              league_id: league.id,
              home_team_id: homeTeam.id,
              away_team_id: awayTeam.id,
              match_date: match.match_date || null,
              match_time: match.match_time || null,
              home_score: match.match_hometeam_ft_score || null,
              away_score: match.match_awayteam_ft_score || null,
              status: match.match_status || '',
              venue: homeTeam.stadiumName || null,
              externalRef: match.match_id,
            },
            {
              where: { externalRef: match.match_id },
            }
          );

          return { success: true, matchId: match.match_id, created: matchResult };
        } catch (error) {
          console.error(`Error syncing match ${match.match_id}:`, error);
          return { success: false, matchId: match.match_id, error: error.message };
        }
      });

      // Wait for all sync operations to complete
      const results = await Promise.all(syncPromises);

      // Count successful and failed syncs
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      res.status(200).json({
        success: true,
        message: 'Match synchronization completed',
        totalMatches: matches.length,
        successful,
        failed,
        syncedAt: new Date(),
        details: process.env.NODE_ENV === 'development' ? results : undefined,
      });
    } catch (error) {
      console.error('Error in syncMatches:', error);
      next(error);
    }
  }

  /**
   * Get teams with filtering, search, and pagination
   */
  static async getTeams(req, res, next) {
    try {
      const { filter, q, page } = qs.parse(req.query);
      const paramsQuerySQL = { where: {} };

      // Add country filter
      if (filter) {
        paramsQuerySQL.where.country = filter;
      }

      // Add search query
      if (q) {
        paramsQuerySQL.where.name = { [Op.iLike]: `%${q}%` };
      }

      // Pagination setup
      let limit = 9;
      let pageNumber = 1;

      if (page) {
        if (page.size) {
          limit = Math.min(parseInt(page.size) || 9, 50); // Max 50 items per page
          paramsQuerySQL.limit = limit;
        }
        if (page.number) {
          pageNumber = Math.max(parseInt(page.number) || 1, 1); // Min page 1
          paramsQuerySQL.offset = limit * (pageNumber - 1);
        }
      }

      // Add include for League data
      paramsQuerySQL.include = {
        model: League,
        attributes: ['name', 'country'],
      };

      // Add ordering
      paramsQuerySQL.order = [['name', 'ASC']];

      const { rows, count } = await Team.findAndCountAll(paramsQuerySQL);

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);
      const hasNext = pageNumber < totalPages;
      const hasPrev = pageNumber > 1;

      res.status(200).json({
        success: true,
        data: rows,
        meta: {
          page: pageNumber,
          limit,
          total: count,
          totalPages,
          hasNext,
          hasPrev,
        },
        message: 'Teams retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getTeams:', error);
      next(error);
    }
  }

  /**
   * Synchronize teams and players from external API to database
   */
  static async syncTeamPlayer(req, res, next) {
    try {
      const { id } = req.params;

      // Validate league ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid league ID is required',
        });
      }

      const league = await League.findByPk(id);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
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

      // Process teams sequentially to avoid overwhelming the database
      for (const teamData of response.data) {
        try {
          // Sync team
          const team = await syncTeam(teamData, id);
          const teamId = team[0].id;
          totalTeamsSynced++;

          // Sync players for this team
          if (teamData.players && Array.isArray(teamData.players)) {
            const playerPromises = teamData.players.map((player) =>
              syncPlayer(player, teamId).catch((error) => {
                console.error(`Error syncing player ${player.player_name}:`, error);
                return { error: error.message, playerName: player.player_name };
              })
            );

            const playerResults = await Promise.all(playerPromises);
            const successfulPlayers = playerResults.filter((result) => !result.error).length;
            totalPlayersSynced += successfulPlayers;

            syncResults.push({
              team: teamData.team_name,
              teamSynced: true,
              playersTotal: teamData.players.length,
              playersSynced: successfulPlayers,
              playerErrors: playerResults.filter((result) => result.error),
            });
          } else {
            syncResults.push({
              team: teamData.team_name,
              teamSynced: true,
              playersTotal: 0,
              playersSynced: 0,
              playerErrors: [],
            });
          }
        } catch (error) {
          console.error(`Error syncing team ${teamData.team_name}:`, error);
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
      console.error('Error in syncTeamPlayer:', error);
      next(error);
    }
  }

  /**
   * Synchronize league from external API to database
   */
  static async syncLeagues(req, res, next) {
    try {
      const { leagueName, leagueCountry } = req.body;

      // Validate required fields
      if (!leagueName?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'League name is required and cannot be empty',
        });
      }

      if (!leagueCountry?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Country is required and cannot be empty',
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
        return res.status(409).json({
          success: false,
          message: 'League already exists in database',
          data: existingLeague,
        });
      }

      // Fetch leagues from external API
      const response = await http('/', {
        params: {
          action: 'get_leagues',
        },
      });

      if (!response.data || !Array.isArray(response.data)) {
        return res.status(502).json({
          success: false,
          message: 'Invalid response from external API',
        });
      }

      // Find matching league
      const result = response.data.find(
        (league) =>
          league.league_name === leagueName.trim() && league.country_name === leagueCountry.trim()
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: `League '${leagueName}' from '${leagueCountry}' not found in external API`,
        });
      }

      // Create league in database
      const league = await League.create({
        name: result.league_name,
        country: result.country_name,
        externalRef: result.league_id,
        logoUrl: result.league_logo || null,
      });

      res.status(201).json({
        success: true,
        data: league,
        message: 'League synchronized successfully',
      });
    } catch (error) {
      console.error('Error in syncLeagues:', error);
      next(error);
    }
  }
}

module.exports = LeagueController;
