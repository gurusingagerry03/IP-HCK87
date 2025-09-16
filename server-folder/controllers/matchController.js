const { Match, Team, League } = require('../models');
const { http } = require('../helpers/http');

class matchController {
  static async getMatchesByLeagueId(req, res, next) {
    try {
      const { id } = req.params;
      const leagueId = parseInt(id);

      if (!leagueId || isNaN(leagueId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid League ID',
        });
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
      }

      const matches = await Match.findAll({
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
          ['matchDate', 'ASC'],
          ['matchTime', 'ASC'],
        ],
      });

      return res.status(200).json({
        success: true,
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  }

  static async synchronizeMatchesByLeagueId(req, res, next) {
    try {
      const { id } = req.params;
      const leagueId = parseInt(id);

      if (!leagueId || isNaN(leagueId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid League ID',
        });
      }

      const league = await League.findByPk(leagueId);
      if (!league) {
        return res.status(404).json({
          success: false,
          message: 'League not found',
        });
      }

      const season = new Date().getFullYear();
      const apiUrl = `https://v3.football.api-sports.io/fixtures?league=${league.externalId}&season=${season}`;

      const response = await http.get(apiUrl);
      const matches = response.response;

      if (!matches || matches.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No matches found to synchronize',
        });
      }

      const matchData = [];
      for (const match of matches) {
        const homeTeam = await Team.findOne({
          where: { externalId: match.teams.home.id },
        });

        const awayTeam = await Team.findOne({
          where: { externalId: match.teams.away.id },
        });

        if (homeTeam && awayTeam) {
          const existingMatch = await Match.findOne({
            where: { externalId: match.fixture.id },
          });

          const matchInfo = {
            externalId: match.fixture.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            homeScore: match.goals.home || 0,
            awayScore: match.goals.away || 0,
            status: match.fixture.status.short,
            matchDate: match.fixture.date.split('T')[0],
            matchTime: match.fixture.date.split('T')[1].split('+')[0],
            venue: match.fixture.venue ? match.fixture.venue.name : null,
            referee: match.fixture.referee || null,
          };

          if (existingMatch) {
            await existingMatch.update(matchInfo);
          } else {
            await Match.create(matchInfo);
          }

          matchData.push(matchInfo);
        }
      }

      return res.status(200).json({
        success: true,
        data: matchData,
        message: `Successfully synchronized ${matchData.length} matches`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = matchController;
