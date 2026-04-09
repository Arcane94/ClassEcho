//Create Student Observation Model

const { observationDb: db } = require('../db/connections');
const TABLE = 'student_observation'
const DUPLICATE_TIME_TOLERANCE_MS = 1000;

function buildRow(info) {
  return {
    session_id: info.session_id,
    observer_id: info.observer_id,
    student_id: info.student_id ?? null,
    start_time: info.start_time ?? null,
    end_time: info.end_time ?? null,
    selected_tags: info.selected_tags ? JSON.stringify(info.selected_tags) : null,
    affect: info.affect ? JSON.stringify(info.affect) : null,
    recording: info.recording === 1 ? 1 : 0,
    note: info.note ?? null,
    on_task: info.on_task ?? null,
  };
}

function stableSerialize(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return stableSerialize(JSON.parse(value));
    } catch (error) {
      return JSON.stringify(value);
    }
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => JSON.parse(stableSerialize(item) ?? 'null')));
  }

  if (typeof value === 'object') {
    const sortedObject = Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = JSON.parse(stableSerialize(value[key]) ?? 'null');
        return accumulator;
      }, {});

    return JSON.stringify(sortedObject);
  }

  return JSON.stringify(value);
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function matchesWithinTolerance(left, right) {
  const leftDate = normalizeDate(left);
  const rightDate = normalizeDate(right);

  if (!leftDate || !rightDate) {
    return leftDate === rightDate;
  }

  return Math.abs(leftDate.getTime() - rightDate.getTime()) <= DUPLICATE_TIME_TOLERANCE_MS;
}

function observationsMatch(candidate, row) {
  return (
    candidate.session_id === row.session_id &&
    candidate.observer_id === row.observer_id &&
    (candidate.student_id ?? null) === row.student_id &&
    (candidate.note ?? null) === row.note &&
    Number(candidate.recording) === row.recording &&
    (candidate.on_task ?? null) === row.on_task &&
    matchesWithinTolerance(candidate.start_time, row.start_time) &&
    matchesWithinTolerance(candidate.end_time, row.end_time) &&
    stableSerialize(candidate.selected_tags) === stableSerialize(row.selected_tags) &&
    stableSerialize(candidate.affect) === stableSerialize(row.affect)
  );
}

exports.create = async function (info) {
  const row = buildRow(info);
  const [id] = await db(TABLE).insert(row);
  return id;
};

//Logic to delete multiple student observation
exports.deleteMultiple = async (ids) => {
  // Use whereIn to delete all rows at once
  const deletedRows = await db('student_observation')
    .whereIn('id', ids)
    .del();

  // returns number of rows deleted
  return deletedRows; 
};

exports.deleteBySessionId = async function deleteBySessionId(session_id, trx = null) {
  const dbOrTrx = trx || db;
  return dbOrTrx(TABLE)
    .where({ session_id })
    .del();
};

exports.countBySessionId = async function countBySessionId(session_id) {
  const result = await db(TABLE)
    .where({ session_id })
    .count({ count: "*" })
    .first();

  return Number(result?.count ?? 0);
};

exports.update = async function (id, patch) {
  const upd = {};
  if (patch.session_id !== undefined) {
    upd.session_id = patch.session_id;
  }
  if (patch.observer_id !== undefined) {
    upd.observer_id = patch.observer_id;
  }
  if (patch.student_id !== undefined) {
    upd.student_id = patch.student_id ?? null;
  }
  if (patch.start_time !== undefined) {
    upd.start_time = patch.start_time;
  }
  if (patch.end_time !== undefined) {
    upd.end_time = patch.end_time;
  }
  if (patch.selected_tags !== undefined) {
    upd.selected_tags = patch.selected_tags ? JSON.stringify(patch.selected_tags) : null;
  }
  if (patch.affect !== undefined) {
    upd.affect = patch.affect ? JSON.stringify(patch.affect) : null;
  }
  if (patch.recording !== undefined) {
    upd.recording = patch.recording === 1 ? 1 : 0;
  }
  if (patch.note !== undefined) {
    upd.note = patch.note ?? null;
  }
  if (patch.on_task !== undefined) {
    upd.on_task = patch.on_task ?? null;
  }

  if (Object.keys(upd).length === 0) {
    return 0;
  }
  return await db(TABLE).where({ id }).update(upd);
};

exports.findMatchingObservation = async function (info) {
  const row = buildRow(info);
  const startTime = normalizeDate(row.start_time);
  const endTime = normalizeDate(row.end_time);
  const query = db(TABLE)
    .where({
      session_id: row.session_id,
      observer_id: row.observer_id,
      recording: row.recording,
    })
    .orderBy('id', 'desc')
    .limit(25);

  if (startTime) {
    query.whereBetween('start_time', [
      new Date(startTime.getTime() - DUPLICATE_TIME_TOLERANCE_MS),
      new Date(startTime.getTime() + DUPLICATE_TIME_TOLERANCE_MS),
    ]);
  }

  if (endTime) {
    query.whereBetween('end_time', [
      new Date(endTime.getTime() - DUPLICATE_TIME_TOLERANCE_MS),
      new Date(endTime.getTime() + DUPLICATE_TIME_TOLERANCE_MS),
    ]);
  }

  const candidates = await query;
  return candidates.find((candidate) => observationsMatch(candidate, row)) || null;
};

//Retrieves all observations for a given session id
exports.getBySessionId = async function (session_id) {
  const rows = await db(TABLE)
    .leftJoin('observer_user', `${TABLE}.observer_id`, 'observer_user.user_id')
    .select(
      `${TABLE}.*`,
      'observer_user.username as observer_name',
    )
    .where(`${TABLE}.session_id`, session_id);
  return rows || [];
};

//Retrieves a single observation by its id
exports.getById = async function (id) {
  const row = await db(TABLE)
    .leftJoin('observer_user', `${TABLE}.observer_id`, 'observer_user.user_id')
    .select(
      `${TABLE}.*`,
      'observer_user.username as observer_name',
    )
    .where(`${TABLE}.id`, id)
    .first();
  return row || null;
};
