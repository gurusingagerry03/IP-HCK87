const router = require('express').Router();
const playerController = require('../controllers/playerController');

// Keep only endpoints that client uses
router.get('/team/:id', playerController.getPlayersByTeamId);
router.get('/', playerController.getAllPlayers);

module.exports = router;
