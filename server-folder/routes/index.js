const router = require('express').Router();
const { errorHandling } = require('../middlewares/errorHandling');
const leagueRoutes = require('./leagueRoutes');
const teamRoutes = require('./teamRoutes');
const matchRoutes = require('./matchRoutes');
const playerRoutes = require('./playerRoutes');
const userRoutes = require('./userRoutes');
const matchController = require('../controllers/matchController');

router.use('/users', userRoutes);
router.use('/leagues', leagueRoutes);
router.use('/teams', teamRoutes);
router.use('/matches', matchRoutes);
router.use('/players', playerRoutes);

router.use(errorHandling);
module.exports = router;
