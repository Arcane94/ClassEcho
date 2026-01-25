//Define routes for the user Model

//Basic Setup
const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController.js');

//Post Route to create a new user, returns new user id
router.post('/', userController.createUser);

//Post route to login a user, returns user info if successful
router.post('/login', userController.loginUser);

//GET route to retrieve user information by user id
router.get('/:id', userController.getUserById);

module.exports = router;