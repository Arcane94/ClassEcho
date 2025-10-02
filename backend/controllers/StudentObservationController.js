//Handles most of logic in StudentObservation routes and talks directly to StudentObservation Model

//Retrieve the Student Observation Model
const studentObservationModel = require('../models/StudentObservationModel');

//Logic to post a new student observation to database
//POST /observations/student
exports.createStudentObservation = async (req, res) => {
    try {
      const {
        note,
        startTime,
        sessionId,
        studentId,
        behaviorTags,
        affectTags,
      } = req.body;
  
      console.log(req.body);
  
      // Basic validation
      if ( !note || !startTime || !sessionId || !studentId || !Array.isArray(behaviorTags) || !Array.isArray(affectTags)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Logic to create observation in database should go here
    } catch (err) {
      console.error('Unexpected error creating teacher observation', err);
      return res.status(500).json({ error: 'Unexpected Teacher Observation Creation Error' });
    }
  };