function isNumericOnlyEnabled(value) {
  return value === true || value === 1 || value === '1';
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

  return trimmedValue.replace(/\s+/g, '');
}

module.exports = {
  isNumericOnlyEnabled,
  isValidNumericStudentIdValue,
  normalizeNumericStudentIdValue,
};
