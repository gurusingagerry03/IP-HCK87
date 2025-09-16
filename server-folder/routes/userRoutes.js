const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authenticate');
const authorization = require('../middlewares/authorization');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/:id', authenticate, authorization, userController.getUserById);

module.exports = router;
