//Define routes for the Session Model
//route for POST new session info, route to GET session by....

//Basic Setup
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/SessionController.js');

//Post Route to create a new entry in session table
router.post('/', sessionController.createSession);

//Get Route to check if server is online
router.get('/check', sessionController.checkSession);

//Get Route to retrieve session information using session id
router.get('/:id', sessionController.getSessionById);

//PUT route to update session information using session id
router.put('/:id', sessionController.updateSessionById);

//DELETE route to remove session using session id
router.delete('/:id', sessionController.deleteSessionById);

//Get Route to retrieve session sections and tags by session id
router.get('/:id/sections', sessionController.getSessionSections);

//PUT route to replace session sections and tags by session id
router.put('/:id/sections', sessionController.updateSessionSections);

//Get Route to retrieve session information using join code
router.get('/join/:join_code', sessionController.getSessionByJoinCode);

//PUT route to update session observers with a user id
router.put('/:id/observers', sessionController.addObserverToSession);

module.exports = router;