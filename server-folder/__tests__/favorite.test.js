const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const favoriteRoutes = require('../routes/favoriteRoutes');
const { errorHandling } = require('../middlewares/errorHandling');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Mock external dependencies
jest.mock('../helpers/jwt', () => ({
  verifyToken: jest.fn(),
}));

// Mock models completely
jest.mock('../models', () => ({
  Favorite: {
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
  Team: {
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
const { Favorite, User, Team } = require('../models');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/favorites', favoriteRoutes);
app.use(errorHandling);

describe('Favorite', () => {
  let userToken;
  let mockUser;
  let mockTeam;
  let mockFavorite;
  let mockFavoriteWithDestroy;

  beforeAll(() => {
    // Create mock JWT token
    userToken = jwt.sign({ id: 1, role: 'user' }, process.env.JWT_SECRET || 'test-secret');
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock verifyToken
    verifyToken.mockImplementation((token) => {
      if (token === userToken.replace('Bearer ', '')) {
        return { id: 1, role: 'user' };
      }
      throw new Error('Invalid token');
    });

    // Mock data - use string dates for JSON serialization
    const now = new Date().toISOString();

    mockUser = {
      id: 1,
      email: 'user@test.com',
      role: 'user',
    };

    mockTeam = {
      id: 1,
      name: 'Arsenal FC',
      country: 'England',
      externalRef: 'ARS001',
      logoUrl: 'https://example.com/arsenal-logo.png',
      createdAt: now,
      updatedAt: now,
    };

    mockFavorite = {
      id: 1,
      userId: 1,
      teamId: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Separate mock favorite with destroy method
    mockFavoriteWithDestroy = {
      ...mockFavorite,
      destroy: jest.fn().mockResolvedValue(true),
    };

    // Mock User.findByPk for authentication middleware
    User.findByPk = jest.fn().mockImplementation((id) => {
      if (id === 1) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe('POST /api/v1/favorites/:teamId', () => {
    it('should add favorite successfully', async () => {
      // Mock Favorite.create
      Favorite.create = jest.fn().mockResolvedValue(mockFavorite);

      const response = await request(app)
        .post('/api/v1/favorites/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockFavorite,
      });

      expect(Favorite.create).toHaveBeenCalledWith({
        userId: 1,
        teamId: 1,
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/v1/favorites/1').expect(401);

      expect(response.body).toHaveProperty('message', 'invalid token');
    });

    it('should return 400 for invalid teamId (non-numeric)', async () => {
      const response = await request(app)
        .post('/api/v1/favorites/abc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Team ID must be a positive number');
    });

    it('should return 400 for invalid teamId (zero)', async () => {
      const response = await request(app)
        .post('/api/v1/favorites/0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Team ID must be a positive number');
    });

    it('should return 400 for invalid teamId (negative)', async () => {
      const response = await request(app)
        .post('/api/v1/favorites/-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Team ID must be a positive number');
    });

    it('should handle database error', async () => {
      // Mock Favorite.create to throw error
      Favorite.create = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/favorites/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle duplicate favorite error', async () => {
      // Mock Favorite.create to throw unique constraint error
      const uniqueError = new Error('User sudah menambahkan tim ini ke favorit.');
      uniqueError.name = 'SequelizeValidationError';
      uniqueError.errors = [{ message: 'User sudah menambahkan tim ini ke favorit.' }];

      Favorite.create = jest.fn().mockRejectedValue(uniqueError);

      const response = await request(app)
        .post('/api/v1/favorites/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('GET /api/v1/favorites', () => {
    it('should get user favorites successfully', async () => {
      const mockFavoritesWithTeam = [
        {
          ...mockFavorite,
          Team: mockTeam,
        },
      ];

      // Mock Favorite.findAll
      Favorite.findAll = jest.fn().mockResolvedValue(mockFavoritesWithTeam);

      const response = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockFavoritesWithTeam,
      });

      expect(Favorite.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: [
          {
            model: Team,
          },
        ],
      });
    });

    it('should return empty array when no favorites', async () => {
      // Mock Favorite.findAll to return empty array
      Favorite.findAll = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/favorites').expect(401);

      expect(response.body).toHaveProperty('message', 'invalid token');
    });

    it('should handle database error', async () => {
      // Mock Favorite.findAll to throw error
      Favorite.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });
  });

  describe('DELETE /api/v1/favorites/:id', () => {
    it('should remove favorite successfully', async () => {
      // Mock Favorite.findOne to return favorite with destroy method
      Favorite.findOne = jest.fn().mockResolvedValue(mockFavoriteWithDestroy);

      const response = await request(app)
        .delete('/api/v1/favorites/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Favorite with ID 1 has been removed',
      });

      expect(Favorite.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(mockFavoriteWithDestroy.destroy).toHaveBeenCalled();
    });

    it('should return 401 without token', async () => {
      const response = await request(app).delete('/api/v1/favorites/1').expect(401);

      expect(response.body).toHaveProperty('message', 'invalid token');
    });

    it('should return 400 for invalid favoriteId (non-numeric)', async () => {
      const response = await request(app)
        .delete('/api/v1/favorites/abc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Favorite ID must be a positive number');
    });

    it('should return 400 for invalid favoriteId (zero)', async () => {
      const response = await request(app)
        .delete('/api/v1/favorites/0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Favorite ID must be a positive number');
    });

    it('should return 400 for invalid favoriteId (negative)', async () => {
      const response = await request(app)
        .delete('/api/v1/favorites/-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Favorite ID must be a positive number');
    });

    it('should return 404 when favorite not found', async () => {
      // Mock Favorite.findOne to return null
      Favorite.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/favorites/999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty(
        'message',
        'Favorite with ID 999 not found for this user'
      );
    });

    it('should return 404 when favorite belongs to different user', async () => {
      // Mock Favorite.findOne to return null (favorite exists but for different user)
      Favorite.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/favorites/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Favorite with ID 1 not found for this user');
      expect(Favorite.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
    });

    it('should handle database error during findOne', async () => {
      // Mock Favorite.findOne to throw error
      Favorite.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/v1/favorites/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
    });

    it('should handle database error during destroy', async () => {
      // Mock favorite with destroy method that throws error
      const mockFavoriteWithError = {
        ...mockFavorite,
        destroy: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      Favorite.findOne = jest.fn().mockResolvedValue(mockFavoriteWithError);

      const response = await request(app)
        .delete('/api/v1/favorites/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'internal server error');
      expect(mockFavoriteWithError.destroy).toHaveBeenCalled();
    });
  });
});
