/** 
 * Create Model for Session information, model should be able to be used as a foreign key in both 
 * Student Observation and Teacher Obseravtion Tables
*/
const db = require('../config/dbConfig.js');

const TABLE = 'session';

exports.create = async function(info, trx = null) {
  const dbOrTrx = trx || db;
  const row = {
    server_time: info.server_time ?? new Date(),
    local_time: info.local_time ?? null,
    creator: info.creator,
    teacher_name: info.teacher_name ?? null,
    session_name: info.session_name ?? null,
    join_code: info.join_code,
    student_id_numeric_only: info.student_id_numeric_only ? 1 : 0,
    // Optional description
    lesson_description: info.lesson_description ?? null,
    //List of user ids of all observers that have accessed this session
    observers: info.observers ? JSON.stringify(info.observers) : null,
    // List of user ids of observers that have edit access to this session
    editors: info.editors ? JSON.stringify(info.editors) : null,
  };

  const [session_id] = await dbOrTrx(TABLE).insert(row);
  return session_id;
};

// Updates a session's information in the database given a session id and an object containing the updated information, returns the number of rows updated
exports.updateBySessionId = async function (session_id, updatedInfo) {
  const row = {};
  if (updatedInfo.teacher_name !== undefined) {
    row.teacher_name = updatedInfo.teacher_name;
  }
  if (updatedInfo.session_name !== undefined) {
    row.session_name = updatedInfo.session_name;
  }
  if (updatedInfo.lesson_description !== undefined) {
    row.lesson_description = updatedInfo.lesson_description;
  }
  if (updatedInfo.join_code !== undefined) {
    row.join_code = updatedInfo.join_code;
  }
  if (updatedInfo.student_id_numeric_only !== undefined) {
    row.student_id_numeric_only = updatedInfo.student_id_numeric_only ? 1 : 0;
  }
  if (updatedInfo.observers !== undefined) {
    row.observers = JSON.stringify(updatedInfo.observers);
  }
  if (updatedInfo.editors !== undefined) {
    row.editors = JSON.stringify(updatedInfo.editors);
  }

  const updatedRows = await db(TABLE)
    .where({ session_id })
    .update(row);
  //Returns the number of rows updated
  return updatedRows;
}

exports.getById = async function (session_id) {
  const row = await db(TABLE).where({session_id}).first();
  return row || null;
};

// Function to get session by join code
exports.getByJoinCode = async function (join_code) {
  const row = await db(TABLE).where({join_code}).first();
  return row || null;
};

// Deletes a session from the database using its session id
exports.deleteBySessionId = async function (session_id) {
  const deletedRows = await db(TABLE)
    .where({ session_id })
    .del();
  return deletedRows;
};
