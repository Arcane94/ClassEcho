// Student observation routes: create, delete, and fetch student logs for a session.

//Basic Setup
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/StudentObservationController.js');

//Post Route to create a new student observation
router.post('/', studentController.createStudentObservation);
//Post route to delete a new student observation
router.post('/delete', studentController.deleteStudentObservation);
//Get observation count for a session
router.get('/session/:session_id/count', studentController.getObservationCountBySessionId);
//Get all observations for a session
router.get('/session/:session_id', studentController.getObservationsBySessionId);
//Get a single observation by id
router.get('/:id', studentController.getObservationById);

module.exports = router;
