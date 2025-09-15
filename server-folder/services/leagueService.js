const { League } = require('../models');

/**
 * League Service - Handles league-related business logic
 */
class LeagueService {
  /**
   * Get all leagues with optional includes
   * @param {Array} includeModels - Models to include in the query
   * @returns {Promise<Array>} Array of leagues
   */
  static async getAllLeagues(includeModels = []) {
    try {
      const options = {
        order: [['createdAt', 'DESC']],
      };

      if (includeModels.length > 0) {
        options.include = includeModels;
      }

      return await League.findAll(options);
    } catch (error) {
      console.error('Error getting all leagues:', error);
      throw error;
    }
  }

  /**
   * Get league by ID
   * @param {number} leagueId - League ID
   * @returns {Promise<Object|null>} League object or null
   */
  static async getLeagueById(leagueId) {
    try {
      return await League.findByPk(leagueId);
    } catch (error) {
      console.error(`Error getting league by ID ${leagueId}:`, error);
      return null;
    }
  }

  /**
   * Check if league exists by name and country
   * @param {string} leagueName - League name
   * @param {string} leagueCountry - League country
   * @returns {Promise<Object|null>} Existing league or null
   */
  static async findExistingLeague(leagueName, leagueCountry) {
    try {
      return await League.findOne({
        where: {
          name: leagueName.trim(),
          country: leagueCountry.trim(),
        },
      });
    } catch (error) {
      console.error('Error finding existing league:', error);
      return null;
    }
  }

  /**
   * Create a new league
   * @param {Object} leagueData - League data
   * @returns {Promise<Object>} Created league
   */
  static async createLeague(leagueData) {
    try {
      return await League.create({
        name: leagueData.league_name,
        country: leagueData.country_name,
        externalRef: leagueData.league_id,
        logoUrl: leagueData.league_logo || null,
      });
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  }
}

module.exports = LeagueService;
