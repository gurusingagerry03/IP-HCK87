const router = require('express').Router();
const matchController = require('../controllers/matchController');

// Keep only endpoints that client uses
router.get('/league/:id', matchController.getMatchesByLeagueId);
router.post('/sync/:leagueId', matchController.synchronizeMatchesByLeagueId);
router.put('/analysis/:id', matchController.updateMatchAnalysis);
router.put('/preview/:id', matchController.updateMatchPreviewAndPrediction);
//routet get match by id
router.get('/:id', matchController.getMatchById);

// Sync endpoints

module.exports = router;
