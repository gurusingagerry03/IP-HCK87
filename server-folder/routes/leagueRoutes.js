const express = require('express');
const LeagueController = require('../controllers/leagueController');
const router = express.Router();

/**
 * League Routes
 * Base path: /api/leagues
 */

// GET /api/leagues - Get all leagues
router.get('/', LeagueController.getAllLeagues);

// GET /api/leagues/:id - Get league by ID
router.get('/:id', LeagueController.getLeagueById);

// POST /api/leagues/sync - Synchronize league from external API
router.post('/sync', LeagueController.synchronizeLeagueFromAPI);

module.exports = router;
