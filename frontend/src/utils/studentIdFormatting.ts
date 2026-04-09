// Normalizes student ID inputs for sessions that allow numeric-only entry.
const NUMERIC_STUDENT_ID_INPUT_PATTERN = /[^\d,]+/g;

export function sanitizeStudentIdInput(value: string, numericOnly: boolean): string {
  if (!numericOnly) {
    return value;
  }

  return value
    .replace(NUMERIC_STUDENT_ID_INPUT_PATTERN, "")
    .replace(/,{2,}/g, ",");
}

export function normalizeStudentIdForSubmission(value: string, numericOnly: boolean): string {
  if (!numericOnly) {
    return value.trim();
  }

  return sanitizeStudentIdInput(value, true)
    .replace(/^,+|,+$/g, "")
    .trim();
}
