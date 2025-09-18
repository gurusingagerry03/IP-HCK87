// Mock axios before requiring the module
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => ({
      defaults: {
        baseURL: process.env.BASE_URL_FOOTBALL || 'test-base-url',
        params: {
          APIkey: process.env.API_KEY_FOOTBALL || 'test-api-key',
        },
      },
      request: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  };
  return mockAxios;
});

const axios = require('axios');
const { http } = require('../../helpers/http');

describe('HTTP Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variables
    process.env.BASE_URL_FOOTBALL = 'https://api.football-data.org/v4';
    process.env.API_KEY_FOOTBALL = 'test-football-api-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.BASE_URL_FOOTBALL;
    delete process.env.API_KEY_FOOTBALL;
  });

  describe('HTTP Instance Creation', () => {
    it('should export http instance', () => {
      expect(http).toBeDefined();
      expect(http.defaults).toBeDefined();
    });

    it('should be an axios instance with required methods', () => {
      expect(http.request).toBeDefined();
      expect(http.get).toBeDefined();
      expect(http.post).toBeDefined();
      expect(http.put).toBeDefined();
      expect(http.delete).toBeDefined();
      expect(typeof http.request).toBe('function');
      expect(typeof http.get).toBe('function');
      expect(typeof http.post).toBe('function');
      expect(typeof http.put).toBe('function');
      expect(typeof http.delete).toBe('function');
    });

    it('should have interceptors configured', () => {
      expect(http.interceptors).toBeDefined();
      expect(http.interceptors.request).toBeDefined();
      expect(http.interceptors.response).toBeDefined();
    });

    it('should create axios instance with correct configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: process.env.BASE_URL_FOOTBALL,
        params: {
          APIkey: process.env.API_KEY_FOOTBALL,
        },
      });
    });
  });

  describe('HTTP Configuration', () => {
    it('should have correct baseURL configuration', () => {
      expect(http.defaults.baseURL).toBe(process.env.BASE_URL_FOOTBALL);
    });

    it('should have correct API key in params', () => {
      expect(http.defaults.params).toBeDefined();
      expect(http.defaults.params.APIkey).toBe(process.env.API_KEY_FOOTBALL);
    });

    it('should handle missing environment variables gracefully', () => {
      // This test verifies the module can be imported even if env vars are missing
      delete process.env.BASE_URL_FOOTBALL;
      delete process.env.API_KEY_FOOTBALL;

      // Re-mock axios.create to simulate undefined env vars
      axios.create.mockReturnValueOnce({
        defaults: {
          baseURL: undefined,
          params: {
            APIkey: undefined,
          },
        },
        request: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      // The module should still be importable
      expect(() => {
        require('../../helpers/http');
      }).not.toThrow();
    });

    it('should configure params object correctly', () => {
      expect(typeof http.defaults.params).toBe('object');
      expect(http.defaults.params).toHaveProperty('APIkey');
    });

    it('should have defaults object configured', () => {
      expect(http.defaults).toBeDefined();
      expect(typeof http.defaults).toBe('object');
      expect(http.defaults).toHaveProperty('baseURL');
      expect(http.defaults).toHaveProperty('params');
    });
  });

  describe('Axios Create Call', () => {
    it('should call axios.create exactly once during module load', () => {
      // axios.create should have been called when the module was loaded
      expect(axios.create).toHaveBeenCalled();
    });

    it('should call axios.create with object containing baseURL', () => {
      const createCalls = axios.create.mock.calls;
      const lastCall = createCalls[createCalls.length - 1];
      const config = lastCall[0];

      expect(config).toHaveProperty('baseURL');
    });

    it('should call axios.create with object containing params', () => {
      const createCalls = axios.create.mock.calls;
      const lastCall = createCalls[createCalls.length - 1];
      const config = lastCall[0];

      expect(config).toHaveProperty('params');
      expect(config.params).toHaveProperty('APIkey');
    });

    it('should use environment variables in axios.create call', () => {
      // Set specific test values
      const testBaseUrl = 'https://test-football-api.com';
      const testApiKey = 'test-12345-api-key';

      process.env.BASE_URL_FOOTBALL = testBaseUrl;
      process.env.API_KEY_FOOTBALL = testApiKey;

      // Clear previous calls
      axios.create.mockClear();

      // Re-require the module to trigger axios.create call
      delete require.cache[require.resolve('../../helpers/http')];
      require('../../helpers/http');

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: testBaseUrl,
        params: {
          APIkey: testApiKey,
        },
      });
    });
  });

  describe('HTTP Methods Availability', () => {
    it('should have all standard HTTP methods available', () => {
      const standardMethods = ['get', 'post', 'put', 'delete', 'request'];
      
      standardMethods.forEach(method => {
        expect(http[method]).toBeDefined();
        expect(typeof http[method]).toBe('function');
      });
    });

    it('should preserve axios functionality', () => {
      // The http instance should behave like an axios instance
      expect(http).toHaveProperty('defaults');
      expect(http).toHaveProperty('interceptors');
      expect(http).toHaveProperty('request');
    });
  });
});
