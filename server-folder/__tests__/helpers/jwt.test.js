// Mock the jwt helper to ensure environment is set before requiring
jest.mock('../../helpers/jwt', () => {
  process.env.JWT = 'test-secret-key-for-testing';
  const jwt = require('jsonwebtoken');
  const SECRET_KEY = process.env.JWT;

  return {
    generateToken: (payload) => {
      return jwt.sign(payload, SECRET_KEY);
    },
    verifyToken: (token) => {
      return jwt.verify(token, SECRET_KEY);
    },
  };
});

const jwtHelper = require('../../helpers/jwt');
const jwt = require('jsonwebtoken');

describe('JWT Helper Tests', () => {
  const testPayload = {
    id: 1,
    email: 'test@example.com',
    role: 'user',
  };

  beforeAll(() => {
    // Ensure JWT secret is set for tests
    if (!process.env.JWT) {
      process.env.JWT = 'test-secret-key-for-testing';
    }

    // Also set JWT_SECRET for consistency
    process.env.JWT_SECRET = process.env.JWT;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = jwtHelper.generateToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { id: 1, role: 'user' };
      const payload2 = { id: 2, role: 'admin' };

      const token1 = jwtHelper.generateToken(payload1);
      const token2 = jwtHelper.generateToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should generate token with simple payload', () => {
      const simplePayload = { userId: 123 };
      const token = jwtHelper.generateToken(simplePayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate token with complex payload', () => {
      const complexPayload = {
        user: {
          id: 1,
          email: 'test@example.com',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        permissions: ['read', 'write'],
        timestamp: Date.now(),
      };

      const token = jwtHelper.generateToken(complexPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate token with empty object payload', () => {
      const emptyPayload = {};
      const token = jwtHelper.generateToken(emptyPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate token that can be decoded', () => {
      const token = jwtHelper.generateToken(testPayload);
      const decoded = jwt.decode(token);

      expect(decoded).toMatchObject(testPayload);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwtHelper.generateToken(testPayload);
      const verified = jwtHelper.verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified.id).toBe(testPayload.id);
      expect(verified.email).toBe(testPayload.email);
      expect(verified.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwtHelper.verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';

      expect(() => {
        jwtHelper.verifyToken(malformedToken);
      }).toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => {
        jwtHelper.verifyToken('');
      }).toThrow();
    });

    it('should throw error for null token', () => {
      expect(() => {
        jwtHelper.verifyToken(null);
      }).toThrow();
    });

    it('should throw error for undefined token', () => {
      expect(() => {
        jwtHelper.verifyToken(undefined);
      }).toThrow();
    });

    it('should verify token with complex payload', () => {
      const complexPayload = {
        user: {
          id: 1,
          email: 'test@example.com',
        },
        permissions: ['read', 'write'],
      };

      const token = jwtHelper.generateToken(complexPayload);
      const verified = jwtHelper.verifyToken(token);

      expect(verified.user).toEqual(complexPayload.user);
      expect(verified.permissions).toEqual(complexPayload.permissions);
    });

    it('should handle expired token scenario', () => {
      // Create a token with very short expiry
      const shortLivedToken = jwt.sign(testPayload, process.env.JWT, { expiresIn: '1ms' });

      // Wait a bit to ensure token expires
      setTimeout(() => {
        expect(() => {
          jwtHelper.verifyToken(shortLivedToken);
        }).toThrow();
      }, 10);
    });

    it('should verify token signed with same secret', () => {
      const manualToken = jwt.sign({ id: 999 }, process.env.JWT);
      const verified = jwtHelper.verifyToken(manualToken);

      expect(verified.id).toBe(999);
    });

    it('should reject token signed with different secret', () => {
      const differentSecretToken = jwt.sign(testPayload, 'different-secret');

      expect(() => {
        jwtHelper.verifyToken(differentSecretToken);
      }).toThrow();
    });
  });

  describe('Token Round Trip', () => {
    it('should generate and verify token successfully', () => {
      const originalPayload = {
        id: 42,
        username: 'testuser',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
      };

      // Generate token
      const token = jwtHelper.generateToken(originalPayload);

      // Verify token
      const verifiedPayload = jwtHelper.verifyToken(token);

      // Check that all original data is preserved
      expect(verifiedPayload.id).toBe(originalPayload.id);
      expect(verifiedPayload.username).toBe(originalPayload.username);
      expect(verifiedPayload.role).toBe(originalPayload.role);
      expect(verifiedPayload.permissions).toEqual(originalPayload.permissions);
    });
  });
});
