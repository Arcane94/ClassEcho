// Visualization setup model that stores replay windows and per-window seating charts.
const { observationDb: db } = require('../db/connections');
const { EASTERN_TIME_ZONE } = require('../utils/ToSQLDateTime');

const SESSION_DATES_TABLE = 'session_dates';
const SESSION_PERIODS_TABLE = 'session_periods';
const PERIOD_SEATS_TABLE = 'period_seats';
const PERIOD_SEAT_ASSIGNMENTS_TABLE = 'period_seat_assignments';

function formatDateOnly(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
}

function formatTimeOnly(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, 8);
  }

  return String(value).slice(0, 8);
}

async function getSetupBySessionIdWithDb(dbOrTrx, sessionId) {
  const periodRows = await dbOrTrx(`${SESSION_DATES_TABLE} as session_dates`)
    .leftJoin(
      `${SESSION_PERIODS_TABLE} as session_periods`,
      'session_dates.session_date_id',
      'session_periods.session_date_id',
    )
    .where('session_dates.session_id', sessionId)
    .select(
      'session_dates.session_date_id',
      'session_dates.observation_date',
      'session_periods.session_period_id',
      'session_periods.period_label',
      'session_periods.student_id_prefix',
      'session_periods.time_zone',
      'session_periods.start_time',
      'session_periods.end_time',
    )
    .orderBy('session_dates.observation_date', 'asc')
    .orderBy('session_periods.start_time', 'asc')
    .orderBy('session_periods.period_label', 'asc');

  const periodIds = periodRows
    .map((row) => row.session_period_id)
    .filter((value) => value !== null && value !== undefined);

  const seatRows = periodIds.length === 0
    ? []
    : await dbOrTrx(`${PERIOD_SEATS_TABLE} as period_seats`)
      .leftJoin(
        `${PERIOD_SEAT_ASSIGNMENTS_TABLE} as period_seat_assignments`,
        'period_seats.period_seat_id',
        'period_seat_assignments.period_seat_id',
      )
      .whereIn('period_seats.session_period_id', periodIds)
      .select(
        'period_seats.period_seat_id',
        'period_seats.session_period_id',
        'period_seats.seat_label',
        'period_seats.x',
        'period_seats.y',
        'period_seats.seat_type',
        'period_seat_assignments.assignment_id',
        'period_seat_assignments.student_identifier',
      )
      .orderBy('period_seats.y', 'asc')
      .orderBy('period_seats.x', 'asc')
      .orderBy('period_seats.period_seat_id', 'asc');

  const seatsByPeriodId = seatRows.reduce((accumulator, row) => {
    const key = String(row.session_period_id);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push({
      period_seat_id: row.period_seat_id,
      assignment_id: row.assignment_id ?? null,
      seat_label: row.seat_label ? String(row.seat_label) : '',
      x: Number(row.x),
      y: Number(row.y),
      seat_type: String(row.seat_type || 'student'),
      student_identifier: row.student_identifier ? String(row.student_identifier) : '',
    });

    return accumulator;
  }, {});

  return periodRows
    .filter((row) => row.session_period_id !== null && row.session_period_id !== undefined)
    .map((row) => ({
      session_date_id: row.session_date_id,
      session_period_id: row.session_period_id,
      date: formatDateOnly(row.observation_date),
      period: String(row.period_label || ''),
      student_id_prefix: row.student_id_prefix ? String(row.student_id_prefix).trim() : '',
      timezone: row.time_zone ? String(row.time_zone) : EASTERN_TIME_ZONE,
      start_time: formatTimeOnly(row.start_time),
      end_time: formatTimeOnly(row.end_time),
      seats: seatsByPeriodId[String(row.session_period_id)] || [],
    }));
}

exports.getSetupBySessionId = async function getSetupBySessionId(sessionId) {
  return getSetupBySessionIdWithDb(db, sessionId);
};

exports.replaceSetup = async function replaceSetup(sessionId, replayWindows) {
  return db.transaction(async (trx) => {
    await trx(SESSION_DATES_TABLE)
      .where({ session_id: sessionId })
      .del();

    if (!Array.isArray(replayWindows) || replayWindows.length === 0) {
      return [];
    }

    const sessionDateIdByDate = new Map();

    for (const replayWindow of replayWindows) {
      const observationDate = String(replayWindow.date || '').trim();
      const periodLabel = String(replayWindow.period || '').trim();
      const studentIdPrefix = String(replayWindow.student_id_prefix || '').trim();
      const timeZone = String(replayWindow.timezone || '').trim() || EASTERN_TIME_ZONE;
      const startTime = String(replayWindow.start_time || '').trim();
      const endTime = String(replayWindow.end_time || '').trim();

      let sessionDateId = sessionDateIdByDate.get(observationDate);
      if (!sessionDateId) {
        const insertedDateIds = await trx(SESSION_DATES_TABLE).insert({
          session_id: sessionId,
          observation_date: observationDate,
        });
        sessionDateId = insertedDateIds[0];
        sessionDateIdByDate.set(observationDate, sessionDateId);
      }

      const insertedPeriodIds = await trx(SESSION_PERIODS_TABLE).insert({
        session_date_id: sessionDateId,
        period_label: periodLabel,
        student_id_prefix: studentIdPrefix || null,
        time_zone: timeZone,
        start_time: startTime,
        end_time: endTime,
      });
      const sessionPeriodId = insertedPeriodIds[0];

      for (const seat of replayWindow.seats || []) {
        const insertedSeatIds = await trx(PERIOD_SEATS_TABLE).insert({
          session_period_id: sessionPeriodId,
          seat_label: seat.seat_label ?? null,
          x: seat.x,
          y: seat.y,
          seat_type: seat.seat_type,
        });
        const periodSeatId = insertedSeatIds[0];

        if (seat.seat_type === 'student' && seat.student_identifier) {
          await trx(PERIOD_SEAT_ASSIGNMENTS_TABLE).insert({
            session_period_id: sessionPeriodId,
            period_seat_id: periodSeatId,
            student_identifier: seat.student_identifier ?? null,
          });
        }
      }
    }

    return getSetupBySessionIdWithDb(trx, sessionId);
  });
};
