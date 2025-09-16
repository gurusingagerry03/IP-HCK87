const express = require('express');
const MatchController = require('../controllers/matchController');
const router = express.Router();

/**
 * Match Routes
 * Base path: /api/matches
 */

// GET /api/matches/league/:leagueId - Get matches by league ID (uses same controller method)
router.get('/league/:leagueId', MatchController.getAllMatchesWithFilters);

// POST /api/matches/sync/:leagueId - Synchronize matches from external API
router.post('/sync/:leagueId', MatchController.synchronizeMatchesFromAPI);

module.exports = router;
