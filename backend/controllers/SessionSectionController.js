//Handles most of the logic in SessionSection routes and talks directly to SessionSection Model

//Retrieve the SessionSection Model
const SessionSection = require(`../models/SessionSectionModel`);

// Creates a new session_section entry in the database for the selected session
// POST /session_sections
exports.createSessionSection = async (req, res) => {
    //Try to pull payload from web
    try {
        //Save Body fields
        const {
            session_id,
            session_segtor,
            section_name
        } = req.body;

        //Ensure fields are all filled
        if (!session_id || !session_segtor || !section_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        //Save all fields to send to model
        const info = {
          session_id,
          session_segtor,
          section_name,
        };

        const section_id = await SessionSection.create(info);

        console.log('Retrieved section id: ', section_id);
        return res.status(201).json({ section_id });
    } catch (error) {
        console.error('Unexpected error creating session section', error);
        return res.status(500).json({ error: 'Unexpected Session Section Creation Error'});
    }
};

// Logic to retrieve session_section information from database using id
// GET /session_sections/:id
exports.getSessionSectionById = async (req, res) => {
    try {
        //parse id from parameters
        const { id } = req.params;
      
        //Logic to retrieve session_section from database using id
        const session_section = await SessionSection.getById(id);
        console.log(session_section);
        //Return a 404 error if session_section cannot be found
        if (!session_section) {
        return res.status(404).json({ error: 'Session Section not found' });
        }

        return res.json(session_section);
    } catch (err) {
        console.error('Error fetching session:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

//Logic to delete a session_section entry from the database using id
//DELETE /session_sections/:id
exports.deleteSessionSectionById = async (req, res) => {
    try {
        //parse id from parameters
        const { id } = req.params;
        //Logic to delete session_section from database using id
        const deletedCount = await SessionSection.deleteById(id);
        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Session Section not found' });
        }
        return res.status(200).json({ message: 'Session Section deleted successfully' });
    } catch (err) {
        console.error('Error deleting session section:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};