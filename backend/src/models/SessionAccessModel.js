// Session access model that stores viewer, visualization editor, and full editor grants.
const { observationDb: db } = require('../db/connections');

const TABLE = 'session_user_access';
const VALID_ROLES = ['viewer', 'viz_editor', 'full_editor'];

exports.VALID_ROLES = VALID_ROLES;

exports.isValidRole = function isValidRole(role) {
  return VALID_ROLES.includes(String(role ?? '').trim());
};

exports.getBySessionIdAndUserId = async function getBySessionIdAndUserId(session_id, user_id) {
  const row = await db(TABLE)
    .where({ session_id, user_id })
    .first();

  return row || null;
};

exports.listByUserId = async function listByUserId(user_id) {
  return db(TABLE)
    .where({ user_id })
    .orderBy('granted_at', 'asc');
};

exports.listBySessionId = async function listBySessionId(session_id) {
  return db(`${TABLE} as access`)
    .leftJoin('observer_user as user', 'access.user_id', 'user.user_id')
    .leftJoin('observer_user as grantor', 'access.granted_by', 'grantor.user_id')
    .where('access.session_id', session_id)
    .select(
      'access.session_user_access_id',
      'access.session_id',
      'access.user_id',
      'access.role',
      'access.granted_by',
      'access.granted_at',
      'user.username',
      'user.email',
      'grantor.username as granted_by_username',
    )
    .orderBy('user.username', 'asc')
    .orderBy('user.email', 'asc');
};

exports.upsert = async function upsert(info, trx = null) {
  const dbOrTrx = trx || db;
  const row = {
    session_id: info.session_id,
    user_id: info.user_id,
    role: info.role,
    granted_by: info.granted_by ?? null,
  };

  await dbOrTrx(TABLE)
    .insert(row)
    .onConflict(['session_id', 'user_id'])
    .merge({
      role: row.role,
      granted_by: row.granted_by,
    });

  return dbOrTrx(TABLE)
    .where({
      session_id: row.session_id,
      user_id: row.user_id,
    })
    .first();
};

exports.deleteBySessionIdAndUserId = async function deleteBySessionIdAndUserId(session_id, user_id, trx = null) {
  const dbOrTrx = trx || db;
  return dbOrTrx(TABLE)
    .where({ session_id, user_id })
    .del();
};

exports.deleteBySessionId = async function deleteBySessionId(session_id, trx = null) {
  const dbOrTrx = trx || db;
  return dbOrTrx(TABLE)
    .where({ session_id })
    .del();
};
