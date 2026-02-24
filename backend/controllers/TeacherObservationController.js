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
      teacher_position,
      selected_tags,
      submitted_by_user,
      single_click,
      recording,
      picture_attachments,
    } = req.body;

    // Ensure all required fields are given if this is not a single click observation
    if (!single_click && !session_id && !teacher_position) {
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
      teacher_position,
      selected_tags,
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
    return res.status(500).json({
      error: 'Unexpected Teacher Observation Creation Error',
      message: err.message
    });
  }
};

//Logic to delete multiple observations
exports.deleteTeacherObservation = async (req, res) => {
  try {
    //Pull ids from request body
     ids = req.body.ids;

     //Ensure that an ids were given and that the length of array is greater than 0
     if (!ids || ids.length === 0) {
      return res.status(400).json({error: "No id given."})
     }

     //Convert ids to numbers
     ids = ids.map(item => typeof item === "object" ? item.id : item);

     console.log(`Deleting observations with ids: ${ids}`)
     //Delete all rows
     const rowsDeleted = await teacherObservationModel.deleteMultiple(ids);

     //Return number of deletes performed
     return res.status(200).json({data: rowsDeleted});
  } catch (error) {
    console.error("Unexpected Error Occurred while deleting logs", error);
    return res.status(500).json({error: "Unexpected Server Error"});
  }
}

//Logic to return all observations for a given session id
exports.getObservationsBySessionId = async (req, res) => {
  try { 
    const { session_id } = req.params;

    const observations = await teacherObservationModel.getBySessionId(session_id);
    
    // Normalize JSON fields from database
    const normalizedObservations = observations.map(obs => ({
      ...obs,
      selected_tags: obs.selected_tags ? (typeof obs.selected_tags === 'string' ? JSON.parse(obs.selected_tags) : obs.selected_tags) : {}
    }));
    
    return res.json(normalizedObservations);
  } catch (err) {
    console.error('Error fetching observations:', err);
    return res.status(500).json({ error: 'Server error' });
  }   
};

//Logic to return a single observation given the observations id
exports.getObservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const observation = await teacherObservationModel.getById(id);
    if (!observation) {
      return res.status(404).json({ error: 'Observation not found' });
    } else {  
      return res.json(observation);
    }
  } catch (err) {
    console.error('Error fetching observation:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};