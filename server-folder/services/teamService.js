const { Team } = require('../models');

/**
 * Team Service - Handles team-related business logic
 */
class TeamService {
  /**
   * Synchronizes team data from external API to database
   * @param {Object} teamData - Team data from external API
   * @param {number} leagueId - League ID to associate team with
   * @returns {Promise<Array>} Upserted team result
   */
  static async synchronizeTeamFromAPI(teamData, leagueId) {
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
      console.error(`Error syncing team ${teamData.team_name}:`, error);
      throw error;
    }
  }

  /**
   * Gets team by external reference ID
   * @param {string} externalRef - External reference ID
   * @returns {Promise<Object|null>} Team object or null
   */
  static async getTeamByExternalRef(externalRef) {
    try {
      if (!externalRef) {
        return null;
      }
      return await Team.findOne({ where: { externalRef } });
    } catch (error) {
      console.error(`Error getting team by externalRef ${externalRef}:`, error);
      return null;
    }
  }

  /**
   * Get team by ID with optional includes
   * @param {number} teamId - Team ID
   * @param {Array} includeModels - Models to include in the query
   * @returns {Promise<Object|null>} Team object or null
   */
  static async getTeamById(teamId, includeModels = []) {
    try {
      const options = { where: { id: teamId } };
      if (includeModels.length > 0) {
        options.include = includeModels;
      }

      return await Team.findOne(options);
    } catch (error) {
      console.error(`Error getting team by ID ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Get teams with filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Teams with pagination data
   */
  static async getTeamsWithPagination(filters) {
    try {
      const { country, search, leagueId, page = null, limit = null, includeModels = [] } = filters;

      const queryOptions = {
        where: {},
        order: [['name', 'ASC']],
      };

      // Only add pagination if page is provided
      if (page && limit) {
        queryOptions.limit = Math.min(parseInt(limit), 50);
        queryOptions.offset = (parseInt(page) - 1) * Math.min(parseInt(limit), 50);
      }

      if (leagueId) {
        queryOptions.where.leagueId = leagueId;
      }

      if (country && country.trim() !== '') {
        queryOptions.where.country = country;
      }

      if (search && search.trim() !== '') {
        queryOptions.where.name = { [require('sequelize').Op.iLike]: `%${search}%` };
      }

      if (includeModels.length > 0) {
        queryOptions.include = includeModels;
      }

      const result = await Team.findAndCountAll(queryOptions);

      // Build pagination metadata
      let paginationMeta = null;
      if (page && limit) {
        const totalPages = Math.ceil(result.count / queryOptions.limit);
        paginationMeta = {
          page: parseInt(page),
          totalPages: totalPages,
          total: result.count,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        };
      } else {
        // No pagination - return simple meta
        paginationMeta = {
          total: result.count,
        };
      }

      return {
        teams: result.rows,
        pagination: paginationMeta,
      };
    } catch (error) {
      console.error('Error getting teams with pagination:', error);
      throw error;
    }
  }
}

module.exports = TeamService;
