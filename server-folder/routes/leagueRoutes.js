const router = require('express').Router();
const leagueController = require('../controllers/leagueController');

router.get('/', leagueController.getAllLeagues);
router.get('/:id', leagueController.getLeagueById);
router.post('/sync', leagueController.synchronizeLeagueFromAPI);

module.exports = router;
