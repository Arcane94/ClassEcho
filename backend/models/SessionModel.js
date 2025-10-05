/** 
 * Create Model for Session information, model should be able to be used as a foreign key in both 
 * Student Observation and Teacher Obseravtion Tables
*/
const db = require('../config/dbConfig.js');

const TABLE = 'session';

exports.create = async function(info) {
  const row = {
    server_time: info.server_time ?? new Date(),
    local_time: info.local_time ?? null,

    observer_name: info.observer_name ?? null,
    teacher_name: info.teacher_name ?? null,
    lesson_name: info.lesson_name ?? null,
    // Optional description
    lesson_description: info.lesson_description ?? null,
    // Any additional information passed in (Optional inclusion)
    // meta: info.meta ? JSON.stringify(info.meta) : null
  };

  const [session_id] = await db(TABLE).insert(row);
  return session_id;
};

exports.getById = async function (session_id) {
  const row = await db(TABLE).where({session_id}).first();
  return row || null;
};

// If needed, getting a list of all rows may be implemented
// exports.getAll = async function () {

// }