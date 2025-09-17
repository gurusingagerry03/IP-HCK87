const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const matchRoutes = require('../routes/matchRoutes');
const { errorHandling } = require('../middlewares/errorHandling');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Mock external dependencies
jest.mock('../helpers/jwt', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../helpers/http', () => ({
  http: jest.fn(),
}));

jest.mock('../helpers/aiGenerate', () => ({
  generateAi: jest.fn(),
}));

// Mock models completely
jest.mock('../models', () => ({
  Match: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn(),
  },
  League: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Team: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  User: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
  },
}));

const { verifyToken } = require('../helpers/jwt');
const { http } = require('../helpers/http');
const { generateAi } = require('../helpers/aiGenerate');
const { Match, League, Team, User } = require('../models');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/matches', matchRoutes);
app.use(errorHandling);

describe('Match Controller', () => {
  let adminToken;
  let userToken;
  let mockAdmin;
  let mockUser;
  let mockLeague;
  let mockTeam1;
  let mockTeam2;
  let mockMatch;

  beforeAll(() => {
    // Create mock JWT tokens
    adminToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'test-secret');
    userToken = jwt.sign({ id: 2, role: 'user' }, process.env.JWT_SECRET || 'test-secret');
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock verifyToken
    verifyToken.mockImplementation((token) => {
      if (token === adminToken.replace('Bearer ', '')) {
        return { id: 1, role: 'admin' };
      }
      if (token === userToken.replace('Bearer ', '')) {
        return { id: 2, role: 'user' };
      }
      throw new Error('Invalid token');
    });

    // Mock data
    const now = new Date().toISOString();

    mockAdmin = {
      id: 1,
      email: 'admin@test.com',
      role: 'admin',
    };

    mockUser = {
      id: 2,
      email: 'user@test.com',
      role: 'user',
    };

    mockLeague = {
      id: 1,
      name: 'Premier League',
      externalRef: 'PL001',
      createdAt: now,
      updatedAt: now,
    };

    mockTeam1 = {
      id: 1,
      name: 'Arsenal FC',
      logoUrl: 'https://example.com/arsenal.png',
      country: 'England',
      leagueId: 1,
      externalRef: 'ARS001',
      createdAt: now,
      updatedAt: now,
    };

    mockTeam2 = {
      id: 2,
      name: 'Chelsea FC',
      logoUrl: 'https://example.com/chelsea.png',
      country: 'England',
      leagueId: 1,
      externalRef: 'CHE001',
      createdAt: now,
      updatedAt: now,
    };

    mockMatch = {
      id: 1,
      league_id: 1,
      home_team_id: 1,
      away_team_id: 2,
      match_date: '2025-12-01T15:00:00.000Z',
      match_time: '15:00:00',
      home_score: '2',
      away_score: '1',
      status: 'finished',
      venue: 'Emirates Stadium',
      externalRef: 'MATCH001',
      match_overview: null,
      tactical_analysis: null,
      match_preview: null,
      prediction: null,
      predicted_score_home: null,
      predicted_score_away: null,
      createdAt: now,
      updatedAt: now,
      HomeTeam: mockTeam1,
      AwayTeam: mockTeam2,
      League: mockLeague,
    };

    // Mock User.findByPk for authentication middleware
    User.findByPk = jest.fn().mockImplementation((id) => {
      if (id === 1) return Promise.resolve(mockAdmin);
      if (id === 2) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe('GET /api/v1/matches', () => {
    it('should get all matches without query parameters', async () => {
      const mockMatches = [mockMatch];
      Match.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: mockMatches,
      });

      const response = await request(app).get('/api/v1/matches').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMatches,
        meta: {
          page: 1,
          totalPages: 1,
          total: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      expect(Match.findAndCountAll).toHaveBeenCalledWith({
        where: {},
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
      });
    });

    it('should get all matches with pagination', async () => {
      const mockMatches = [mockMatch];
      Match.findAndCountAll = jest.fn().mockResolvedValue({
        count: 15,
        rows: mockMatches,
      });

      const response = await request(app)
        .get('/api/v1/matches?page[number]=2&page[size]=5')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMatches,
        meta: {
          page: 2,
          totalPages: 3,
          total: 15,
          hasNext: true,
          hasPrev: true,
        },
      });

      expect(Match.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [['match_date', 'ASC']],
        include: expect.any(Array),
        limit: 5,
        offset: 5,
      });
    });

    it('should filter matches by status', async () => {
      const mockMatches = [mockMatch];
      Match.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: mockMatches,
      });

      const response = await request(app).get('/api/v1/matches?status=finished').expect(200);

      expect(response.body.success).toBe(true);
      // Just check that the method was called with the right structure
      expect(Match.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: expect.any(Object),
          }),
          limit: 10,
          offset: 0,
        })
      );
    });

    it('should handle database error', async () => {
      Match.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/matches').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('GET /api/v1/matches/league/:id', () => {
    it('should get matches by league ID successfully', async () => {
      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      Match.findAll = jest.fn().mockResolvedValue([mockMatch]);

      const response = await request(app).get('/api/v1/matches/league/1').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [mockMatch],
      });

      expect(League.findByPk).toHaveBeenCalledWith(1);
      expect(Match.findAll).toHaveBeenCalledWith({
        where: {},
        include: [
          {
            model: Team,
            as: 'HomeTeam',
            where: { leagueId: 1 },
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
          {
            model: Team,
            as: 'AwayTeam',
            where: { leagueId: 1 },
            attributes: ['id', 'name', 'logoUrl', 'country'],
          },
        ],
        order: [
          ['match_date', 'ASC'],
          ['match_time', 'ASC'],
        ],
      });
    });

    it('should return 400 for invalid league ID', async () => {
      const response = await request(app).get('/api/v1/matches/league/abc').expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid League ID');
    });

    it('should return 404 when league not found', async () => {
      League.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/v1/matches/league/999').expect(404);

      expect(response.body).toHaveProperty('message', 'League not found');
    });

    it('should filter matches by status', async () => {
      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      Match.count = jest.fn().mockResolvedValue(5);
      Match.findAll = jest.fn().mockResolvedValue([mockMatch]);

      const response = await request(app)
        .get('/api/v1/matches/league/1?status=finished&page[number]=1&page[size]=10')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('meta');
      expect(Match.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'finished' },
        })
      );
    });

    it('should filter matches by date', async () => {
      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      Match.count = jest.fn().mockResolvedValue(1);
      Match.findAll = jest.fn().mockResolvedValue([mockMatch]);

      const response = await request(app)
        .get('/api/v1/matches/league/1?date=12/01/2025&page[number]=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Match.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            match_date: expect.any(Object),
          }),
        })
      );
    });

    it('should return 400 for invalid date format', async () => {
      League.findByPk = jest.fn().mockResolvedValue(mockLeague);

      const response = await request(app)
        .get('/api/v1/matches/league/1?date=invalid-date&page[number]=1')
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid date format. Expected MM/DD/YYYY');
    });

    it('should handle database error', async () => {
      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      Match.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/matches/league/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('GET /api/v1/matches/:id', () => {
    it('should get match by ID successfully', async () => {
      Match.findByPk = jest.fn().mockResolvedValue(mockMatch);

      const response = await request(app).get('/api/v1/matches/1').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMatch,
        message: 'Successfully retrieved match with ID 1',
      });

      expect(Match.findByPk).toHaveBeenCalledWith(1, {
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
    });

    it('should return 400 for invalid match ID', async () => {
      const response = await request(app).get('/api/v1/matches/abc').expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid Match ID');
    });

    it('should return 404 when match not found', async () => {
      Match.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/v1/matches/999').expect(404);

      expect(response.body).toHaveProperty('message', 'Match not found');
    });

    it('should handle database error', async () => {
      Match.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/matches/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('POST /api/v1/matches/sync/:leagueId', () => {
    it('should synchronize matches successfully', async () => {
      const apiResponse = {
        data: [
          {
            match_id: 'MATCH001',
            league_year: '2025/2026',
            match_hometeam_id: 'ARS001',
            match_awayteam_id: 'CHE001',
            match_date: '2025-12-01',
            match_time: '15:00',
            match_hometeam_ft_score: '2',
            match_awayteam_ft_score: '1',
            match_status: 'Finished',
          },
        ],
      };

      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      Team.findAll = jest.fn().mockResolvedValue([mockTeam1, mockTeam2]);
      http.mockResolvedValue(apiResponse);
      Match.bulkCreate = jest.fn().mockResolvedValue([{ _options: { isNewRecord: true } }]);

      const response = await request(app)
        .post('/api/v1/matches/sync/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          matchesAdded: 1,
          matchesUpdated: 0,
          errors: [],
        },
        message: 'Successfully synchronized 1 matches',
      });

      expect(League.findByPk).toHaveBeenCalledWith('1');
      expect(Team.findAll).toHaveBeenCalledWith({
        where: { leagueId: '1' },
      });
      expect(http).toHaveBeenCalled();
      expect(Match.bulkCreate).toHaveBeenCalled();
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/v1/matches/sync/1').expect(401);

      expect(response.body).toHaveProperty('message', 'invalid token');
    });

    it('should return 401 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/v1/matches/sync/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return 400 for invalid league ID', async () => {
      const response = await request(app)
        .post('/api/v1/matches/sync/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid League ID');
    });

    it('should return 404 when league not found', async () => {
      League.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/matches/sync/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'League not found');
    });

    it('should handle API connection error', async () => {
      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      http.mockRejectedValue(new Error('API connection failed'));

      const response = await request(app)
        .post('/api/v1/matches/sync/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Failed to connect to external matches API');
    });

    it('should handle invalid API response', async () => {
      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      http.mockResolvedValue({ data: null });

      const response = await request(app)
        .post('/api/v1/matches/sync/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid response from external API');
    });

    it('should handle bulk create error', async () => {
      const apiResponse = {
        data: [
          {
            match_id: 'MATCH001',
            league_year: '2025/2026',
            match_hometeam_id: 'ARS001',
            match_awayteam_id: 'CHE001',
          },
        ],
      };

      League.findByPk = jest.fn().mockResolvedValue(mockLeague);
      Team.findAll = jest.fn().mockResolvedValue([mockTeam1, mockTeam2]);
      http.mockResolvedValue(apiResponse);
      Match.bulkCreate = jest.fn().mockRejectedValue(new Error('Bulk operation failed'));

      const response = await request(app)
        .post('/api/v1/matches/sync/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.errors).toContain('Bulk operation failed: Bulk operation failed');
    });
  });

  describe('PUT /api/v1/matches/analysis/:id', () => {
    it('should update match analysis successfully', async () => {
      const mockMatchAnalysis = {
        ...mockMatch,
        status: 'finished',
        match_overview: null,
        tactical_analysis: null,
      };

      const aiResponse = {
        match_overview: 'Great match overview',
        tactical_analysis: 'Detailed tactical analysis',
      };

      Match.findByPk = jest.fn().mockResolvedValue(mockMatchAnalysis);
      generateAi.mockResolvedValue(JSON.stringify(aiResponse));
      Match.update = jest.fn().mockResolvedValue([1]);

      const response = await request(app).put('/api/v1/matches/analysis/1').expect(200);

      expect(response.body).toEqual({
        mesage: 'Successfully updated match analysis',
      });

      expect(Match.findByPk).toHaveBeenCalledWith('1', {
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

      expect(generateAi).toHaveBeenCalled();
      expect(Match.update).toHaveBeenCalledWith(
        {
          match_overview: 'Great match overview',
          tactical_analysis: 'Detailed tactical analysis',
        },
        { where: { id: '1' } }
      );
    });

    it('should return 404 when match not found', async () => {
      Match.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app).put('/api/v1/matches/analysis/999').expect(404);

      expect(response.body).toHaveProperty('message', 'Match not found');
    });

    it('should skip update when analysis already exists', async () => {
      const existingMatch = {
        ...mockMatch,
        match_overview: 'Existing overview',
        tactical_analysis: 'Existing analysis',
      };

      Match.findByPk = jest.fn().mockResolvedValue(existingMatch);

      const response = await request(app).put('/api/v1/matches/analysis/1').expect(200);

      expect(response.body).toEqual({
        mesage: 'Match analysis already exists, no update made or match is upcoming',
      });

      expect(generateAi).not.toHaveBeenCalled();
      expect(Match.update).not.toHaveBeenCalled();
    });

    it('should skip update for upcoming matches', async () => {
      const upcomingMatch = {
        ...mockMatch,
        status: 'upcoming',
        match_overview: null,
        tactical_analysis: null,
      };

      Match.findByPk = jest.fn().mockResolvedValue(upcomingMatch);

      const response = await request(app).put('/api/v1/matches/analysis/1').expect(200);

      expect(response.body).toEqual({
        mesage: 'Match analysis already exists, no update made or match is upcoming',
      });
    });

    it('should handle AI generation error', async () => {
      const mockMatchAnalysis = {
        ...mockMatch,
        status: 'finished',
        match_overview: null,
        tactical_analysis: null,
      };

      Match.findByPk = jest.fn().mockResolvedValue(mockMatchAnalysis);
      generateAi.mockRejectedValue(new Error('AI service error'));

      const response = await request(app).put('/api/v1/matches/analysis/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle database update error', async () => {
      const mockMatchAnalysis = {
        ...mockMatch,
        status: 'finished',
        match_overview: null,
        tactical_analysis: null,
      };

      Match.findByPk = jest.fn().mockResolvedValue(mockMatchAnalysis);
      generateAi.mockResolvedValue('{"match_overview": "test", "tactical_analysis": "test"}');
      Match.update = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app).put('/api/v1/matches/analysis/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('PUT /api/v1/matches/preview/:id', () => {
    it('should update match preview and prediction successfully', async () => {
      const mockMatchPreview = {
        ...mockMatch,
        status: 'upcoming',
        match_preview: null,
        prediction: null,
      };

      const aiResponse = {
        match_preview: 'Exciting match preview',
        prediction: 'Detailed prediction',
        predicted_score: { home: 2, away: 1 },
      };

      Match.findByPk = jest.fn().mockResolvedValue(mockMatchPreview);
      generateAi.mockResolvedValue(JSON.stringify(aiResponse));
      Match.update = jest.fn().mockResolvedValue([1]);

      const response = await request(app).put('/api/v1/matches/preview/1').expect(200);

      expect(response.body).toEqual({
        mesage: 'Successfully updated match preview and prediction',
      });

      expect(Match.update).toHaveBeenCalledWith(
        {
          match_preview: 'Exciting match preview',
          prediction: 'Detailed prediction',
          predicted_score_home: 2,
          predicted_score_away: 1,
        },
        { where: { id: '1' } }
      );
    });

    it('should return 404 when match not found', async () => {
      Match.findByPk = jest.fn().mockResolvedValue(null);

      const response = await request(app).put('/api/v1/matches/preview/999').expect(404);

      expect(response.body).toHaveProperty('message', 'Match not found');
    });

    it('should skip update when preview already exists', async () => {
      const existingMatch = {
        ...mockMatch,
        match_preview: 'Existing preview',
        prediction: 'Existing prediction',
      };

      Match.findByPk = jest.fn().mockResolvedValue(existingMatch);

      const response = await request(app).put('/api/v1/matches/preview/1').expect(200);

      expect(response.body).toEqual({
        mesage: 'Match preview and prediction already exists, no update made or match is finished',
      });

      expect(generateAi).not.toHaveBeenCalled();
    });

    it('should skip update for finished matches', async () => {
      const finishedMatch = {
        ...mockMatch,
        status: 'finished',
        match_preview: null,
        prediction: null,
      };

      Match.findByPk = jest.fn().mockResolvedValue(finishedMatch);

      const response = await request(app).put('/api/v1/matches/preview/1').expect(200);

      expect(response.body).toEqual({
        mesage: 'Match preview and prediction already exists, no update made or match is finished',
      });
    });

    it('should handle AI generation error', async () => {
      const mockMatchPreview = {
        ...mockMatch,
        status: 'upcoming',
        match_preview: null,
        prediction: null,
      };

      Match.findByPk = jest.fn().mockResolvedValue(mockMatchPreview);
      generateAi.mockRejectedValue(new Error('AI service error'));

      const response = await request(app).put('/api/v1/matches/preview/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle invalid AI response JSON', async () => {
      const mockMatchPreview = {
        ...mockMatch,
        status: 'upcoming',
        match_preview: null,
        prediction: null,
      };

      Match.findByPk = jest.fn().mockResolvedValue(mockMatchPreview);
      generateAi.mockResolvedValue('invalid json response');

      const response = await request(app).put('/api/v1/matches/preview/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });
});
