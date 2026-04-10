function isNumericOnlyEnabled(value) {
  return value === true || value === 1 || value === '1';
}

function normalizeNumericStudentIdSegment(segment) {
  return String(segment).replace(/^0+(?=\d)/, '');
}

function isValidNumericStudentIdValue(value) {
  if (value === undefined || value === null) {
    return true;
  }

  const trimmedValue = String(value).trim();
  if (!trimmedValue) {
    return true;
  }

  return /^\d+(?:\s*,\s*\d+)*$/.test(trimmedValue);
}

function normalizeNumericStudentIdValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmedValue = String(value).trim();
  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = trimmedValue
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(normalizeNumericStudentIdSegment)
    .join(',');

  return normalizedValue || null;
}

module.exports = {
  isNumericOnlyEnabled,
  isValidNumericStudentIdValue,
  normalizeNumericStudentIdValue,
};
