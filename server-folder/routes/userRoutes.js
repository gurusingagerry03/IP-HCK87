// create router for user routes
const express = require('express');
const UserController = require('../controllers/userController');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();

/**
 * User Routes
 * Base path: /api/users
 */

// POST /api/users/register - Create a new user (registration)
router.post('/register', UserController.register);
router.post('/login', UserController.login);
//get user details
router.get('/:id', authenticate, UserController.getUserById);
module.exports = router;
