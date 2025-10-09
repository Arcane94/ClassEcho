//Create Student Observation Model

const db = require('../config/dbConfig.js');
const TABLE = 'student_observation'

exports.create = async function (info) {
  const row = {
    session_id: info.session_id,
    student_id: info.student_id ?? null,
    // Start/end capture the recording window 
    start_time: info.start_time ?? null,
    // Tag arrays can be strings (keys) or numeric IDs; store as JSON strings
    behavior_tags:  info.behavior_tags  ? JSON.stringify(info.behavior_tags)  : null,
    affect:  info.affect  ? JSON.stringify(info.affect)  : null,
    // Single click vs grouped "send"
    submitted_by_user:  !!info.submitted_by_user,
    // Record flag
    recording: (info.recording === undefined ? null : info.recording),    // Notes + optional attachments (e.g., image keys/URLs).
    note: info.note ?? null,
    picture_attachments: info.picture_attachments ? (Buffer.isBuffer(info.picture_attachments) ? info.picture_attachments
          : Buffer.from(String(info.picture_attachments), 'base64')) : null
  };

  const [id] = await db(TABLE).insert(row);
  return id;
};

exports.update = async function (id, patch) {
  const upd = {}
  if (patch.start_time !== undefined) {
    upd.start_time = patch.start_time;
  }
  if (patch.behavior_tags !== undefined) {
    upd.behavior_tags = patch.behavior_tags ? JSON.stringify(patch.behavior_tags) : null;
  }
  if (patch.affect !== undefined) {       
    upd.affect = patch.affect ? JSON.stringify(patch.affect) : null;
  }
  if (patch.submitted_by_user !== undefined) {
    upd.submitted_by_user  = !!patch.submitted_by_user;
  }
  if (patch.recording !== undefined) {
    upd.recording = (patch.recording === null ? null : !!patch.recording);
  }
  if (patch.note !== undefined) {
    upd.note = patch.note ?? null;
  }
  if (patch.picture_attachments !== undefined) {
    upd.picture_attachments = patch.picture_attachments ? (Buffer.isBuffer(patch.picture_attachments) ? patch.picture_attachments
          : Buffer.from(String(patch.picture_attachments), 'base64')) : null;
  }

  if (Object.keys.length === 0) {
    return 0;
  }
  return await db(TABLE).where({id}).update(upd);
}
