/**
 * Model to create and manage User information in the database
 */
const db = require('../config/dbConfig.js');

const TABLE = 'observer_user';

// Creates a new user given a user id and a hashed password then returns the new user's id
exports.create = async function(info) {
  const row = {
    hashed_password: info.hashed_password,
    username: info.username ?? null,
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
    row.sessions = JSON.parse(row.sessions || "[]");
    row.edit_sessions = JSON.parse(row.edit_sessions || "[]");
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
    row.sessions = JSON.parse(row.sessions || "[]");
    row.edit_sessions = JSON.parse(row.edit_sessions || "[]");
  }
  return row || null;
};