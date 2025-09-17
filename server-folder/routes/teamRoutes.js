const router = require('express').Router();
const teamController = require('../controllers/teamController');
const { authenticate } = require('../middlewares/authenticate');
const adminOnly = require('../middlewares/adminOnly');

// Keep only endpoints that client uses
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);

// Sync endpoints - Admin only
router.post(
  '/sync/:leagueId',
  authenticate,
  adminOnly,
  teamController.synchronizeTeamsAndPlayersFromAPI
);
router.patch('/generate-descriptions/:id', teamController.updateTeamDescription);
module.exports = router;
