// Teacher observation routes: create, delete, and fetch teacher logs for a session.

//Basic Setup
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/TeacherObservationController.js');

//Post Route to create a new teacher obsservation
router.post('/', teacherController.createTeacherObservation);
//Post route to delete a new student observation
router.post('/delete', teacherController.deleteTeacherObservation);
//Get observation count for a session
router.get('/session/:session_id/count', teacherController.getObservationCountBySessionId);
//Get all observations for a session
router.get('/session/:session_id', teacherController.getObservationsBySessionId);
//Get a single observation by id
router.get('/:id', teacherController.getObservationById);

module.exports = router;
