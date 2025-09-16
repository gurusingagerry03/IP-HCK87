const router = require('express').Router();
const matchController = require('../controllers/matchController');

// Keep only endpoints that client uses
router.get('/league/:id', matchController.getMatchesByLeagueId);

// Sync endpoints
router.post('/sync/:leagueId', matchController.synchronizeMatchesByLeagueId);

module.exports = router;
