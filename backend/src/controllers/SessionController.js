//Handles most of logic in Session routes and talks directly to Session Model

//Retrieve the Session Model
const Session = require(`../models/SessionModel`);
const SessionSection = require(`../models/SessionSectionModel`);
const SectionTag = require(`../models/SectionTagModel`);
const SessionAccess = require('../models/SessionAccessModel');
const StudentObservation = require('../models/StudentObservationModel');
const TeacherObservation = require('../models/TeacherObservationModel');
const User = require('../models/UserModel');
const { observationDb: db } = require('../db/connections');
//Datetime conversion function
const { toMySQLDateTime } = require('../utils/ToSQLDateTime');
const {
  describeSessionAccess,
  normalizeUserId,
  serializeSessionForUser,
} = require('../utils/sessionAccess');

function parseRequesterId(req) {
  return (
    normalizeUserId(req.body?.requester_id)
    ?? normalizeUserId(req.body?.user_id)
    ?? normalizeUserId(req.query?.user_id)
  );
}

async function findUserByIdentifier(identifier) {
  const normalizedIdentifier = String(identifier ?? '').trim();
  if (!normalizedIdentifier) {
    return null;
  }

  let user = await User.getByUsername(normalizedIdentifier);
  if (!user) {
    user = await User.getByEmail(normalizedIdentifier);
  }

  return user;
}

async function getSessionAccessListPayload(session) {
  const [owner, sharedUsers] = await Promise.all([
    User.getByUserId(session.creator),
    SessionAccess.listBySessionId(session.session_id),
  ]);

  return {
    session_id: session.session_id,
    owner: owner
      ? {
        user_id: owner.user_id,
        username: owner.username,
        email: owner.email,
      }
      : {
        user_id: Number(session.creator),
        username: null,
        email: null,
      },
    shared_users: sharedUsers.map((entry) => ({
      session_user_access_id: entry.session_user_access_id,
      user_id: entry.user_id,
      username: entry.username,
      email: entry.email,
      role: entry.role,
      granted_by: entry.granted_by,
      granted_by_username: entry.granted_by_username ?? null,
      granted_at: entry.granted_at,
    })),
  };
}

