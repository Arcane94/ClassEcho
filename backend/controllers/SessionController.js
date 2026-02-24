//Handles most of logic in Session routes and talks directly to Session Model

//Retrieve the Session Model
const Session = require(`../models/SessionModel`);
const SessionSection = require(`../models/SessionSectionModel`);
const SectionTag = require(`../models/SectionTagModel`);
const db = require('../config/dbConfig');
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
          editors,
          sections
        } = req.body;

        //Ensure fields are all filled
        if (!observer_name || !teacher_name || !session_name || !join_code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }



        //Save all fields to send to model
        const info = {
          server_time: new Date(),
          local_time: local_time ? toMySQLDateTime(local_time) : null,
          observer_name,
          teacher_name,
          session_name: session_name,
          lesson_description: lesson_description || null,
          join_code: join_code,
          observers: observers || null,
          editors: editors || null,
        };

        const result = await db.transaction(async (trx) => {
          const session_id = await Session.create(info, trx);

          const createdSections = [];
          if (Array.isArray(sections)) {
            for (const section of sections) {
              const section_id = await SessionSection.create({
                session_id,
                session_segtor: section.session_segtor,
                section_name: section.section_name,
              }, trx);

              const createdTags = [];
              if (Array.isArray(section.tags)) {
                for (const tag of section.tags) {
                  const tag_id = await SectionTag.create({
                    section_id,
                    tag_name: tag.tag_name,
                  }, trx);
                  createdTags.push({ tag_id, tag_name: tag.tag_name });
                }
              }

              createdSections.push({ section_id, section_name: section.section_name, tags: createdTags });
            }
          }

          return { session_id, sections: createdSections };
        });

        console.log('Retrieved id: ', result.session_id);
        return res.status(201).json(result);
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

//Logic to retrieve all sections and tags for a given session id
//GET /sessions/:id/sections
exports.getSessionSections = async (req, res) => {
  try {
    const { id } = req.params;

    const sections = await SessionSection.getAllSectionsBySessionId(id);

    const sectionsWithTags = await Promise.all(
      sections.map(async (section) => {
        const tags = await SectionTag.getBySection(section.section_id);
        return {
          section_id: section.section_id,
          session_segtor: section.session_segtor,
          section_name: section.section_name,
          tags: tags.map(tag => tag.tag_name)
        };
      })
    );

    return res.json({ sections: sectionsWithTags });
  } catch (err) {
    console.error('Error fetching session sections:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

//Updates a sessions observers array using the sessions id and the user id to add
//PUT /sessions/:id/observers
exports.addObserverToSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
    if (user_id === undefined || user_id === null) {
            return res.status(400).json({ error: 'Missing user_id in request body' });
        }
        const session = await Session.getById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        let observers = [];
    if (Array.isArray(session.observers)) {
      observers = session.observers;
    } else if (typeof session.observers === 'string') {
      try {
        const parsedObservers = JSON.parse(session.observers);
        observers = Array.isArray(parsedObservers) ? parsedObservers : [];
      } catch (_parseError) {
        observers = [];
      }
    } else if (session.observers && typeof session.observers === 'object') {
      observers = Array.isArray(session.observers) ? session.observers : [];
        }

    const normalizedUserId = Number(user_id);
    const userIdToStore = Number.isNaN(normalizedUserId) ? user_id : normalizedUserId;

    if (!observers.map(observerId => String(observerId)).includes(String(userIdToStore))) {
      observers.push(userIdToStore);
            const rowsUpdated = await Session.updateBySessionId(id, { observers });
            if (rowsUpdated != 1) {
                return res.status(500).json({ error: 'Failed to update session observers' });
            }
        }

        return res.json({ message: 'Session observers updated successfully' });
    } catch (err) {
        console.error('Error updating session observers:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};