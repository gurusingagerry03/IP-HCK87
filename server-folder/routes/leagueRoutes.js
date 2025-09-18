const router = require('express').Router();
const leagueController = require('../controllers/leagueController');
const authenticate = require('../middlewares/authenticate');
const adminOnly = require('../middlewares/adminOnly');

router.get('/', leagueController.getAllLeagues);
router.get('/:id', leagueController.getLeagueById);
router.post('/sync', authenticate, adminOnly, leagueController.synchronizeLeagueFromAPI);

module.exports = router;
