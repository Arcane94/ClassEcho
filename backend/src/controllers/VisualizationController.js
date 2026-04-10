// Handles visualization playback requests, code snapshots, emoji data, and setup reads/writes.
const Visualization = require('../models/VisualizationModel');
const VisualizationSetup = require('../models/VisualizationSetupModel');
const Session = require('../models/SessionModel');
const { EASTERN_TIME_ZONE, toEasternMySQLDateTime } = require('../utils/ToSQLDateTime');
const { describeSessionAccess, normalizeUserId } = require('../utils/sessionAccess');

function parseStudents(raw) {
  return String(raw ?? '')
    .trim()
    .split(/[,\s]+/)
    .map((value) => value.replace(/\D+/g, ''))
    .filter(Boolean)
    .map((value) => String(Number(value)))
    .filter((value, index, values) => values.indexOf(value) === index);
}

function parsePrefix(raw) {
  return String(raw ?? '').trim();
}

function isMysqlDateTime(value) {
  return /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(String(value ?? '').trim());
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toMysqlDatetime(value) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  if (isMysqlDateTime(raw)) {
    return raw;
  }

  return toEasternMySQLDateTime(raw);
}

function formatDbDateTime(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toMysqlDatetime(value);
  }

  return String(value);
}

function formatEmojiRow(row, beforeWindow) {
  return {
    id: row?.id ?? null,
    userID: row?.user_id != null ? String(row.user_id) : null,
    sectionID: row?.section_id != null ? String(row.section_id) : null,
    assignmentID: row?.assignment_id != null ? String(row.assignment_id) : null,
    emojiKey: row?.emoji_key ? String(row.emoji_key).trim() : '',
    createdAt: formatDbDateTime(row?.created_at),
    beforeWindow,
  };
}

function buildStudentMap(studentIds, prefix, users) {
  const userMapByUsername = new Map(
    users.map((user) => [String(user.username), String(user.id)]),
  );

  return studentIds.map((studentNumber) => {
    const username = `${prefix}${studentNumber}`;
    const userId = userMapByUsername.get(username) ?? null;

    return {
      studentNumber,
      username,
      userID: userId,
      foundUser: userId !== null,
    };
  });
}

function parseRowId(rawValue) {
  const rowId = Number.parseInt(String(rawValue ?? '').trim(), 10);
  return Number.isInteger(rowId) && rowId > 0 ? rowId : null;
}

function parseSpriteName(rawValue) {
  const raw = String(rawValue ?? '').trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string' && parsed.trim()) {
      return parsed.trim();
    }
    if (Array.isArray(parsed)) {
      const firstString = parsed.find((value) => typeof value === 'string' && value.trim());
      if (firstString) {
        return firstString.trim();
      }
    }
  } catch {
    // Fall back to plain text cleanup below.
  }

  const normalized = raw.replace(/^"+|"+$/g, '').trim();
  return normalized || null;
}

function parseSessionId(rawValue) {
  const sessionId = Number.parseInt(String(rawValue ?? '').trim(), 10);
  return Number.isInteger(sessionId) && sessionId > 0 ? sessionId : null;
}

async function requireVisualizationAccess(sessionId, rawUserId, permissionKey) {
  const userId = normalizeUserId(rawUserId);
  if (userId === null) {
    return { error: { status: 400, payload: { error: 'Missing user_id in request.' } } };
  }

  const session = await Session.getById(sessionId);
  if (!session) {
    return { error: { status: 404, payload: { error: 'Session not found' } } };
  }

  const access = await describeSessionAccess(session, userId);
  if (!access.permissions?.[permissionKey]) {
    return { error: { status: 403, payload: { error: 'You do not have access to this visualization session.' } } };
  }

  return { session, access };
}

function isValidDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? '').trim());
}

function normalizeTimeOnly(rawValue) {
  const raw = String(rawValue ?? '').trim();
  const match = raw.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? '00');
  if (hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  return `${match[1]}:${match[2]}:${String(second).padStart(2, '0')}`;
}

