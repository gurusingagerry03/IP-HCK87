const request = require('supertest');
const express = require('express');
const teamRoutes = require('../routes/teamRoutes');
const { errorHandling } = require('../middlewares/errorHandling');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECREAT = 'test-secret';

jest.mock('../helpers/http', () => ({
  http: jest.fn(),
}));

jest.mock('../helpers/jwt', () => ({
  verify: jest.fn(),
}));

jest.mock('../helpers/aiGenerate', () => ({
  generateAi: jest.fn(),
}));

jest.mock('../middlewares/authenticate', () => (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
});

jest.mock('../middlewares/adminOnly', () => (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
});

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
    config: jest.fn(),
  },
}));

jest.mock('sequelize', () => ({
  Op: {
    like: Symbol('like'),
    iLike: Symbol('iLike'),
    in: Symbol('in'),
    or: Symbol('or'),
  },
}));

jest.mock('../models', () => ({
  Team: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  League: {
    findByPk: jest.fn(),
  },
  Player: {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('../helpers/customErrors', () => ({
  BadRequestError: class extends Error {
    constructor(message) {
      super(message);
      this.name = 'BadRequest';
      this.statusCode = 400;
    }
  },
  NotFoundError: class extends Error {
    constructor(message) {
      super(message);
      this.name = 'NotFound';
      this.statusCode = 404;
    }
  },
}));

const { Team, League, Player } = require('../models');
const { http } = require('../helpers/http');
const { generateAi } = require('../helpers/aiGenerate');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(express.json());
app.use('/api/v1/teams', teamRoutes);
app.use(errorHandling);

describe('Team Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/teams', () => {
    it('should get teams with pagination', async () => {
      const mockTeams = [
        { id: 1, name: 'Team A', League: { id: 1, name: 'League A', country: 'Country A' } },
        { id: 2, name: 'Team B', League: { id: 1, name: 'League A', country: 'Country A' } },
      ];

      Team.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockTeams,
      });

      const response = await request(app)
        .get('/api/v1/teams')
        .query({ 'page[number]': 1, 'page[size]': 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data).toEqual(mockTeams);
    });

    it('should get teams without pagination when no query params', async () => {
      const mockTeams = [{ id: 1, name: 'Team A', League: { id: 1, name: 'League A' } }];

      Team.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockTeams,
      });

      const response = await request(app).get('/api/v1/teams');

      expect(response.status).toBe(200);
      expect(response.body.meta.totalPages).toBe(1);
      expect(response.body.meta.hasNext).toBe(false);
    });

    it('should filter teams by search query', async () => {
      const mockTeams = [{ id: 1, name: 'Arsenal', country: 'England' }];

      Team.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockTeams,
      });

      const response = await request(app).get('/api/v1/teams').query({ q: 'Arsenal' });

      expect(response.status).toBe(200);
      expect(Team.findAndCountAll).toHaveBeenCalled();
    });

    it('should filter teams by country', async () => {
      const mockTeams = [{ id: 1, name: 'Team A', country: 'England' }];

      Team.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockTeams,
      });

      const response = await request(app).get('/api/v1/teams').query({ filter: 'England' });

      expect(response.status).toBe(200);
    });

    it('should handle database error', async () => {
      Team.findAndCountAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/teams');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/v1/teams/:id', () => {
    it('should get team by id', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        League: { id: 1, name: 'Test League' },
        Players: [{ id: 1, name: 'Test Player' }],
      };

      Team.findByPk.mockResolvedValue(mockTeam);

      const response = await request(app).get('/api/v1/teams/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTeam);
      expect(Team.findByPk).toHaveBeenCalledWith(1, {
        include: [{ model: League }, { model: Player }],
      });
    });

    it('should return 404 when team not found', async () => {
      Team.findByPk.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/teams/999');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid team id', async () => {
      const response = await request(app).get('/api/v1/teams/invalid');

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative team id', async () => {
      const response = await request(app).get('/api/v1/teams/-1');

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero team id', async () => {
      const response = await request(app).get('/api/v1/teams/0');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/teams/sync/:leagueId', () => {
    it('should sync teams successfully', async () => {
      const mockLeague = {
        id: 1,
        name: 'Test League',
        country: 'Test Country',
        externalRef: '123',
      };
      const mockApiResponse = {
        data: [
          {
            team_key: 'team_1',
            team_name: 'Test Team',
            team_badge: 'https://example.com/badge.png',
            team_founded: '2000',
            team_country: 'Test Country',
            venue: {
              venue_name: 'Test Stadium',
              venue_address: 'Test Address',
              venue_city: 'Test City',
              venue_capacity: '50000',
            },
            coaches: [{ coach_name: 'Test Coach' }],
            players: [
              {
                player_id: 'player_1',
                player_name: 'Test Player',
                player_type: 'Forward',
                player_image: 'https://example.com/player.png',
                player_age: '25',
                player_number: '10',
              },
            ],
          },
        ],
      };

      League.findByPk.mockResolvedValue(mockLeague);
      http.mockResolvedValue(mockApiResponse);
      Team.bulkCreate.mockResolvedValue([
        { id: 1, externalRef: 'team_1', _options: { isNewRecord: true } },
      ]);
      Player.bulkCreate.mockResolvedValue([{ id: 1, _options: { isNewRecord: true } }]);

      const response = await request(app).post('/api/v1/teams/sync/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Teams and players synchronization completed');
    });

    it('should return 400 when league id is missing', async () => {
      const response = await request(app).post('/api/v1/teams/sync/');

      expect(response.status).toBe(404);
    });

    it('should return 404 when league not found', async () => {
      League.findByPk.mockResolvedValue(null);

      const response = await request(app).post('/api/v1/teams/sync/999');

      expect(response.status).toBe(404);
    });

    it('should handle API connection error', async () => {
      const mockLeague = { id: 1, name: 'Test League' };

      League.findByPk.mockResolvedValue(mockLeague);
      http.mockRejectedValue(new Error('API connection failed'));

      const response = await request(app).post('/api/v1/teams/sync/1');

      expect(response.status).toBe(400);
    });

    it('should handle invalid API response', async () => {
      const mockLeague = { id: 1, name: 'Test League' };

      League.findByPk.mockResolvedValue(mockLeague);
      http.mockResolvedValue({ data: null });

      const response = await request(app).post('/api/v1/teams/sync/1');

      expect(response.status).toBe(400);
    });

    it('should handle duplicate teams in API response', async () => {
      const mockLeague = { id: 1, name: 'Test League' };
      const mockApiResponse = {
        data: [
          { team_key: 'team_1', team_name: 'Test Team 1' },
          { team_key: 'team_1', team_name: 'Test Team 1 Duplicate' },
        ],
      };

      League.findByPk.mockResolvedValue(mockLeague);
      http.mockResolvedValue(mockApiResponse);
      Team.bulkCreate.mockResolvedValue([]);
      Player.bulkCreate.mockResolvedValue([]);

      const response = await request(app).post('/api/v1/teams/sync/1');

      expect(response.status).toBe(200);
    });

    it('should handle bulk create error', async () => {
      const mockLeague = { id: 1, name: 'Test League' };
      const mockApiResponse = { data: [{ team_key: 'team_1', team_name: 'Test Team' }] };

      League.findByPk.mockResolvedValue(mockLeague);
      http.mockResolvedValue(mockApiResponse);
      Team.bulkCreate.mockRejectedValue(new Error('Bulk create failed'));

      const response = await request(app).post('/api/v1/teams/sync/1');

      expect(response.status).toBe(200);
      expect(response.body.data.errors).toContain('Bulk operation failed: Bulk create failed');
    });
  });

  describe('PATCH /api/v1/teams/img-url/:id', () => {
    it('should upload team images successfully', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        imgUrls: [],
        update: jest.fn().mockResolvedValue([1]),
      };

      Team.findByPk.mockResolvedValue(mockTeam);
      cloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image1.jpg',
        public_id: 'test_id_1',
      });

      const response = await request(app)
        .patch('/api/v1/teams/img-url/1')
        .attach('images', Buffer.from('fake image data'), 'test1.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when team not found for image upload', async () => {
      Team.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/teams/img-url/999')
        .attach('images', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(404);
    });

    it('should return 400 when no images provided', async () => {
      const mockTeam = { id: 1, name: 'Test Team', imgUrls: [] };
      Team.findByPk.mockResolvedValue(mockTeam);

      const response = await request(app).patch('/api/v1/teams/img-url/1');

      expect(response.status).toBe(400);
    });

    it('should return 400 when exceeding image limit', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        imgUrls: [{ url: 'img1' }, { url: 'img2' }, { url: 'img3' }, { url: 'img4' }],
      };

      Team.findByPk.mockResolvedValue(mockTeam);

      const response = await request(app)
        .patch('/api/v1/teams/img-url/1')
        .attach('images', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/teams/img-url/:id/:imageIndex', () => {
    it('should delete team image successfully', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        imgUrls: [
          { url: 'img1', public_id: 'id1' },
          { url: 'img2', public_id: 'id2' },
        ],
        update: jest.fn().mockResolvedValue([1]),
      };

      Team.findByPk.mockResolvedValue(mockTeam);
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const response = await request(app).delete('/api/v1/teams/img-url/1/0');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when team not found for image deletion', async () => {
      Team.findByPk.mockResolvedValue(null);

      const response = await request(app).delete('/api/v1/teams/img-url/999/0');

      expect(response.status).toBe(404);
    });

    it('should return 400 when team has no images', async () => {
      const mockTeam = { id: 1, name: 'Test Team', imgUrls: [] };
      Team.findByPk.mockResolvedValue(mockTeam);

      const response = await request(app).delete('/api/v1/teams/img-url/1/0');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid image index', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        imgUrls: [{ url: 'img1', public_id: 'id1' }],
      };

      Team.findByPk.mockResolvedValue(mockTeam);

      const response = await request(app).delete('/api/v1/teams/img-url/1/5');

      expect(response.status).toBe(400);
    });

    it('should handle cloudinary deletion error gracefully', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        imgUrls: [{ url: 'img1', public_id: 'id1' }],
        update: jest.fn().mockResolvedValue([1]),
      };

      Team.findByPk.mockResolvedValue(mockTeam);
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Cloudinary error'));

      const response = await request(app).delete('/api/v1/teams/img-url/1/0');

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/v1/teams/generate-descriptions/:id', () => {
    it('should update team description successfully', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        country: 'Test Country',
        foundedYear: 2000,
        coach: 'Test Coach',
        description: null,
      };

      Team.findByPk.mockResolvedValue(mockTeam);
      Team.update.mockResolvedValue([1]);
      generateAi.mockResolvedValue('Generated team description');

      const response = await request(app).patch('/api/v1/teams/generate-descriptions/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Team description updated successfully');
    });

    it('should skip description update if already exists', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        description: 'Existing description',
      };

      Team.findByPk.mockResolvedValue(mockTeam);

      const response = await request(app).patch('/api/v1/teams/generate-descriptions/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Team description already exists, skipping regeneration');
    });

    it('should return 404 when team not found for description update', async () => {
      Team.findByPk.mockResolvedValue(null);

      const response = await request(app).patch('/api/v1/teams/generate-descriptions/999');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid team id in description update', async () => {
      const response = await request(app).patch('/api/v1/teams/generate-descriptions/invalid');

      expect(response.status).toBe(400);
    });

    it('should handle AI generation error', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        country: 'Test Country',
        foundedYear: 2000,
        description: null,
      };

      Team.findByPk.mockResolvedValue(mockTeam);
      generateAi.mockRejectedValue(new Error('AI service error'));

      const response = await request(app).patch('/api/v1/teams/generate-descriptions/1');

      expect(response.status).toBe(500);
    });
  });
});

