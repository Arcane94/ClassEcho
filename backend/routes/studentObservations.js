//Define routes for the StudentObservations Model
//POST for new student observations....

//Basic Setup
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/StudentObservationController.js');

//Post Route to create a new student observation
router.post('/', studentController.createStudentObservation);
//Post route to delete a new student observation
router.post('/delete', studentController.deleteStudentObservation);

module.exports = router;