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

module.exports = router;