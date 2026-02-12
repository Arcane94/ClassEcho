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
        selected_tags,
        affect,
        submitted_by_user,
        single_click,
        recording,
        on_task,
        picture_attachments,
      } = req.body;
  
      console.log(req.body);
  
      // Basic validation
      if ( !single_click && (!session_id || !Array.isArray(affect))) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Build observation info object to pass to model
      const observationInfo = {
        note,
        //Define start_time
        start_time: new Date(),
        session_id,
        student_id,
        selected_tags,
        affect,
        submitted_by_user: submitted_by_user ?? false, // default false if undefined
        recording: recording == null ? null : !!recording,
        on_task,
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

  //Logic to find and remove an observation from the logs given the observations id
  exports.deleteStudentObservation = async (req, res) => {
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
       const rowsDeleted = await studentObservationModel.deleteMultiple(ids);

       //Return number of deletes performed
       return res.status(200).json({data: rowsDeleted});
    } catch (error) {
      console.error("Unexpected Error Occurred while deleting logs", error);
      return res.status(500).json({error: "Unexpected Server Error"});
    }
  }