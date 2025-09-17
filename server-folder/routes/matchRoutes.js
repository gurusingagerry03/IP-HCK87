const router = require('express').Router();
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middlewares/authenticate');
const adminOnly = require('../middlewares/adminOnly');

// Keep only endpoints that client uses
router.get('/', matchController.getAllMatches);
router.get('/league/:id', matchController.getMatchesByLeagueId);
router.get('/:id', matchController.getMatchById);

// Admin only endpoints
router.post(
  '/sync/:leagueId',
  authenticate,
  adminOnly,
  matchController.synchronizeMatchesByLeagueId
);
router.put('/analysis/:id', matchController.updateMatchAnalysis);
router.put('/preview/:id', matchController.updateMatchPreviewAndPrediction);

module.exports = router;
