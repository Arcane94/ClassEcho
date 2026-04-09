//Handles most of logic in StudentObservation routes and talks directly to StudentObservation Model

//Retrieve the Student Observation Model
const studentObservationModel = require('../models/StudentObservationModel');
const Session = require('../models/SessionModel');
const { toEasternMySQLDateTime } = require('../utils/ToSQLDateTime');
const { describeSessionAccess, normalizeUserId } = require('../utils/sessionAccess');
const {
  isNumericOnlyEnabled,
  isValidNumericStudentIdValue,
  normalizeNumericStudentIdValue,
} = require('../utils/studentIdValidation');

function parseObservationDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

//Logic to post a new student observation to database
//POST /observations/student
exports.createStudentObservation = async (req, res) => {
    try {
      const {
        note,
        session_id,
        observer_id,
        student_id,
        start_time,
        end_time,
        selected_tags,
        affect,
        recording,
        on_task,
      } = req.body;
  
      console.log(req.body);
  
      const normalizedSessionId = Number(session_id);
      const normalizedObserverId = Number(observer_id);
      const normalizedRecording = Number(recording);
      const observationStartTime = parseObservationDate(start_time);
      const observationEndTime = parseObservationDate(end_time);

      if (
        Number.isNaN(normalizedSessionId) ||
        Number.isNaN(normalizedObserverId) ||
        ![0, 1].includes(normalizedRecording) ||
        !observationStartTime ||
        !observationEndTime
      ) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (observationEndTime < observationStartTime) {
        return res.status(400).json({ error: 'end_time must be on or after start_time' });
      }

      const session = await Session.getById(normalizedSessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const numericOnlyStudentIds = isNumericOnlyEnabled(session.student_id_numeric_only);
      if (numericOnlyStudentIds && !isValidNumericStudentIdValue(student_id)) {
        return res.status(400).json({ error: 'Student ID(s) must contain numbers only for this session.' });
      }

      // Build observation info object to pass to model
      const observationInfo = {
        note,
        session_id: normalizedSessionId,
        observer_id: normalizedObserverId,
        start_time: toEasternMySQLDateTime(observationStartTime),
        end_time: toEasternMySQLDateTime(observationEndTime),
        student_id: numericOnlyStudentIds ? normalizeNumericStudentIdValue(student_id) : student_id,
        selected_tags,
        affect,
        recording: normalizedRecording,
        on_task,
      };

      const existingObservation = await studentObservationModel.findMatchingObservation(observationInfo);
      if (existingObservation) {
        return res.status(200).json({ id: existingObservation.id, duplicate: true });
      }

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

  //Logic to return all observations for a given session id
  exports.getObservationsBySessionId = async (req, res) => {
    try {
      const { session_id } = req.params;
      const requesterId = normalizeUserId(req.query?.user_id);

      if (requesterId === null) {
        return res.status(400).json({ error: 'Missing user_id in request.' });
      }

      const session = await Session.getById(session_id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const access = await describeSessionAccess(session, requesterId);
      if (!access.permissions.can_export_csv) {
        return res.status(403).json({ error: 'You do not have access to this session.' });
      }

      const observations = await studentObservationModel.getBySessionId(session_id);
      
      // Normalize JSON fields from database
      const normalizedObservations = observations.map(obs => ({
        ...obs,
        selected_tags: obs.selected_tags ? (typeof obs.selected_tags === 'string' ? JSON.parse(obs.selected_tags) : obs.selected_tags) : {},
        affect: obs.affect ? (typeof obs.affect === 'string' ? JSON.parse(obs.affect) : obs.affect) : [],
      }));
      
      return res.json(normalizedObservations);
    } catch (err) {
      console.error('Error fetching observations:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };

exports.getObservationCountBySessionId = async (req, res) => {
  try {
    const { session_id } = req.params;
    const requesterId = normalizeUserId(req.query?.user_id);

    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing user_id in request.' });
    }

    const session = await Session.getById(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const access = await describeSessionAccess(session, requesterId);
    if (!access.permissions.can_export_csv) {
      return res.status(403).json({ error: 'You do not have access to this session.' });
    }

    const count = await studentObservationModel.countBySessionId(session_id);
    return res.json({ count });
  } catch (err) {
    console.error('Error fetching observation count:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

//Logic to return a single observation given the observations id  
exports.getObservationById = async (req, res) => {
    try {
      const { id } = req.params;
      const observation = await studentObservationModel.getById(id);
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
