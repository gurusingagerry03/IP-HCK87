const router = require('express').Router();
const teamController = require('../controllers/teamController');

// Keep only endpoints that client uses
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);

// Sync endpoints
router.post('/sync/:leagueId', teamController.synchronizeTeamsAndPlayersFromAPI);

module.exports = router;
