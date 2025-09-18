const router = require('express').Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google-login', userController.googleLogin);
router.get('/:id', userController.getUserById);

module.exports = router;
