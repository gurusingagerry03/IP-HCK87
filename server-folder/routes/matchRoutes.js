const router = require('express').Router();
const matchController = require('../controllers/matchController');

// Keep only endpoints that client uses
router.get('/league/:id', matchController.getMatchesByLeagueId);
router.post('/sync/:leagueId', matchController.synchronizeMatchesByLeagueId);

// Sync endpoints

module.exports = router;
