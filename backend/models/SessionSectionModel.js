/** 
 * Create Model for Session_Section information, model should use the session id to connect to the unique session
*/
const db = require('../config/dbConfig.js');

const TABLE = 'session_section';
    
exports.create = async function(info, trx = null) {
  const dbOrTrx = trx || db;
  const row = {
    session_id: info.session_id,
    session_segtor: info.session_segtor,
    section_name: info.section_name,
  };

  const [section_id] = await dbOrTrx(TABLE).insert(row);
  return section_id;
};

exports.getById = async function (section_id) {
  const row = await db(TABLE).where({section_id}).first();
  return row || null;
};

// Returns a list of all session sections for a given session id (May be used mostly in tag editing)
exports.getAllSectionsBySessionId = async function (session_id) {
  const rows = await db(TABLE).where({session_id});
  return rows || [];
}

// Returns a list of all session sections in a sessionfor a given segtor ('Student', 'Teacher', etc.)
exports.getAllSectionsBySegtorAndId = async function (session_segtor, session_id) {
  const rows = await db(TABLE).where({session_segtor, session_id});
  return rows || [];
}