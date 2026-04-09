/** 
 * Create Model for Section-Tag information, model should use the section id to connect to the unique section
*/
const { observationDb: db } = require('../db/connections');

const TABLE = 'section_tag';
    
exports.create = async function(info, trx = null) {
  const dbOrTrx = trx || db;
  const row = {
    section_id: info.section_id,
    tag_name: info.tag_name,
  };

  const [tag_id] = await dbOrTrx(TABLE).insert(row);
  return tag_id;
};

exports.getById = async function (tag_id) {
  const row = await db(TABLE).where({tag_id}).first();
  return row || null;
};

// Returns a list of all section tags for a given section
exports.getBySection = async function (section_id) {
  const rows = await db(TABLE).where({section_id});
  return rows || [];
};
