//Define routes for the teacherObservations Model
//POST for new teacher observations....

//Basic Setup
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/TeacherObservationController.js');

//Post Route to create a new teacher obsservation
router.post('/', teacherController.createTeacherObservation);
//Post route to delete a new student observation
router.post('/delete', teacherController.deleteTeacherObservation);
//Get all observations for a session
router.get('/session/:session_id', teacherController.getObservationsBySessionId);
//Get a single observation by id
router.get('/:id', teacherController.getObservationById);

module.exports = router;