function normalizeTimeZone(rawValue) {
  const raw = String(rawValue ?? '').trim();
  if (!raw) {
    return EASTERN_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: raw }).format(new Date());
    return raw;
  } catch {
    return null;
  }
}

function normalizeSeatType(rawValue) {
  const value = String(rawValue ?? '').trim().toLowerCase();
  if (value === 'teacher') {
    return 'teacher';
  }
  if (value === 'blocked') {
    return 'blocked';
  }
  return 'student';
}

function normalizeSeatLabel(rawValue, seatType, x, y) {
  const explicitValue = String(rawValue ?? '').trim();
  if (seatType === 'teacher') {
    return 'teacher';
  }
  if (seatType === 'blocked') {
    return explicitValue || null;
  }
  return explicitValue || `r${y + 1}c${x + 1}`;
}

function normalizeSetupPayload(rawValue) {
  if (!Array.isArray(rawValue)) {
    return { replayWindows: null, error: 'Replay windows must be an array.' };
  }

  const normalizedReplayWindows = [];
  const seenKeys = new Set();

  for (const replayWindow of rawValue) {
    const date = String(replayWindow?.date ?? '').trim();
    const period = String(replayWindow?.period ?? '').trim();
    const timeZone = normalizeTimeZone(replayWindow?.timezone ?? replayWindow?.time_zone);
    const startTime = normalizeTimeOnly(replayWindow?.start_time);
    const endTime = normalizeTimeOnly(replayWindow?.end_time);
    const studentIdPrefix = String(replayWindow?.student_id_prefix ?? '').trim();

    if (!date && !period && !replayWindow?.start_time && !replayWindow?.end_time) {
      continue;
    }

    if (!date || !period || !timeZone || !startTime || !endTime) {
      return { replayWindows: null, error: 'Each replay window must include a date, period, time zone, start time, and end time.' };
    }

    if (!isValidDateOnly(date)) {
      return { replayWindows: null, error: 'Replay windows must use YYYY-MM-DD dates.' };
    }

    if (endTime <= startTime) {
      return { replayWindows: null, error: 'Each replay window must end after it starts.' };
    }

    const dedupeKey = `${date}::${period.toLowerCase()}`;
    if (seenKeys.has(dedupeKey)) {
      return { replayWindows: null, error: 'Each date and period can only appear once.' };
    }
    seenKeys.add(dedupeKey);

    const coordKeys = new Set();
    const studentIdentifiers = new Set();
    let teacherSeatCount = 0;
    let hasDuplicateCoordinates = false;
    let hasDuplicateStudentIdentifier = false;

    const normalizedSeats = Array.isArray(replayWindow?.seats)
      ? replayWindow.seats.reduce((accumulator, seat) => {
        const x = Number.parseInt(String(seat?.x ?? ''), 10);
        const y = Number.parseInt(String(seat?.y ?? ''), 10);
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
          return accumulator;
        }

        const seatType = normalizeSeatType(seat?.seat_type);
        const coordKey = `${x}:${y}`;
        if (coordKeys.has(coordKey)) {
          hasDuplicateCoordinates = true;
          return accumulator;
        }
        coordKeys.add(coordKey);

        const studentIdentifier = seatType === 'student'
          ? String(seat?.student_identifier ?? '').trim()
          : '';
        if (seatType === 'teacher') {
          teacherSeatCount += 1;
        }
        if (studentIdentifier) {
          if (studentIdentifiers.has(studentIdentifier.toLowerCase())) {
            hasDuplicateStudentIdentifier = true;
            return accumulator;
          }
          studentIdentifiers.add(studentIdentifier.toLowerCase());
        }

        accumulator.push({
          x,
          y,
          seat_type: seatType,
          seat_label: normalizeSeatLabel(seat?.seat_label, seatType, x, y),
          student_identifier: studentIdentifier || null,
        });

        return accumulator;
      }, [])
      : [];

    if (hasDuplicateCoordinates) {
      return { replayWindows: null, error: 'A replay window cannot reuse the same grid cell twice.' };
    }

    if (hasDuplicateStudentIdentifier) {
      return { replayWindows: null, error: 'A replay window cannot assign the same student to multiple seats.' };
    }

    if (teacherSeatCount > 1) {
      return { replayWindows: null, error: 'Each replay window can only have one teacher desk.' };
    }

    normalizedReplayWindows.push({
      date,
      period,
      student_id_prefix: studentIdPrefix,
      timezone: timeZone,
      start_time: startTime,
      end_time: endTime,
      seats: normalizedSeats,
    });
  }

  return { replayWindows: normalizedReplayWindows, error: null };
}

