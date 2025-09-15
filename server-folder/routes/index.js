const express = require('express');
const leagueRoutes = require('./leagueRoutes');
const teamRoutes = require('./teamRoutes');
const playerRoutes = require('./playerRoutes');
const matchRoutes = require('./matchRoutes');

const router = express.Router();

/**
 * API Routes Index
 * Base path: /api
 */

// Health check for API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount route modules
router.use('/leagues', leagueRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);

module.exports = router;
