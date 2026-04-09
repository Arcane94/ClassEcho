/**
 * Model to create and manage User information in the database
 */
const { observationDb: db } = require('../db/connections');

const TABLE = 'observer_user';

// Creates a new user given a user id and a hashed password then returns the new user's id
exports.create = async function(info) {
  const row = {
    hashed_password: info.hashed_password,
    username: info.username ?? null,
    email: info.email ?? null,
    sessions: info.sessions ? JSON.stringify(info.sessions) : null,
    edit_sessions: info.edit_sessions ? JSON.stringify(info.edit_sessions) : null,
  };    
    const [id] = await db(TABLE).insert(row);
    return id;
};

//Updates a user's information in the database given a user id and an object containing the updated information, returns the number of rows updated
exports.updateByUserId = async function (user_id, updatedInfo) {
  const row = {};
  if (updatedInfo.hashed_password !== undefined) {
    row.hashed_password = updatedInfo.hashed_password;
  }
  if (updatedInfo.username !== undefined) {
    row.username = updatedInfo.username;
  }
  if (updatedInfo.sessions !== undefined) {
    row.sessions = JSON.stringify(updatedInfo.sessions);
  }
  if (updatedInfo.edit_sessions !== undefined) {
    row.edit_sessions = JSON.stringify(updatedInfo.edit_sessions);
  }

  const updatedRows = await db(TABLE)
    .where({ user_id })
    .update(row);
  //Returns the number of rows updated
  return updatedRows;
};

// Retrieves a user by their user id
exports.getByUserId = async function (user_id) {
  const row = await db(TABLE).where({user_id}).first();
  if (row) {
    row.sessions = row.sessions || "[]";
    row.edit_sessions = row.edit_sessions || "[]";
  }
  return row || null;
};

// Deletes a user's account from the database using their user id
exports.deleteByUserId = async function (user_id) {
  const deletedRows = await db(TABLE)
    .where({ user_id })
    .del();
    return deletedRows; // returns number of rows deleted
};

// Retrieves user information using username
exports.getByUsername = async function (username) {
  const row = await db(TABLE)
    .where({ username })
    .first();
  if (row) {
    row.sessions = row.sessions ?? "[]";
    row.edit_sessions = row.edit_sessions ?? "[]";
  }
  return row || null;
};

// Retrieves user information using email
exports.getByEmail = async function (email) {
  const row = await db(TABLE)
    .where({ email })
    .first();
  if (row) {
    row.sessions = row.sessions ?? "[]";
    row.edit_sessions = row.edit_sessions ?? "[]";
  }
  return row || null;
};

function parseSessionIdList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsedValue = JSON.parse(value);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (_error) {
      return [];
    }
  }

  return [];
}

exports.removeSessionReferences = async function removeSessionReferences(session_id, trx = null) {
  const dbOrTrx = trx || db;
  const numericSessionId = Number(session_id);

  const users = await dbOrTrx(TABLE)
    .select('user_id', 'sessions', 'edit_sessions');

  for (const user of users) {
    const currentSessions = parseSessionIdList(user.sessions);
    const currentEditSessions = parseSessionIdList(user.edit_sessions);

    const nextSessions = currentSessions
      .filter((value) => Number(value) !== numericSessionId);
    const nextEditSessions = currentEditSessions
      .filter((value) => Number(value) !== numericSessionId);

    const sessionsChanged = nextSessions.length !== currentSessions.length;
    const editSessionsChanged = nextEditSessions.length !== currentEditSessions.length;

    if (!sessionsChanged && !editSessionsChanged) {
      continue;
    }

    await dbOrTrx(TABLE)
      .where({ user_id: user.user_id })
      .update({
        sessions: JSON.stringify(nextSessions),
        edit_sessions: JSON.stringify(nextEditSessions),
      });
  }
};
