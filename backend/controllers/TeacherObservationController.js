//Handles most of logic in TeacherObservation routes and talks directly to TeacherObservation Model

//Retrieve the Teacher Observation Model
const teacherObservationModel = require('../models/TeacherObservationModel');

//Logic to post a new teacher observation to database
//POST /observations/teacher
exports.createTeacherObservation = async (req, res) => {
    try {
      const {
        note,
        startTime,
        sessionId,
        studentId,
        behaviorTags,
        StructureTags,
        functionTags,
      } = req.body;
  
      console.log(req.body);
  
      // Basic validation
      if ( !note || !startTime || !sessionId || !studentId || !Array.isArray(behaviorTags) || !Array.isArray(StructureTags) || !Array.isArray(functionTags)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Logic to create observation in database should go here
    } catch (err) {
      console.error('Unexpected error creating teacher observation', err);
      return res.status(500).json({ error: 'Unexpected Teacher Observation Creation Error' });
    }
  };