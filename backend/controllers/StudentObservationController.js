//Handles most of logic in StudentObservation routes and talks directly to StudentObservation Model

//Retrieve the Student Observation Model
const studentObservationModel = require('../models/StudentObservationModel');

//Logic to post a new student observation to database
//POST /observations/student
exports.createStudentObservation = async (req, res) => {
    try {
      const {
        note,
        session_id,
        student_id,
        behavior_tags,
        affect,
        submitted_by_user,
        single_click,
        recording,
        picture_attachments,
      } = req.body;
  
      console.log(req.body);
  
      // Basic validation
      if ( !single_click && (!student_id || !session_id || !submitted_by_user || !Array.isArray(behavior_tags) || !Array.isArray(affect))) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Build observation info object to pass to model
      const observationInfo = {
        note,
        //Define start_time
        start_time: new Date(),
        session_id,
        student_id,
        behavior_tags,
        affect,
        submitted_by_user: submitted_by_user ?? false, // default false if undefined
        recording: recording === undefined ? null : !!recording, // default null if not provided
        picture_attachments: picture_attachments ?? null,
      };

      console.log(req.body);

      // Call model create method to insert into DB
      const newObservationId = await studentObservationModel.create(observationInfo);

      console.log(newObservationId);

    // Return the new observation ID
    return res.status(201).json({ id: newObservationId });
      // Logic to create observation in database should go here
    } catch (err) {
      console.error('Unexpected error creating student observation', err);
      return res.status(500).json({ error: 'Unexpected Student Observation Creation Error' });
    }
  };