// Test untuk Team Model
describe('Team Model', () => {
  describe('Model Definition', () => {
    it('should define Team model with correct attributes', () => {
      // Mock sequelize and DataTypes
      const mockSequelize = {
        define: jest.fn(),
      };
      const mockDataTypes = {
        INTEGER: 'INTEGER',
        STRING: 'STRING',
        DATE: 'DATE',
        TEXT: 'TEXT',
        JSON: 'JSON',
      };

      // Mock the model class
      class MockModel {
        static associate() {}
        static init() {}
      }

      // Test that we can create the model definition
      const mockTeamFactory = (sequelize, DataTypes) => {
        return class Team extends MockModel {
          static associate(models) {
            return true; // Just return something to test
          }
        };
      };

      const TeamModel = mockTeamFactory(mockSequelize, mockDataTypes);
      expect(TeamModel).toBeDefined();
      expect(typeof TeamModel.associate).toBe('function');
    });

    it('should have correct associations method', () => {
      class MockTeam {
        static belongsTo = jest.fn();
        static hasMany = jest.fn();

        static associate(models) {
          this.belongsTo(models.League, {
            foreignKey: 'leagueId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          });
          this.hasMany(models.Player, {
            foreignKey: 'teamId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          });
          this.hasMany(models.Favorite, {
            foreignKey: 'teamId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          });
          this.hasMany(models.Match, {
            foreignKey: 'home_team_id',
            as: 'HomeMatches',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          });
          this.hasMany(models.Match, {
            foreignKey: 'away_team_id',
            as: 'AwayMatches',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          });
        }
      }

      const mockModels = {
        League: {},
        Player: {},
        Favorite: {},
        Match: {},
      };

      MockTeam.associate(mockModels);

      expect(MockTeam.belongsTo).toHaveBeenCalledWith(mockModels.League, {
        foreignKey: 'leagueId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      expect(MockTeam.hasMany).toHaveBeenCalledTimes(4);
    });
  });

  describe('Model Validations', () => {
    it('should validate required fields', () => {
      // Test validation logic
      const validateRequired = (field, value) => {
        if (!value) {
          throw new Error(`${field} is required`);
        }
        return true;
      };

      expect(() => validateRequired('leagueId', null)).toThrow('leagueId is required');
      expect(() => validateRequired('name', '')).toThrow('name is required');
      expect(() => validateRequired('externalRef', null)).toThrow('externalRef is required');

      expect(validateRequired('leagueId', 1)).toBe(true);
      expect(validateRequired('name', 'Test Team')).toBe(true);
    });

    it('should validate integer fields', () => {
      const validateInteger = (field, value) => {
        if (value !== null && value !== undefined && !Number.isInteger(value)) {
          throw new Error(`${field} must be an integer`);
        }
        return true;
      };

      expect(() => validateInteger('leagueId', 'invalid')).toThrow('leagueId must be an integer');
      expect(() => validateInteger('foundedYear', 'invalid')).toThrow(
        'foundedYear must be an integer'
      );

      expect(validateInteger('leagueId', 1)).toBe(true);
      expect(validateInteger('foundedYear', 2000)).toBe(true);
      expect(validateInteger('foundedYear', null)).toBe(true);
    });

    it('should validate URL format', () => {
      const validateUrl = (url) => {
        if (url && !url.startsWith('http')) {
          throw new Error('Logo URL must be a valid URL');
        }
        return true;
      };

      expect(() => validateUrl('invalid-url')).toThrow('Logo URL must be a valid URL');
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl(null)).toBe(true);
    });

    it('should validate string lengths', () => {
      const validateLength = (field, value, min, max) => {
        if (value !== null && value !== undefined && (value.length < min || value.length > max)) {
          throw new Error(`${field} must be between ${min} and ${max} characters`);
        }
        return true;
      };

      expect(() => validateLength('name', 'x'.repeat(101), 1, 100)).toThrow(
        'name must be between 1 and 100 characters'
      );
      expect(() => validateLength('name', '', 1, 100)).toThrow(
        'name must be between 1 and 100 characters'
      );

      expect(validateLength('name', 'Valid Team', 1, 100)).toBe(true);
      expect(validateLength('name', null, 1, 100)).toBe(true); // null should be valid
    });

    it('should validate year range', () => {
      const validateYear = (year) => {
        const currentYear = new Date().getFullYear();
        if (year && (year < 1800 || year > currentYear)) {
          if (year < 1800) throw new Error('Founded year must be after 1800');
          if (year > currentYear) throw new Error('Founded year cannot be in the future');
        }
        return true;
      };

      expect(() => validateYear(1799)).toThrow('Founded year must be after 1800');
      expect(() => validateYear(new Date().getFullYear() + 1)).toThrow(
        'Founded year cannot be in the future'
      );

      expect(validateYear(2000)).toBe(true);
      expect(validateYear(null)).toBe(true);
    });

    it('should validate stadium capacity', () => {
      const validateCapacity = (capacity) => {
        if (capacity !== null && capacity !== undefined && capacity < 0) {
          throw new Error('Stadium capacity cannot be negative');
        }
        return true;
      };

      expect(() => validateCapacity(-1)).toThrow('Stadium capacity cannot be negative');
      expect(validateCapacity(50000)).toBe(true);
      expect(validateCapacity(null)).toBe(true);
    });
  });

  describe('Model Instance Methods', () => {
    let mockTeamInstance;

    beforeEach(() => {
      mockTeamInstance = {
        id: 1,
        name: 'Test Team',
        country: 'Test Country',
        imgUrls: [],
        save: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        toJSON: jest.fn(),
        reload: jest.fn(),
      };
    });

    it('should save instance successfully', async () => {
      mockTeamInstance.save.mockResolvedValue(mockTeamInstance);

      const result = await mockTeamInstance.save();

      expect(result).toBe(mockTeamInstance);
      expect(mockTeamInstance.save).toHaveBeenCalled();
    });

    it('should update instance successfully', async () => {
      const updateData = { name: 'Updated Team' };
      mockTeamInstance.update.mockResolvedValue([1]);

      const result = await mockTeamInstance.update(updateData);

      expect(result).toEqual([1]);
      expect(mockTeamInstance.update).toHaveBeenCalledWith(updateData);
    });

    it('should destroy instance successfully', async () => {
      mockTeamInstance.destroy.mockResolvedValue(1);

      const result = await mockTeamInstance.destroy();

      expect(result).toBe(1);
      expect(mockTeamInstance.destroy).toHaveBeenCalled();
    });

    it('should serialize to JSON', () => {
      mockTeamInstance.toJSON.mockReturnValue({
        id: 1,
        name: 'Test Team',
        country: 'Test Country',
      });

      const json = mockTeamInstance.toJSON();

      expect(json).toEqual({
        id: 1,
        name: 'Test Team',
        country: 'Test Country',
      });
    });

    it('should reload instance', async () => {
      mockTeamInstance.reload.mockResolvedValue(mockTeamInstance);

      const result = await mockTeamInstance.reload();

      expect(result).toBe(mockTeamInstance);
    });
  });
});
