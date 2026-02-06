//Handles most of logic in Session routes and talks directly to Session Model

//Retrieve the Session Model
const Session = require(`../models/SessionModel`);
//Datetime conversion function
const { toMySQLDateTime } = require('../utils/ToSQLDateTime');

//Logic to create a new Session entry in database
//POST /sessions
exports.createSession = async (req, res) => {
    //Try to pull payload from web
    try {
        //Save Body fields
        const {
            local_time,
            observer_name,
            teacher_name,
            session_name,
            lesson_description,
            join_code,
            observers,
            editors
        } = req.body;

        //Ensure fields are all filled
        if (!observer_name || !teacher_name || !session_name || !join_code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }



        //Save all fields to send to model
        const info = {
          server_time: new Date(),
          local_time: formattedLocalTime ?? null,
          observer_name,
          teacher_name,
          session_name: session_name,
          lesson_description: lesson_description || null,
          join_code: join_code,
          observers: observers || null,
          editors: editors || null,
        };

        //Logic to create new session in database should go here
        const session_id = await Session.create(info);

        console.log('Retrieved id: ', session_id);
        //For now, return a madeup sessionId to frontend
        return res.status(201).json({ session_id });
    } catch (error) {
        console.error('Unexpected error creating session', error);
        return res.status(500).json({ error: 'Unexpected Session Creation Error'});
    }
};

//Logic to retrieve session information for database using id
//GET /sessions/:id
exports.getSessionById = async (req, res) => {
    try {
      //parse id from parameters
      const { id } = req.params;
  
      //Logic to retrieve session from database using id
      const session = await Session.getById(id);
      console.log(session);
      //Return a 404 error if session cannot be found
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
  
      return res.json(session);
    } catch (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };

//Logic to retrieve session information from database using join code
//GET /sessions/:join_code
exports.getSessionByJoinCode = async (req, res) => {
    try {
      //parse id from parameters
      const { join_code } = req.params;
  
      //Logic to retrieve session from database using id
      const session = await Session.getByJoinCode(join_code);
      console.log(session);
      //Return a 404 error if session cannot be found
      if (!session) {
        return res.status(404).json({ error: 'Failed to find session' });
      }
  
      return res.json(session);
    } catch (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };

  //Logic to check session and ensure server is currently up and running
  //GET /sessions/check
  exports.checkSession = async (req, res) => {
    res.status(200).json({ message: "Server is Online"});
  }