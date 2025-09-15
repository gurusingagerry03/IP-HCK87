const { Player } = require('../models');

/**
 * Player Service - Handles player-related business logic
 */
class PlayerService {
  /**
   * Synchronizes player data from external API to database
   * @param {Object} playerData - Player data from external API
   * @param {number} teamId - Team ID to associate player with
   * @returns {Promise<Array>} Upserted player result
   */
  static async synchronizePlayerFromAPI(playerData, teamId) {
    try {
      // Validate required data
      if (!playerData.player_name || !playerData.player_id) {
        throw new Error('Missing required player data: player_name or player_id');
      }

      return await Player.upsert({
        fullName: playerData.player_name,
        primaryPosition: playerData.player_type || null,
        thumbUrl: playerData.player_image || null,
        externalRef: playerData.player_id,
        age: playerData.player_age || null,
        teamId: teamId,
        shirtNumber: playerData.player_number || null,
      });
    } catch (error) {
      console.error(`Error syncing player ${playerData.player_name}:`, error);
      throw error;
    }
  }

  /**
   * Get all players with optional includes
   * @param {Array} includeModels - Models to include in the query
   * @returns {Promise<Array>} Array of players
   */
  static async getAllPlayers(includeModels = []) {
    try {
      const options = {
        order: [['createdAt', 'DESC']],
      };

      if (includeModels.length > 0) {
        options.include = includeModels;
      }

      return await Player.findAll(options);
    } catch (error) {
      console.error('Error getting all players:', error);
      throw error;
    }
  }

  /**
   * Get players by team ID
   * @param {number} teamId - Team ID
   * @param {Array} includeModels - Models to include in the query
   * @returns {Promise<Array>} Array of players
   */
  static async getPlayersByTeamId(teamId, includeModels = []) {
    try {
      const options = {
        where: { teamId },
        order: [
          ['shirtNumber', 'ASC'],
          ['fullName', 'ASC'],
        ],
      };

      if (includeModels.length > 0) {
        options.include = includeModels;
      }

      return await Player.findAll(options);
    } catch (error) {
      console.error(`Error getting players by team ID ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Batch synchronize players for a team
   * @param {Array} playersData - Array of player data from API
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} Synchronization results
   */
  static async batchSynchronizePlayers(playersData, teamId) {
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
          await this.synchronizePlayerFromAPI(playerData, teamId);
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
      console.error('Error in batch synchronize players:', error);
      throw error;
    }
  }
}

module.exports = PlayerService;
