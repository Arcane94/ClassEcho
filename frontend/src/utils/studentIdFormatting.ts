// Normalizes student ID inputs for sessions that allow numeric-only entry.
const NUMERIC_STUDENT_ID_INPUT_PATTERN = /[^\d,]+/g;

function normalizeNumericStudentIdSegment(segment: string): string {
  return segment.replace(/^0+(?=\d)/, "");
}

function normalizeNumericStudentIdSegments(value: string): string[] {
  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(normalizeNumericStudentIdSegment);
}

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

  const sanitizedValue = sanitizeStudentIdInput(value, true)
    .replace(/^,+|,+$/g, "")
    .trim();

  return normalizeNumericStudentIdSegments(sanitizedValue).join(",");
}
