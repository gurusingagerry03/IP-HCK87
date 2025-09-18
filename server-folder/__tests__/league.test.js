const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const leagueRoutes = require('../routes/leagueRoutes');
const { errorHandling } = require('../middlewares/errorHandling');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Mock external dependencies
jest.mock('../helpers/http', () => ({
  http: jest.fn(),
}));

jest.mock('../helpers/jwt', () => ({
  verifyToken: jest.fn(),
}));

// Mock models completely
jest.mock('../models', () => ({
  League: {
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

const { http } = require('../helpers/http');
const { verifyToken } = require('../helpers/jwt');
const { League, User } = require('../models');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/leagues', leagueRoutes);
app.use(errorHandling);

describe('League', () => {
  let adminToken;
  let userToken;
  let mockLeague;
  let mockUser;
  let mockAdminUser;

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

    // Mock data - use string dates for JSON serialization
    const now = new Date().toISOString();
    mockLeague = {
      id: 1,
      name: 'Premier League',
      country: 'England',
      externalRef: 'PL001',
      logoUrl: 'https://example.com/logo.png',
      createdAt: now,
      updatedAt: now,
    };

    mockAdminUser = {
      id: 1,
      email: 'admin@test.com',
      role: 'admin',
    };

    mockUser = {
      id: 2,
      email: 'user@test.com',
      role: 'user',
    };

    // Mock User.findByPk for authentication middleware
    User.findByPk = jest.fn().mockImplementation((id) => {
      if (id === 1) return Promise.resolve(mockAdminUser);
      if (id === 2) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe('GET /api/v1/leagues', () => {
    it('should return all leagues successfully', async () => {
      // Mock League.findAll
      League.findAll = jest.fn().mockResolvedValue([mockLeague]);

      const response = await request(app).get('/api/v1/leagues').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [mockLeague],
      });
      expect(League.findAll).toHaveBeenCalledWith();
    });

    it('should handle database error', async () => {
      // Mock League.findAll to throw error
      League.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/leagues').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('GET /api/v1/leagues/:id', () => {
    it('should return league by id successfully', async () => {
      // Mock League.findOne
      League.findOne = jest.fn().mockResolvedValue(mockLeague);

      const response = await request(app).get('/api/v1/leagues/1').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockLeague,
      });
      expect(League.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 400 for invalid id (non-numeric)', async () => {
      const response = await request(app).get('/api/v1/leagues/abc').expect(400);

      expect(response.body).toHaveProperty('message', 'League ID must be a positive number');
    });

    it('should return 400 for invalid id (zero)', async () => {
      const response = await request(app).get('/api/v1/leagues/0').expect(400);

      expect(response.body).toHaveProperty('message', 'League ID must be a positive number');
    });

    it('should return 400 for invalid id (negative)', async () => {
      const response = await request(app).get('/api/v1/leagues/-1').expect(400);

      expect(response.body).toHaveProperty('message', 'League ID must be a positive number');
    });

    it('should return 404 when league not found', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/v1/leagues/999').expect(404);

      expect(response.body).toHaveProperty('message', 'League with ID 999 not found');
    });

    it('should handle database error', async () => {
      // Mock League.findOne to throw error
      League.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/leagues/1').expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('POST /api/v1/leagues/sync', () => {
    it('should sync league successfully with admin token', async () => {
      // Mock League.findOne to return null (league doesn't exist)
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock external API response
      const mockApiResponse = {
        data: [
          {
            league_name: 'Premier League',
            country_name: 'England',
            league_id: 'PL001',
            league_logo: 'https://example.com/logo.png',
          },
        ],
      };
      http.mockResolvedValue(mockApiResponse);

      // Mock League.create
      League.create = jest.fn().mockResolvedValue({
        ...mockLeague,
        id: 1,
      });

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'League synchronized successfully',
        data: {
          ...mockLeague,
          id: 1,
        },
      });

      expect(League.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Premier League',
          country: 'England',
        },
      });
      expect(http).toHaveBeenCalledWith('/', {
        params: { action: 'get_leagues' },
      });
      expect(League.create).toHaveBeenCalledWith({
        name: 'Premier League',
        country: 'England',
        externalRef: 'PL001',
        logoUrl: 'https://example.com/logo.png',
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'invalid token');
    });

    it('should return 401 with user token (not admin)', async () => {
      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Access denied. Admin role required.');
    });

    it('should return 400 when leagueName is missing', async () => {
      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueCountry: 'England',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'League name is required');
    });

    it('should return 400 when leagueCountry is missing', async () => {
      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Country is required');
    });

    it('should return 409 when league already exists', async () => {
      // Mock League.findOne to return existing league
      League.findOne = jest.fn().mockResolvedValue(mockLeague);

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(409);

      expect(response.body).toHaveProperty(
        'message',
        'League Premier League from England already exists'
      );
    });

    it('should return 400 when external API fails', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock http to reject
      http.mockRejectedValue(new Error('API connection failed'));

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Failed to connect to external league API');
    });

    it('should return 400 when external API returns invalid response', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock http to return invalid data
      http.mockResolvedValue({ data: null });

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid response from external API');
    });

    it('should return 400 when external API returns non-array data', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock http to return non-array data
      http.mockResolvedValue({ data: {} });

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid response from external API');
    });

    it('should return 404 when league not found in external API', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock external API response without the requested league
      const mockApiResponse = {
        data: [
          {
            league_name: 'La Liga',
            country_name: 'Spain',
            league_id: 'LL001',
            league_logo: 'https://example.com/laliga-logo.png',
          },
        ],
      };
      http.mockResolvedValue(mockApiResponse);

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(404);

      expect(response.body).toHaveProperty(
        'message',
        'League "Premier League" from "England" not found in external API'
      );
    });

    it('should handle case-insensitive matching', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock external API response with different case
      const mockApiResponse = {
        data: [
          {
            league_name: 'PREMIER LEAGUE',
            country_name: 'ENGLAND',
            league_id: 'PL001',
            league_logo: 'https://example.com/logo.png',
          },
        ],
      };
      http.mockResolvedValue(mockApiResponse);

      // Mock League.create
      League.create = jest.fn().mockResolvedValue(mockLeague);

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'premier league',
          leagueCountry: 'england',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(League.create).toHaveBeenCalledWith({
        name: 'PREMIER LEAGUE',
        country: 'ENGLAND',
        externalRef: 'PL001',
        logoUrl: 'https://example.com/logo.png',
      });
    });

    it('should handle league without logo', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock external API response without logo
      const mockApiResponse = {
        data: [
          {
            league_name: 'Premier League',
            country_name: 'England',
            league_id: 'PL001',
            // No league_logo field
          },
        ],
      };
      http.mockResolvedValue(mockApiResponse);

      // Mock League.create
      League.create = jest.fn().mockResolvedValue({
        ...mockLeague,
        logoUrl: null,
      });

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(League.create).toHaveBeenCalledWith({
        name: 'Premier League',
        country: 'England',
        externalRef: 'PL001',
        logoUrl: null,
      });
    });

    it('should handle database error during create', async () => {
      // Mock League.findOne to return null
      League.findOne = jest.fn().mockResolvedValue(null);

      // Mock external API response
      const mockApiResponse = {
        data: [
          {
            league_name: 'Premier League',
            country_name: 'England',
            league_id: 'PL001',
            league_logo: 'https://example.com/logo.png',
          },
        ],
      };
      http.mockResolvedValue(mockApiResponse);

      // Mock League.create to throw error
      League.create = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/leagues/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leagueName: 'Premier League',
          leagueCountry: 'England',
        })
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  // Clean up all mocks after all tests complete
  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Clear mock calls after each test to prevent interference
  afterEach(() => {
    jest.clearAllMocks();
  });
});
