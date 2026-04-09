/** 
 * Create Model for Session_Section information, model should use the session id to connect to the unique session
*/
const { observationDb: db } = require('../db/connections');

const TABLE = 'session_section';
    
exports.create = async function(info, trx = null) {
  const dbOrTrx = trx || db;
  const row = {
    session_id: info.session_id,
    session_sector: info.session_sector ?? info.session_segtor,
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

// Returns a list of all session sections in a session for a given sector ('Student', 'Teacher', etc.)
exports.getAllSectionsBySectorAndId = async function (session_sector, session_id) {
  const rows = await db(TABLE).where({session_sector, session_id});
  return rows || [];
}

exports.getAllSectionsBySegtorAndId = exports.getAllSectionsBySectorAndId;

// Deletes all sections for a given session id
exports.deleteBySessionId = async function (session_id, trx = null) {
  const dbOrTrx = trx || db;
  const deletedRows = await dbOrTrx(TABLE)
    .where({ session_id })
    .del();
  return deletedRows;
}
