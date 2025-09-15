const express = require('express');
const TeamController = require('../controllers/teamController');
const router = express.Router();

/**
 * Team Routes
 * Base path: /api/teams
 */

// GET /api/teams - Get teams with filtering and pagination
router.get('/', TeamController.getAllTeamsWithFilters);

// GET /api/teams/:id - Get team by ID with details
router.get('/:id', TeamController.getTeamById);

// POST /api/teams/sync/:leagueId - Synchronize teams and players from external API
router.post('/sync/:leagueId', TeamController.synchronizeTeamsAndPlayersFromAPI);

module.exports = router;
