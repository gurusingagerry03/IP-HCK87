const express = require('express');
const PlayerController = require('../controllers/playerController');
const router = express.Router();

/**
 * Player Routes
 * Base path: /api/players
 */

// GET /api/players - Get all players
router.get('/', PlayerController.getAllPlayers);

// GET /api/players/:id - Get player by ID
router.get('/:id', PlayerController.getPlayerById);

// GET /api/players/team/:teamId - Get players by team ID
router.get('/team/:teamId', PlayerController.getPlayersByTeamId);

module.exports = router;
