// User routes: expose account, session-list, and access-related endpoints.

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

//PUT route to update a user's sessions array with a new session id
router.put('/:id/sessions', userController.updateUserSessions);

//PUT route to update a user's edit_sessions array with a new session id
router.put('/:id/sessions/edit', userController.updateUserEditSessions);

//GET route to retrieve information of all sessions
router.get('/:id/sessions/all', userController.getUserSessions);

//GET route to retrieve information of all sessions the user has edit access to
router.get('/:id/sessions/edit', userController.getUserEditSessions);

//GET route to retrieve all sessions the user can access through ownership or sharing
router.get('/:id/sessions/access', userController.getUserAccessibleSessions);

//GET route to retrieve a user id by username
router.get('/username/:username', userController.getUserIdByUsername);

//POST route to request password reset code via email
router.post('/password-reset/request', userController.requestPasswordResetCode);

//POST route to verify password reset code
router.post('/password-reset/verify', userController.verifyPasswordResetCode);

//PUT route to confirm password reset with code
router.put('/password-reset/confirm', userController.confirmPasswordReset);

//PUT route to update a user's password
router.put('/:id/password', userController.updateUserPassword);

module.exports = router;
