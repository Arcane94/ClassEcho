// Date/time helpers that normalize browser timestamps into the SQL formats used by the app.
const EASTERN_TIME_ZONE = 'America/New_York';
const formatterCache = new Map();

function pad(value) {
  return String(value).padStart(2, '0');
}

function normalizeDateInput(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateParts(parts) {
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function getFormatter(timeZone) {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  formatterCache.set(timeZone, formatter);
  return formatter;
}

function extractParts(formatter, date) {
  const rawParts = formatter.formatToParts(date);
  const lookup = rawParts.reduce((accumulator, part) => {
    if (part.type !== 'literal') {
      accumulator[part.type] = part.value;
    }
    return accumulator;
  }, {});

  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour === '24' ? '00' : lookup.hour,
    minute: lookup.minute,
    second: lookup.second,
  };
}

const easternFormatter = getFormatter(EASTERN_TIME_ZONE);

function isSupportedTimeZone(timeZone) {
  if (!timeZone) {
    return false;
  }

  try {
    getFormatter(timeZone).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function normalizeTimeZone(value, fallback = EASTERN_TIME_ZONE) {
  const candidate = String(value ?? '').trim();
  return isSupportedTimeZone(candidate) ? candidate : fallback;
}

function toNumberParts(parts) {
  const numberParts = {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };

  return Object.values(numberParts).every(Number.isFinite) ? numberParts : null;
}

function buildUtcComparableValue(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function buildDateInTimeZone(year, month, day, hour, minute, second, timeZone) {
  let candidateMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const desiredValue = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let index = 0; index < 3; index += 1) {
    const actualParts = toNumberParts(extractParts(getFormatter(timeZone), new Date(candidateMs)));
    if (!actualParts) {
      return null;
    }

    const diff = desiredValue - buildUtcComparableValue(actualParts);
    candidateMs += diff;

    if (diff === 0) {
      break;
    }
  }

  const result = new Date(candidateMs);
  return Number.isNaN(result.getTime()) ? null : result;
}

function parseMySQLDateTimeInTimeZone(value, timeZone = EASTERN_TIME_ZONE) {
  const raw = String(value ?? '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return normalizeDateInput(value);
  }

  return buildDateInTimeZone(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? '0'),
    normalizeTimeZone(timeZone),
  );
}

// Used to convert times from frontend into dates that SQL can accept in the server's local timezone.
function toMySQLDateTime(value) {
  const date = normalizeDateInput(value);
  if (!date) {
    return null;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Converts an instant into Eastern Time SQL text, including DST transitions.
function toEasternMySQLDateTime(value) {
  const date = normalizeDateInput(value);
  if (!date) {
    return null;
  }

  return formatDateParts(extractParts(easternFormatter, date));
}

function toTimeZoneMySQLDateTime(value, timeZone = EASTERN_TIME_ZONE) {
  const date = normalizeDateInput(value);
  if (!date) {
    return null;
  }

  return formatDateParts(extractParts(getFormatter(normalizeTimeZone(timeZone)), date));
}

module.exports = {
  EASTERN_TIME_ZONE,
  normalizeTimeZone,
  parseMySQLDateTimeInTimeZone,
  toMySQLDateTime,
  toEasternMySQLDateTime,
  toTimeZoneMySQLDateTime,
};
