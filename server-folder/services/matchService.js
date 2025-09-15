const { Match } = require('../models');

/**
 * Match Service - Handles match-related business logic
 */
class MatchService {
  /**
   * Synchronize match data from external API to database
   * @param {Object} matchData - Match data from external API
   * @param {Object} options - Additional options (league, homeTeam, awayTeam)
   * @returns {Promise<Object>} Match synchronization result
   */
  static async synchronizeMatchFromAPI(matchData, options) {
    try {
      const { league, homeTeam, awayTeam } = options;

      if (!league || !homeTeam || !awayTeam) {
        throw new Error('Missing required match data: league, homeTeam, or awayTeam');
      }

      const [matchResult] = await Match.upsert({
        league_id: league.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        match_date: matchData.match_date || null,
        match_time: matchData.match_time || null,
        home_score: matchData.match_hometeam_ft_score || null,
        away_score: matchData.match_awayteam_ft_score || null,
        status: matchData.match_status || '',
        venue: homeTeam.stadiumName || null,
        externalRef: matchData.match_id,
      });

      return {
        success: true,
        matchId: matchData.match_id,
        match: matchResult,
      };
    } catch (error) {
      console.error(`Error syncing match ${matchData.match_id}:`, error);
      return {
        success: false,
        matchId: matchData.match_id,
        error: error.message,
      };
    }
  }

  /**
   * Batch synchronize matches
   * @param {Array} matchesData - Array of match data from API
   * @param {Object} league - League object
   * @param {Function} getTeamByExternalRef - Function to get team by external ref
   * @returns {Promise<Object>} Synchronization results
   */
  static async batchSynchronizeMatches(matchesData, league, getTeamByExternalRef) {
    try {
      const results = {
        successful: 0,
        failed: 0,
        details: [],
      };

      if (!Array.isArray(matchesData) || matchesData.length === 0) {
        return results;
      }

      // Process matches in parallel with proper error handling
      const syncPromises = matchesData.map(async (matchData) => {
        try {
          const [homeTeam, awayTeam] = await Promise.all([
            getTeamByExternalRef(matchData.match_hometeam_id),
            getTeamByExternalRef(matchData.match_awayteam_id),
          ]);

          // Skip if teams are not found
          if (!homeTeam || !awayTeam) {
            const result = {
              success: false,
              matchId: matchData.match_id,
              reason: 'Teams not found',
              homeTeam: homeTeam?.name || 'N/A',
              awayTeam: awayTeam?.name || 'N/A',
            };
            results.failed++;
            results.details.push(result);
            return result;
          }

          const result = await this.synchronizeMatchFromAPI(matchData, {
            league,
            homeTeam,
            awayTeam,
          });

          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
          }

          results.details.push(result);
          return result;
        } catch (error) {
          const errorResult = {
            success: false,
            matchId: matchData.match_id,
            error: error.message,
          };
          results.failed++;
          results.details.push(errorResult);
          return errorResult;
        }
      });
      await Promise.all(syncPromises);
      return results;
    } catch (error) {
      console.error('Error in batch synchronize matches:', error);
      throw error;
    }
  }

  /**
   * Get matches by league ID
   * @param {number} leagueId - League ID
   * @param {Array} includeModels - Models to include in the query
   * @returns {Promise<Array>} Array of matches
   */
  static async getMatchesByLeague(leagueId, includeModels = []) {
    try {
      const options = {
        where: { league_id: leagueId },
        order: [['match_date', 'DESC']],
      };

      if (includeModels.length > 0) {
        options.include = includeModels;
      }

      return await Match.findAll(options);
    } catch (error) {
      console.error(`Error getting matches by league ${leagueId}:`, error);
      throw error;
    }
  }
}

module.exports = MatchService;
