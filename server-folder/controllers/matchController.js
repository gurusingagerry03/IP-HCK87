const { Match, Team, League } = require('../models');
const { http } = require('../helpers/http');
const { Op } = require('sequelize');
const { BadRequestError, NotFoundError } = require('../helpers/customErrors');
const { generateAi } = require('../helpers/aiGenerate');

class matchController {
  //update match_preview and prediction
  static async updateMatchPreviewAndPrediction(req, res, next) {
    try {
      const { id } = req.params;
      let match_preview;
      let prediction;
      // const { match_preview, prediction } = req.body;

      const match = await Match.findByPk(id, {
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            attributes: ['name'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            attributes: ['name'],
          },
          { model: League, attributes: ['name'] },
        ],
      });
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // jika match ada jangan generate ulang
      if ((match.match_preview && match.prediction) || match.status === 'finished') {
        return res.status(200).json({
          mesage:
            'Match preview and prediction already exists, no update made or match is finished',
        });
      }
      //prompt with prediction score
      const prompt = `
          You are a professional football analyst tasked with generating match preview and prediction.

          Your task:
          1. Analyze both teams' current form, playing style, and head-to-head history
          2. Generate a realistic match preview and detailed prediction
          3. Provide a realistic score prediction based on teams' strengths 
          match: ${match.HomeTeam.name} vs ${match.AwayTeam.name}
          date: ${match.match_date}
          competition: ${match.League.name}
          Output format (JSON only, no extra text):
        {
          "match_preview": "Write 2–3 sentences describing the general preview of the match.",
          "prediction": "Write a detailed prediction paragraph.",
          "predicted_score": {"home": number, "away": number}
        }
      `;
      let response = await generateAi(prompt, 'gemini-2.5-flash-lite');
      const clean = response.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(clean);

      match_preview = parsedResponse.match_preview;
      prediction = parsedResponse.prediction;

      await Match.update(
        {
          match_preview,
          prediction,
          predicted_score_home: parsedResponse.predicted_score.home,
          predicted_score_away: parsedResponse.predicted_score.away,
        },
        { where: { id: id } }
      );
      return res.status(200).json({
        mesage: 'Successfully updated match preview and prediction',
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
  //update match_overview and tactical_analysis
  static async updateMatchAnalysis(req, res, next) {
    try {
      const { id } = req.params;
      let match_overview;
      let tactical_analysis;
      // const { match_overview, tactical_analysis } = req.body;

      const match = await Match.findByPk(id, {
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            attributes: ['name'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            attributes: ['name'],
          },
          { model: League, attributes: ['name'] },
        ],
      });
      if (!match) {
        throw new NotFoundError('Match not found');
      }
      // jika match ada jangan generate ulang
      if ((match.match_overview && match.tactical_analysis) || match.status === 'upcoming') {
        return res.status(200).json({
          mesage: 'Match analysis already exists, no update made or match is upcoming',
        });
      }
      const prompt = `
          You are given accurate football match data. 
          Your task is ONLY to generate two narrative fields: "match_overview" and "tactical_analysis". 
          Do not invent statistics, referees, or numbers. Focus on natural sentences summarizing the match. 
          Always respond in a valid JSON object with exactly these two fields.

          match: ${match.HomeTeam.name} vs ${match.AwayTeam.name}
          date: ${match.match_date}
          competition: ${match.League.name}

          Output format (JSON only, no extra text):
        {
          "match_overview": "Write 2–3 sentences describing the general overview of the match.",
          "tactical_analysis": "Write a detailed tactical analysis paragraph."
        }
      `;
      let response = await generateAi(prompt, 'gemini-2.5-flash-lite');
      const clean = response.replace(/```json|```/g, '').trim();
      const parsedResponse = JSON.parse(clean);
      match_overview = parsedResponse.match_overview;
      tactical_analysis = parsedResponse.tactical_analysis;
      await Match.update({ match_overview, tactical_analysis }, { where: { id: id } });
      return res.status(200).json({
        mesage: 'Successfully updated match analysis',
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }

  static async getMatchesByLeagueId(req, res, next) {
    try {
      const { id } = req.params;
      const leagueId = parseInt(id);

      if (!leagueId || isNaN(leagueId)) {
        throw new BadRequestError('Invalid League ID');
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        throw new NotFoundError('League not found');
      }

      // Extract query parameters
      const { status, date, 'page[number]': pageNumber, 'page[size]': pageSize } = req.query;

      // Check if any query parameters exist
      const hasQueryParams = status || date || pageNumber || pageSize;

      // Build where clause for filtering
      const whereClause = {};

      // Filter by status
      if (status && status !== 'all') {
        if (status === 'upcoming') {
          whereClause.status = { [Op.or]: ['', null, 'upcoming'] };
        } else {
          whereClause.status = status;
        }
      }

      // Filter by date (expecting MM/DD/YYYY format from client)
      if (date) {
        try {
          // Convert MM/DD/YYYY to YYYY-MM-DD for database comparison
          const [month, day, year] = date.split('/');

          if (
            !month ||
            !day ||
            !year ||
            isNaN(parseInt(month)) ||
            isNaN(parseInt(day)) ||
            isNaN(parseInt(year))
          ) {
            throw new BadRequestError('Invalid date format. Expected MM/DD/YYYY');
          }

          const formattedDate = `${year}-${parseInt(month).toString().padStart(2, '0')}-${parseInt(
            day
          )
            .toString()
            .padStart(2, '0')}`;

          // Create date range considering timezone (+07:00)
          // Since DB stores dates with +07:00 offset, we need to account for local timezone
          const startOfDay = new Date(formattedDate + 'T00:00:00.000+07:00');
          const endOfDay = new Date(formattedDate + 'T23:59:59.999+07:00');

          whereClause.match_date = {
            [Op.between]: [startOfDay, endOfDay],
          };
        } catch (dateError) {
          console.error('Date parsing error:', dateError);
          throw new BadRequestError('Invalid date format. Expected MM/DD/YYYY');
        }
      }

      // If no query parameters, return all data without pagination
      if (!hasQueryParams) {
        const matches = await Match.findAll({
          where: whereClause,
          include: [
            {
              model: Team,
              as: 'HomeTeam',
              where: { leagueId },
              attributes: ['id', 'name', 'logoUrl', 'country'],
            },
            {
              model: Team,
              as: 'AwayTeam',
              where: { leagueId },
              attributes: ['id', 'name', 'logoUrl', 'country'],
            },
          ],
          order: [
            ['match_date', 'ASC'],
            ['match_time', 'ASC'],
          ],
        });

        return res.status(200).json({
          success: true,
          data: matches,
        });
      }

      // Pagination parameters (only when query params exist)
      const page = parseInt(pageNumber) || 1;
      const limit = parseInt(pageSize) || 10;
      const offset = (page - 1) * limit;

      // Get total count for pagination metadata
      const totalItems = await Match.count({
        where: whereClause,
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            where: { leagueId },
            attributes: [],
          },
          {
            model: Team,
            as: 'AwayTeam',
            where: { leagueId },
            attributes: [],
          },
        ],
      });

      // Get matches with filtering and pagination
      const matches = await Match.findAll({
        where: whereClause,
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            where: { leagueId },
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            where: { leagueId },
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
        ],
        order: [
          ['match_date', 'ASC'],
          ['match_time', 'ASC'],
        ],
        limit,
        offset,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return res.status(200).json({
        success: true,
        data: matches,
        meta: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
        },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async getMatchById(req, res, next) {
    try {
      const { id } = req.params;
      const matchId = parseInt(id);
      if (!matchId || isNaN(matchId)) {
        throw new BadRequestError('Invalid Match ID');
      }
      const match = await Match.findByPk(matchId, {
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
          { model: League },
        ],
      });
      if (!match) {
        throw new NotFoundError('Match not found');
      }
      return res.status(200).json({
        success: true,
        data: match,
        message: `Successfully retrieved match with ID ${matchId}`,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async synchronizeMatchesByLeagueId(req, res, next) {
    try {
      const { leagueId } = req.params;

      if (!leagueId || isNaN(leagueId)) {
        throw new BadRequestError('Invalid League ID');
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        throw new NotFoundError('League not found');
      }

      // Fetch matches from API
      let matchesResponse;
      try {
        matchesResponse = await http('/', {
          params: {
            action: 'get_events',
            league_id: league.externalRef || league.id,
            from: '2025-06-01',
            to: '2026-09-02',
          },
        });
      } catch (apiError) {
        throw new BadRequestError('Failed to connect to external matches API');
      }

      if (!matchesResponse.data || !Array.isArray(matchesResponse.data)) {
        throw new BadRequestError('Invalid response from external API');
      }

      // Get all teams in this league for reference
      const teams = await Team.findAll({
        where: { leagueId: leagueId },
      });

      const teamsByExternalRef = teams.reduce((acc, team) => {
        acc[team.externalRef] = team;
        return acc;
      }, {});

      const syncResults = {
        matchesAdded: 0,
        matchesUpdated: 0,
        errors: [],
      };

      try {
        // DEDUPLICATION: Remove duplicate matches berdasarkan match_id
        const uniqueMatchesMap = new Map();

        matchesResponse.data
          .filter((e) => e.league_year == '2025/2026')
          .forEach((apiMatchData) => {
            const homeTeam = teamsByExternalRef[apiMatchData.match_hometeam_id];
            const awayTeam = teamsByExternalRef[apiMatchData.match_awayteam_id];

            if (homeTeam && awayTeam && apiMatchData.match_id) {
              if (!uniqueMatchesMap.has(apiMatchData.match_id)) {
                uniqueMatchesMap.set(apiMatchData.match_id, {
                  league_id: leagueId,
                  home_team_id: homeTeam.id,
                  away_team_id: awayTeam.id,
                  match_date: apiMatchData.match_date || null,
                  match_time: apiMatchData.match_time || null,
                  home_score: apiMatchData.match_hometeam_ft_score,
                  away_score: apiMatchData.match_awayteam_ft_score,
                  status: apiMatchData.match_status?.toLowerCase() || 'upcoming',
                  venue: homeTeam.stadiumName || null,
                  externalRef: apiMatchData.match_id,
                });
              }
            }
          });

        // Convert map to array for bulk create
        const matchesData = Array.from(uniqueMatchesMap.values());

        if (matchesData.length > 0) {
          // Bulk create/update matches
          const matchResults = await Match.bulkCreate(matchesData, {
            updateOnDuplicate: [
              'match_date',
              'match_time',
              'home_score',
              'away_score',
              'status',
              'venue',
            ],
            returning: true,
          });

          syncResults.matchesAdded = matchResults.filter(
            (result) => result._options.isNewRecord
          ).length;
          syncResults.matchesUpdated = matchResults.length - syncResults.matchesAdded;
        }
      } catch (bulkError) {
        console.error('Bulk matches sync error:', bulkError);
        syncResults.errors.push(`Bulk operation failed: ${bulkError.message}`);
      }

      return res.status(200).json({
        success: true,
        data: syncResults,
        message: `Successfully synchronized ${
          syncResults.matchesAdded + syncResults.matchesUpdated
        } matches`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllMatches(req, res, next) {
    try {
      const { status, 'page[number]': pageNumber, 'page[size]': pageSize } = req.query;

      // Check if there are any query parameters for pagination or filtering
      const hasQueryParams = status || req.query['page[number]'] || req.query['page[size]'];

      let whereCondition = {};

      if (status?.trim()) {
        whereCondition.status = {
          [Op.iLike]: `%${status.trim()}%`,
        };
      }

      let findOptions = {
        where: whereCondition,
        order: [['match_date', 'ASC']],
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            attributes: ['id', 'name', 'logoUrl'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            attributes: ['id', 'name', 'logoUrl'],
          },
          {
            model: League,
            attributes: ['id', 'name'],
          },
        ],
      };

      let totalPages = 1;
      let currentPage = 1;

      // Only apply pagination if there are query parameters
      if (hasQueryParams) {
        const limit = Math.min(parseInt(pageSize || 10), 50);
        const page = parseInt(pageNumber || 1);
        const offset = (page - 1) * limit;

        findOptions.limit = limit;
        findOptions.offset = offset;

        const { count, rows } = await Match.findAndCountAll(findOptions);
        totalPages = Math.ceil(count / limit);
        currentPage = page;

        return res.status(200).json({
          success: true,
          data: rows,
          meta: {
            page: currentPage,
            totalPages: totalPages,
            total: count,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1,
          },
        });
      }

      // If no query parameters, return all data without pagination
      const { count, rows } = await Match.findAndCountAll(findOptions);

      res.status(200).json({
        success: true,
        data: rows,
        meta: {
          page: 1,
          totalPages: 1,
          total: count,
          hasNext: false,
          hasPrev: false,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = matchController;
