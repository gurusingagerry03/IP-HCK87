require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandling } = require('./middlewares/errorHandling');
const LeagueController = require('./controllers/leagueController');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

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
    message: 'Football League API',
    version: '1.0.0',
    endpoints: {
      leagues: 'GET /leagues, POST /leagues',
      teams: 'GET /teams, GET /teams/:id',
      players: 'GET /players, GET /players/:teamId',
      matches: 'GET /matches/:id, POST /matches/:id',
      sync: 'POST /sync-team-player/:id',
    },
  });
});

// API Routes
app.get('/leagues', LeagueController.getLeagues);
app.post('/leagues', LeagueController.syncLeagues);

app.get('/teams', LeagueController.getTeams);
app.get('/teams/:id', LeagueController.getTeamsById);

app.get('/players', LeagueController.getPlayers);
app.get('/players/:teamId', LeagueController.getPlayersById);

// Fixed: Changed matches route to use correct controller method
app.post('/matches/:id', LeagueController.syncMatches);

app.post('/sync-team-player/:id', LeagueController.syncTeamPlayer);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandling);

// Graceful shutdown handling
const server = app.listen(port, () => {
  console.log(`🚀 Football League API server running on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
