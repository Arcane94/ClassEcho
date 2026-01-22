/** 
 * Create Model for Session_Section information, model should use the session id to connect to the unique session
*/
const db = require('../config/dbConfig.js');

const TABLE = 'session_section';
    
exports.create = async function(info) {
  const row = {
    session_id: info.session_id,
    session_segtor: info.session_segtor,
    section_name: info.section_name,
  };

  const [section_id] = await db(TABLE).insert(row);
  return section_id;
};

exports.getById = async function (section_id) {
  const row = await db(TABLE).where({section_id}).first();
  return row || null;
};
