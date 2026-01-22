/** 
 * Create Model for Section-Tag information, model should use the section id to connect to the unique section
*/
const db = require('../config/dbConfig.js');

const TABLE = 'section_tag';
    
exports.create = async function(info) {
  const row = {
    section_id: info.section_id,
    tag_name: info.tag_name,
    is_selected: info.is_selected ?? false,
  };

  const [tag_id] = await db(TABLE).insert(row);
  return tag_id;
};

exports.getById = async function (tag_id) {
  const row = await db(TABLE).where({tag_id}).first();
  return row || null;
};
