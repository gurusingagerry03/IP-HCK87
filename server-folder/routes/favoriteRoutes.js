// favoriteRoutes.js
const router = require('express').Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middlewares/authenticate');

router.post('/:teamId', authenticate, favoriteController.addFavorite);
router.delete('/:id', authenticate, favoriteController.removeFavorite);
router.get('/', authenticate, favoriteController.getFavoritesByUserId);

module.exports = router;