exports.getSessionSetup = async (req, res) => {
  try {
    const sessionId = parseSessionId(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const accessResult = await requireVisualizationAccess(sessionId, req.query?.user_id, 'can_view_session');
    if (accessResult.error) {
      return res.status(accessResult.error.status).json(accessResult.error.payload);
    }

    const replayWindows = await VisualizationSetup.getSetupBySessionId(sessionId);
    return res.json({
      session_id: sessionId,
      replay_windows: replayWindows,
    });
  } catch (error) {
    console.error('Error fetching visualization setup:', error);
    return res.status(500).json({ error: 'Failed to fetch visualization setup' });
  }
};

exports.updateSessionSetup = async (req, res) => {
  try {
    const sessionId = parseSessionId(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const accessResult = await requireVisualizationAccess(sessionId, req.body?.user_id ?? req.body?.requester_id, 'can_edit_visualization');
    if (accessResult.error) {
      return res.status(accessResult.error.status).json(accessResult.error.payload);
    }

    const { replayWindows, error } = normalizeSetupPayload(req.body?.replay_windows);
    if (error) {
      return res.status(400).json({ error });
    }

    const savedReplayWindows = await VisualizationSetup.replaceSetup(sessionId, replayWindows);
    return res.json({
      message: 'Visualization setup updated successfully',
      session_id: sessionId,
      replay_windows: savedReplayWindows,
    });
  } catch (error) {
    console.error('Error updating visualization setup:', error);
    return res.status(500).json({ error: 'Failed to update visualization setup' });
  }
};

exports.getCodeUrls = async (req, res) => {
  try {
    const sessionId = parseSessionId(req.query.session_id);
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'Invalid session id' });
    }

    const accessResult = await requireVisualizationAccess(sessionId, req.query.user_id, 'can_view_session');
    if (accessResult.error) {
      return res.status(accessResult.error.status).json({ ok: false, ...accessResult.error.payload });
    }

    const students = parseStudents(req.query.students);
    const prefix = parsePrefix(req.query.prefix);
    const start = toMysqlDatetime(req.query.start);
    const end = toMysqlDatetime(req.query.end);

    if (students.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid students parsed' });
    }

    if (!start) {
      return res.status(400).json({ ok: false, error: 'Invalid start datetime' });
    }

    if (!end) {
      return res.status(400).json({ ok: false, error: 'Invalid end datetime' });
    }

    const usernames = students.map((studentNumber) => `${prefix}${studentNumber}`);
    const users = await Visualization.getUsersByUsernames(usernames);
    const resolvedStudents = buildStudentMap(students, prefix, users);

    const studentPayload = await Promise.all(
      resolvedStudents.map(async (student) => {
        if (!student.userID) {
          return {
            ...student,
            entries: [],
          };
        }

        const rows = await Visualization.getTraceEntriesByUserIdWithinWindow(student.userID, start, end);
        return {
          ...student,
          entries: rows.map((row) => ({
            rowId: row.id,
            serverTime: formatDbDateTime(row.serverTime),
            projectID: String(row.projectID),
            assignmentID: String(row.assignmentID),
            userID: String(row.userID),
          })),
        };
      }),
    );

    return res.json({
      ok: true,
      window: { start, end },
      prefix,
      students: studentPayload,
    });
  } catch (error) {
    console.error('Error fetching visualization code URLs:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch code snapshots' });
  }
};

