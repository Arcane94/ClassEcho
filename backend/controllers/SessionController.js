//Handles most of logic in Session routes and talks directly to Session Model

//Retrieve the Session Model
const Session = require(`../models/SessionModel`);

//Logic to create a new Session entry in database
//POST /sessions
exports.createSession = async (req, res) => {
    //Try to pull payload from web
    try {
        const {
            username,
            teacherName,
            lessonTitle,
            lessonDescription,
        } = req.body;

        console.log(req.body);
        //Ensure fields are all filled
        if (!username || !teacherName || !lessonTitle) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        //Logic to create new session in database should go here

        //For now, return a madeup sessionId to frontend
        return res.status(201).json({ sessionId: 5 });
    } catch (error) {
        console.error('Unexpected error creating session', err);
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
      session = null;
  
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