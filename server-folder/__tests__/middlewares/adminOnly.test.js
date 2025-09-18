const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../../middlewares/authenticate');
const adminOnly = require('../../middlewares/adminOnly');
const { errorHandling } = require('../../middlewares/errorHandling');

// Mock the jwt helper
jest.mock('../../helpers/jwt', () => ({
  verifyToken: jest.fn(),
}));

const { verifyToken } = require('../../helpers/jwt');

// Test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

describe('AdminOnly Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Access Control', () => {
    it('should allow access for admin users', async () => {
      const mockAdminUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
      };

      verifyToken.mockResolvedValue(mockAdminUser);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
          user: req.user,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockAdminUser, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Admin access granted',
        user: mockAdminUser,
      });
    });

    it('should deny access for regular users', async () => {
      const mockRegularUser = {
        id: 2,
        email: 'user@example.com',
        role: 'user',
      };

      verifyToken.mockResolvedValue(mockRegularUser);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockRegularUser, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });

    it('should deny access when user role is undefined', async () => {
      const mockUserWithoutRole = {
        id: 3,
        email: 'norole@example.com',
        // role is undefined
      };

      verifyToken.mockResolvedValue(mockUserWithoutRole);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockUserWithoutRole, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });

    it('should deny access when user role is null', async () => {
      const mockUserWithNullRole = {
        id: 4,
        email: 'nullrole@example.com',
        role: null,
      };

      verifyToken.mockResolvedValue(mockUserWithNullRole);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockUserWithNullRole, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });

    it('should deny access when user role is empty string', async () => {
      const mockUserWithEmptyRole = {
        id: 5,
        email: 'empty@example.com',
        role: '',
      };

      verifyToken.mockResolvedValue(mockUserWithEmptyRole);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockUserWithEmptyRole, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });
  });

  describe('Different Role Cases', () => {
    it('should handle case-sensitive role comparison', async () => {
      const mockUserWithUppercaseRole = {
        id: 6,
        email: 'uppercase@example.com',
        role: 'ADMIN',
      };

      verifyToken.mockResolvedValue(mockUserWithUppercaseRole);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockUserWithUppercaseRole, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });

    it('should deny access for moderator role', async () => {
      const mockModeratorUser = {
        id: 7,
        email: 'moderator@example.com',
        role: 'moderator',
      };

      verifyToken.mockResolvedValue(mockModeratorUser);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockModeratorUser, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });

    it('should deny access for guest role', async () => {
      const mockGuestUser = {
        id: 8,
        email: 'guest@example.com',
        role: 'guest',
      };

      verifyToken.mockResolvedValue(mockGuestUser);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockGuestUser, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle admin user with additional properties', async () => {
      const mockAdminWithExtras = {
        id: 9,
        email: 'admin-extra@example.com',
        role: 'admin',
        fullname: 'Admin User',
        createdAt: new Date(),
        permissions: ['read', 'write', 'delete'],
      };

      verifyToken.mockResolvedValue(mockAdminWithExtras);

      app.get('/admin-only', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Admin access granted',
          userPermissions: req.user.permissions,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockAdminWithExtras, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Admin access granted',
        userPermissions: ['read', 'write', 'delete'],
      });
    });

    it('should handle missing user object in request', async () => {
      // This would happen if adminOnly is used without authenticate middleware
      app.get('/admin-only-no-auth', adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Should not reach here',
        });
      });
      app.use(errorHandling);

      const response = await request(app).get('/admin-only-no-auth').expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    });

    it('should work with POST requests', async () => {
      const mockAdminUser = {
        id: 10,
        email: 'admin-post@example.com',
        role: 'admin',
      };

      verifyToken.mockResolvedValue(mockAdminUser);

      app.post('/admin-create', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Resource created',
          data: req.body,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockAdminUser, process.env.JWT_SECRET);

      const response = await request(app)
        .post('/admin-create')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Resource' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Resource created',
        data: { name: 'Test Resource' },
      });
    });

    it('should work with PUT requests', async () => {
      const mockAdminUser = {
        id: 11,
        email: 'admin-put@example.com',
        role: 'admin',
      };

      verifyToken.mockResolvedValue(mockAdminUser);

      app.put('/admin-update/:id', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Resource updated',
          id: req.params.id,
          data: req.body,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockAdminUser, process.env.JWT_SECRET);

      const response = await request(app)
        .put('/admin-update/123')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'updated' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Resource updated',
        id: '123',
        data: { status: 'updated' },
      });
    });

    it('should work with DELETE requests', async () => {
      const mockAdminUser = {
        id: 12,
        email: 'admin-delete@example.com',
        role: 'admin',
      };

      verifyToken.mockResolvedValue(mockAdminUser);

      app.delete('/admin-delete/:id', authenticate, adminOnly, (req, res) => {
        res.json({
          success: true,
          message: 'Resource deleted',
          id: req.params.id,
        });
      });
      app.use(errorHandling);

      const token = jwt.sign(mockAdminUser, process.env.JWT_SECRET);

      const response = await request(app)
        .delete('/admin-delete/456')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Resource deleted',
        id: '456',
      });
    });
  });
});
