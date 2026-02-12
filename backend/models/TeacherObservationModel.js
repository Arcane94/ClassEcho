//Create Teacher Observation Model

const db = require('../config/dbConfig.js');

const TABLE = 'teacher_observation';

exports.create = async function (info) {
  const row = {
    session_id: info.session_id,
    student_id: info.student_id ?? null,
    start_time: info.start_time ?? null,
    teacher_position: info.teacher_position ?? null,

    // Tag section can be strings (keys) or numeric IDs (store as JSON strings)
    selected_tags:  info.selected_tags  ? JSON.stringify(info.selected_tags)  : null,

    // Single click vs grouped "sstart"
    submitted_by_user: !!info.submitted_by_user,

    //Recording flag
    recording: (info.recording === undefined ? null : info.recording),
    // Notes + optional attachments (e.g., image keys/URLs).
    note: info.note ?? null,
    picture_attachments: info.picture_attachments ? (Buffer.isBuffer(info.picture_attachments) ? info.picture_attachments
          : Buffer.from(String(info.picture_attachments), 'base64')) : null
  };

  const [id] = await db(TABLE).insert(row);
  return id;
};

//Logic to delete multiple teacher observations
exports.deleteMultiple = async (ids) => {
  // Use whereIn to delete all rows at once
  const deletedRows = await db('teacher_observation')
    .whereIn('id', ids)
    .del();

  // returns number of rows deleted
  return deletedRows; 
};

exports.update = async function (id, patch) {
  const upd = {}
  if (patch.start_time !== undefined) {
    upd.start_time = patch.start_time;
  }
  if (patch.selected_tags !== undefined) {
    upd.selected_tags = patch.selected_tags ? JSON.stringify(patch.selected_tags) : null;
  }
  if (patch.teacher_position !== undefined) {
    upd.teacher_position = patch.teacher_position ?? null;
  }
  if (patch.submitted_by_user !== undefined) {
    upd.submitted_by_user = !!patch.submitted_by_user;
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
  if (Object.keys(upd).length === 0) {
    return 0;
  }
  return await db(TABLE).where({id}).update(upd);
}