//Logic to create a new Session entry in database
//POST /sessions
exports.createSession = async (req, res) => {
    //Try to pull payload from web
    try {
        //Save Body fields
        const {
          local_time,
          creator,
          teacher_name,
          session_name,
          lesson_description,
          join_code,
          student_id_numeric_only,
          observers,
          editors,
          sections
        } = req.body;

        //Ensure fields are all filled
        const normalizedCreator = Number(creator);
        const normalizedStudentIdNumericOnly =
          student_id_numeric_only === true
          || student_id_numeric_only === 1
          || student_id_numeric_only === '1';

        if (!Number.isInteger(normalizedCreator) || normalizedCreator <= 0 || !teacher_name || !session_name || !join_code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }



        //Save all fields to send to model
        const info = {
          server_time: new Date(),
          local_time: local_time ? toMySQLDateTime(local_time) : null,
          creator: normalizedCreator,
          teacher_name,
          session_name: session_name,
          lesson_description: lesson_description || null,
          join_code: join_code,
          student_id_numeric_only: normalizedStudentIdNumericOnly,
          observers: observers || null,
          editors: editors || null,
        };

        const result = await db.transaction(async (trx) => {
          const session_id = await Session.create(info, trx);

          const createdSections = [];
          if (Array.isArray(sections)) {
            for (const section of sections) {
              const sessionSector = section.session_sector ?? section.session_segtor;
              const section_id = await SessionSection.create({
                session_id,
                session_sector: sessionSector,
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
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Join code already exists. Generate a new code or enter a different custom code.' });
        }

        if (error && error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'The creator account could not be found. Sign in again and retry.' });
        }

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
      //Return a 404 error if session cannot be found
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const requesterId = normalizeUserId(req.query?.user_id);
      if (requesterId !== null) {
        const access = await describeSessionAccess(session, requesterId);
        if (!access.permissions.can_view_session) {
          return res.status(403).json({ error: 'You do not have access to this session.' });
        }

        return res.json(serializeSessionForUser(session, access));
      }

      return res.json({
        ...session,
        lesson_name: session.session_name,
      });
    } catch (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };

//Logic to update basic session information by id
//PUT /sessions/:id
exports.updateSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      teacher_name,
      session_name,
      lesson_description,
      join_code,
      student_id_numeric_only,
    } = req.body;

    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const requesterId = parseRequesterId(req);
    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing requester_id in request.' });
    }

    const access = await describeSessionAccess(session, requesterId);
    if (!access.permissions.can_edit_session) {
      return res.status(403).json({ error: 'You do not have permission to edit this session.' });
    }

    const updatedInfo = {
      teacher_name,
      session_name,
      lesson_description,
    };

    if (join_code !== undefined) {
      updatedInfo.join_code = join_code;
    }
    if (student_id_numeric_only !== undefined) {
      updatedInfo.student_id_numeric_only =
        student_id_numeric_only === true
        || student_id_numeric_only === 1
        || student_id_numeric_only === '1';
    }

    const rowsUpdated = await Session.updateBySessionId(id, updatedInfo);
    if (rowsUpdated != 1) {
      return res.status(500).json({ error: 'Failed to update session' });
    }

    return res.json({ message: 'Session updated successfully' });
  } catch (err) {
    console.error('Error updating session:', err);
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
    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const requesterId = normalizeUserId(req.query?.user_id);
    if (requesterId !== null) {
      const access = await describeSessionAccess(session, requesterId);
      if (!access.permissions.can_view_session) {
        return res.status(403).json({ error: 'You do not have access to this session.' });
      }
    }

    const sections = await SessionSection.getAllSectionsBySessionId(id);

    const sectionsWithTags = await Promise.all(
      sections.map(async (section) => {
        const tags = await SectionTag.getBySection(section.section_id);
        return {
          section_id: section.section_id,
          session_sector: section.session_sector,
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

//Logic to replace all sections and tags for a given session id
//PUT /sessions/:id/sections
exports.updateSessionSections = async (req, res) => {
  try {
    const { id } = req.params;
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Missing or invalid sections in request body' });
    }

    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const requesterId = parseRequesterId(req);
    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing requester_id in request.' });
    }

    const access = await describeSessionAccess(session, requesterId);
    if (!access.permissions.can_edit_session) {
      return res.status(403).json({ error: 'You do not have permission to edit this session.' });
    }

    const result = await db.transaction(async (trx) => {
      await SessionSection.deleteBySessionId(id, trx);

      const createdSections = [];

      for (const section of sections) {
        const sessionSector = section?.session_sector ?? section?.session_segtor;
        if (!section || !sessionSector || !section.section_name) {
          continue;
        }

        const section_id = await SessionSection.create({
          session_id: id,
          session_sector: sessionSector,
          section_name: section.section_name,
        }, trx);

        const createdTags = [];
        if (Array.isArray(section.tags)) {
          for (const tag of section.tags) {
            const tagName = typeof tag === 'string' ? tag : tag?.tag_name;
            if (!tagName) {
              continue;
            }

            const tag_id = await SectionTag.create({
              section_id,
              tag_name: tagName,
            }, trx);

            createdTags.push({ tag_id, tag_name: tagName });
          }
        }

        createdSections.push({
          section_id,
          session_sector: sessionSector,
          section_name: section.section_name,
          tags: createdTags,
        });
      }

      return { sections: createdSections };
    });

    return res.json({ message: 'Session sections updated successfully', ...result });
  } catch (err) {
    console.error('Error updating session sections:', err);
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

//Logic to delete a session and all related section/tag rows
//DELETE /sessions/:id
exports.deleteSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const requesterId = parseRequesterId(req);
    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing requester_id in request.' });
    }

    const access = await describeSessionAccess(session, requesterId);
    if (!access.permissions.can_delete_session) {
      return res.status(403).json({ error: 'Only the session creator can delete this session.' });
    }

    const deletedRows = await db.transaction(async (trx) => {
      await TeacherObservation.deleteBySessionId(id, trx);
      await StudentObservation.deleteBySessionId(id, trx);
      await SessionAccess.deleteBySessionId(id, trx);
      await trx('session_dates').where({ session_id: id }).del();
      await SessionSection.deleteBySessionId(id, trx);
      await User.removeSessionReferences(id, trx);

      return Session.deleteBySessionId(id, trx);
    });

    if (deletedRows != 1) {
      return res.status(500).json({ error: 'Failed to delete session' });
    }

    return res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting session:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getSessionAccessList = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = normalizeUserId(req.query?.user_id);
    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing user_id in request.' });
    }

    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const access = await describeSessionAccess(session, requesterId);
    if (!access.permissions.can_manage_access) {
      return res.status(403).json({ error: 'Only the session creator can manage sharing.' });
    }

    return res.json(await getSessionAccessListPayload(session));
  } catch (error) {
    console.error('Error fetching session access list:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.grantSessionAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = parseRequesterId(req);
    const role = String(req.body?.role ?? '').trim();
    const identifier = String(req.body?.identifier ?? '').trim();

    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing requester_id in request.' });
    }

    if (!SessionAccess.isValidRole(role)) {
      return res.status(400).json({ error: 'Invalid access role.' });
    }

    if (!identifier) {
      return res.status(400).json({ error: 'Enter a username or email to share this session.' });
    }

    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const requesterAccess = await describeSessionAccess(session, requesterId);
    if (!requesterAccess.permissions.can_manage_access) {
      return res.status(403).json({ error: 'Only the session creator can manage sharing.' });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ error: 'No user was found with that username or email.' });
    }

    const targetUserId = normalizeUserId(user.user_id);
    if (targetUserId === null) {
      return res.status(400).json({ error: 'Invalid shared user.' });
    }

    if (Number(session.creator) === targetUserId) {
      return res.status(400).json({ error: 'The session creator already has full access.' });
    }

    await SessionAccess.upsert({
      session_id: Number(id),
      user_id: targetUserId,
      role,
      granted_by: requesterId,
    });

    return res.json({
      message: 'Session access updated successfully.',
      ...(await getSessionAccessListPayload(session)),
    });
  } catch (error) {
    console.error('Error granting session access:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSessionAccess = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const requesterId = parseRequesterId(req);
    const role = String(req.body?.role ?? '').trim();
    const targetUserId = normalizeUserId(userId);

    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing requester_id in request.' });
    }

    if (targetUserId === null) {
      return res.status(400).json({ error: 'Invalid target user.' });
    }

    if (!SessionAccess.isValidRole(role)) {
      return res.status(400).json({ error: 'Invalid access role.' });
    }

    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const requesterAccess = await describeSessionAccess(session, requesterId);
    if (!requesterAccess.permissions.can_manage_access) {
      return res.status(403).json({ error: 'Only the session creator can manage sharing.' });
    }

    if (Number(session.creator) === targetUserId) {
      return res.status(400).json({ error: 'The session creator access level cannot be changed.' });
    }

    const existingAccess = await SessionAccess.getBySessionIdAndUserId(Number(id), targetUserId);
    if (!existingAccess) {
      return res.status(404).json({ error: 'This user does not currently have shared access.' });
    }

    await SessionAccess.upsert({
      session_id: Number(id),
      user_id: targetUserId,
      role,
      granted_by: requesterId,
    });

    return res.json({
      message: 'Session access updated successfully.',
      ...(await getSessionAccessListPayload(session)),
    });
  } catch (error) {
    console.error('Error updating session access:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.removeSessionAccess = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const requesterId = parseRequesterId(req);
    const targetUserId = normalizeUserId(userId);

    if (requesterId === null) {
      return res.status(400).json({ error: 'Missing requester_id in request.' });
    }

    if (targetUserId === null) {
      return res.status(400).json({ error: 'Invalid target user.' });
    }

    const session = await Session.getById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const requesterAccess = await describeSessionAccess(session, requesterId);
    if (!requesterAccess.permissions.can_manage_access) {
      return res.status(403).json({ error: 'Only the session creator can manage sharing.' });
    }

    if (Number(session.creator) === targetUserId) {
      return res.status(400).json({ error: 'The session creator access cannot be removed.' });
    }

    await SessionAccess.deleteBySessionIdAndUserId(Number(id), targetUserId);

    return res.json({
      message: 'Session access removed successfully.',
      ...(await getSessionAccessListPayload(session)),
    });
  } catch (error) {
    console.error('Error removing session access:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