exports.getCodeSnapshot = async (req, res) => {
  try {
    const sessionId = parseSessionId(req.query.session_id);
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'Invalid session id' });
    }

    const accessResult = await requireVisualizationAccess(sessionId, req.query.user_id, 'can_view_session');
    if (accessResult.error) {
      return res.status(accessResult.error.status).json({ ok: false, ...accessResult.error.payload });
    }

    const rowId = parseRowId(req.query.rowId ?? req.query.row_id ?? req.params.rowId);
    if (!rowId) {
      return res.status(400).json({ ok: false, error: 'Invalid row id' });
    }

    const targetRow = await Visualization.getTraceEntryById(rowId);
    if (!targetRow?.projectID || !targetRow?.serverTime) {
      return res.status(404).json({ ok: false, error: 'Trace row not found' });
    }

    const [snapshotRow, spriteRow] = await Promise.all([
      Visualization.getLatestCodeSnapshotForTarget(targetRow.projectID, targetRow.serverTime, targetRow.id),
      Visualization.getLatestSelectedSpriteForTarget(targetRow.projectID, targetRow.serverTime, targetRow.id),
    ]);

    if (!snapshotRow?.code) {
      return res.json({
        ok: true,
        rowId,
        snapshot: null,
      });
    }

    return res.json({
      ok: true,
      rowId,
      snapshot: {
        rowId: snapshotRow.id,
        serverTime: formatDbDateTime(snapshotRow.serverTime),
        projectID: String(snapshotRow.projectID),
        assignmentID: String(snapshotRow.assignmentID),
        userID: String(snapshotRow.userID),
        code: String(snapshotRow.code),
        spriteName: parseSpriteName(spriteRow?.data),
      },
    });
  } catch (error) {
    console.error('Error fetching visualization code snapshot:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch code snapshot' });
  }
};

exports.getEmojiReactions = async (req, res) => {
  try {
    const sessionId = parseSessionId(req.query.session_id);
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'Invalid session id' });
    }

    const accessResult = await requireVisualizationAccess(sessionId, req.query.user_id, 'can_view_session');
    if (accessResult.error) {
      return res.status(accessResult.error.status).json({ ok: false, ...accessResult.error.payload });
    }

    const students = parseStudents(req.query.students);
    const prefix = parsePrefix(req.query.prefix);
    const start = toMysqlDatetime(req.query.start);
    const end = toMysqlDatetime(req.query.end);

    if (students.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid students parsed' });
    }

    if (!start) {
      return res.status(400).json({ ok: false, error: 'Invalid start datetime' });
    }

    if (!end) {
      return res.status(400).json({ ok: false, error: 'Invalid end datetime' });
    }

    const usernames = students.map((studentNumber) => `${prefix}${studentNumber}`);
    const users = await Visualization.getUsersByUsernames(usernames);
    const resolvedStudents = buildStudentMap(students, prefix, users);

    const studentPayload = await Promise.all(
      resolvedStudents.map(async (student) => {
        if (!student.userID) {
          return {
            ...student,
            entries: [],
          };
        }

        const [seedRow, rangeRows] = await Promise.all([
          Visualization.getLatestEmojiReactionBeforeStart(student.userID, start),
          Visualization.getEmojiReactionsByUserIdWithinWindow(student.userID, start, end),
        ]);

        const entries = [];
        if (seedRow) {
          entries.push(formatEmojiRow(seedRow, true));
        }

        rangeRows.forEach((row) => {
          entries.push(formatEmojiRow(row, false));
        });

        return {
          ...student,
          entries,
        };
      }),
    );

    return res.json({
      ok: true,
      window: { start, end },
      prefix,
      students: studentPayload,
    });
  } catch (error) {
    console.error('Error fetching visualization emoji reactions:', error);
    return res.status(500).json({ ok: false, error: 'Failed to fetch emoji reactions' });
  }
};
