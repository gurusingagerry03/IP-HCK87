require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandling } = require('./middlewares/errorHandling');
const apiRoutes = require('./routes');

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ninety Minutes API',
    version: '1.0.0',
    documentation: {
      baseUrl: '/api/v1',
      endpoints: {
        leagues: '/api/v1/leagues',
        teams: '/api/v1/teams',
        players: '/api/v1/players',
        matches: '/api/v1/matches',
      },
    },
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/v1/leagues',
      'POST /api/v1/leagues/sync',
      'GET /api/v1/teams',
      'GET /api/v1/teams/league/:leagueId',
      'GET /api/v1/teams/:id',
      'POST /api/v1/teams/sync/:leagueId',
      'GET /api/v1/players',
      'GET /api/v1/players/:teamId',
      'POST /api/v1/players/sync/:teamId',
      'GET /api/v1/matches/league/:leagueId',
      'POST /api/v1/matches/sync/:leagueId',
    ],
  });
});

// Error handling middleware (must be last)
app.use(errorHandling);

module.exports = app;
