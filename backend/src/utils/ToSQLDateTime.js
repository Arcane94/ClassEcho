// Date/time helpers that normalize browser timestamps into the SQL formats used by the app.
const EASTERN_TIME_ZONE = 'America/New_York';

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

const easternFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EASTERN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

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

module.exports = {
  EASTERN_TIME_ZONE,
  toMySQLDateTime,
  toEasternMySQLDateTime,
};
