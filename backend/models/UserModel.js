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
  };    
    const [id] = await db(TABLE).insert(row);
    return id;
};

// Retrieves a user by their user id
exports.getByUserId = async function (user_id) {
  const row = await db(TABLE).where({user_id}).first();
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
  return row || null;
};