//Handles most of logic in TeacherObservation routes and talks directly to TeacherObservation Model

//Retrieve the Teacher Observation Model
const teacherObservationModel = require('../models/TeacherObservationModel');

//Logic to post a new teacher observation to database
//POST /observations/teacher
exports.createTeacherObservation = async (req, res) => {
  try {
    console.log('Server Reached');
    console.log(req.body);
    // Destructure keys in proper formatting to match data provided by frontend
    const {
      note,
      session_id,
      student_id,
      behavior_tags,
      structure_tags,
      function_tags,
      custom_tags,
      submitted_by_user,
      single_click,
      recording,
      picture_attachments,
    } = req.body;

    // Ensure all required fields are given if this is not a single click observation
    if (
      !single_click &&
      (!note ||
      !session_id ||
      !student_id ||
      !Array.isArray(behavior_tags) ||
      !Array.isArray(structure_tags) ||
      !Array.isArray(function_tags) ||
      !Array.isArray(custom_tags))
    ) {
      //Alert frontend if any fields are missing
      console.log('problem');
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    // Build observation info object to pass to model
    const observationInfo = {
      note,
      //Define start_time
      start_time: new Date(),
      session_id,
      student_id,
      behavior_tags,
      structure_tags,
      function_tags,
      custom_tags,
      submitted_by_user: submitted_by_user ?? false, // default false if undefined
      recording: recording == null ? null : !!recording,
      picture_attachments: picture_attachments ?? null,
    };

    console.log(req.body);

    // Call model create method to insert into DB
    const newObservationId = await teacherObservationModel.create(observationInfo);

    console.log(newObservationId);

    // Return the new observation ID
    return res.status(201).json({ id: newObservationId });
  } catch (err) {
    console.error('Unexpected error creating teacher observation', err);
    return res.status(500).json({ error: 'Unexpected Teacher Observation Creation Error' });
  }
};