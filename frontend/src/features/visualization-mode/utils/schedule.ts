// Normalizes replay-window rows and seat maps used by the visualization setup and viewer.
import type { VisualizationScheduleRow, VisualizationSeat, VisualizationSeatType } from "../types";
import {
  getVisualizationBrowserTimeZone,
  normalizeVisualizationTimeZone,
  parseDateOnly,
  parseSeatingDateTime,
} from "../utils";

const DEFAULT_NEW_REPLAY_WINDOW_TIME_ZONE = getVisualizationBrowserTimeZone();

function generateScheduleRowId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateSeatId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `seat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createVisualizationSeat(
  initial?: Partial<VisualizationSeat>,
): VisualizationSeat {
  const x = Number(initial?.x);
  const y = Number(initial?.y);
  const seatType = initial?.seat_type === "teacher" || initial?.seat_type === "blocked"
    ? initial.seat_type
    : "student";

  return {
    id: initial?.id?.trim() || generateSeatId(),
    period_seat_id: initial?.period_seat_id ?? null,
    assignment_id: initial?.assignment_id ?? null,
    seat_label: String(initial?.seat_label ?? "").trim(),
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    seat_type: seatType as VisualizationSeatType,
    student_identifier: String(initial?.student_identifier ?? "").trim(),
  };
}

function normalizeVisualizationSeats(rows: VisualizationSeat[] | undefined): VisualizationSeat[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  const deduped = new Map<string, VisualizationSeat>();
  rows.forEach((row) => {
    const normalized = createVisualizationSeat(row);
    deduped.set(`${normalized.x}:${normalized.y}`, normalized);
  });

  return Array.from(deduped.values()).sort((left, right) => {
    if (left.y !== right.y) {
      return left.y - right.y;
    }
    return left.x - right.x;
  });
}

export function createVisualizationScheduleRow(
  initial?: Partial<VisualizationScheduleRow>,
): VisualizationScheduleRow {
  return {
    id: initial?.id?.trim() || generateScheduleRowId(),
    session_date_id: initial?.session_date_id ?? null,
    session_period_id: initial?.session_period_id ?? null,
    date: String(initial?.date ?? "").trim(),
    period: String(initial?.period ?? "").trim(),
    timezone: normalizeVisualizationTimeZone(initial?.timezone, DEFAULT_NEW_REPLAY_WINDOW_TIME_ZONE),
    start_time: String(initial?.start_time ?? "").trim(),
    end_time: String(initial?.end_time ?? "").trim(),
    seats: normalizeVisualizationSeats(initial?.seats),
  };
}

export function normalizeVisualizationScheduleRow(
  row: VisualizationScheduleRow,
): VisualizationScheduleRow {
  return createVisualizationScheduleRow(row);
}

export function isMeaningfulVisualizationScheduleRow(row: VisualizationScheduleRow): boolean {
  const normalized = normalizeVisualizationScheduleRow(row);
  return Boolean(
    normalized.date ||
      normalized.period ||
      normalized.start_time ||
      normalized.end_time,
  );
}

function getSingleVisualizationScheduleRowError(row: VisualizationScheduleRow): string | null {
  const normalized = normalizeVisualizationScheduleRow(row);
  if (!isMeaningfulVisualizationScheduleRow(normalized)) {
    return null;
  }

  if (!normalized.date || !normalized.period || !normalized.timezone || !normalized.start_time || !normalized.end_time) {
    return "Complete the date, period, time zone, start time, and end time.";
  }

  if (!parseDateOnly(normalized.date)) {
    return "Enter a valid date.";
  }

  const parsedStart = parseSeatingDateTime(normalized.date, normalized.start_time, normalized.timezone);
  const parsedEnd = parseSeatingDateTime(normalized.date, normalized.end_time, normalized.timezone);
  if (!parsedStart.value || !parsedEnd.value) {
    return "Enter a valid time range.";
  }

  if (parsedEnd.value <= parsedStart.value) {
    return "End time must be after start time.";
  }

  return null;
}

export function getVisualizationScheduleRowErrors(
  rows: VisualizationScheduleRow[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const seenKeys = new Set<string>();

  rows.forEach((row) => {
    const normalized = normalizeVisualizationScheduleRow(row);
    const rowError = getSingleVisualizationScheduleRowError(normalized);
    if (rowError) {
      errors[normalized.id] = rowError;
      return;
    }

    if (!isMeaningfulVisualizationScheduleRow(normalized)) {
      return;
    }

    const duplicateKey = `${normalized.date}::${normalized.period.toLowerCase()}`;
    if (seenKeys.has(duplicateKey)) {
      errors[normalized.id] = "Each date and period should only be added once.";
      return;
    }

    seenKeys.add(duplicateKey);
  });

  return errors;
}

export function getValidVisualizationScheduleRows(
  rows: VisualizationScheduleRow[],
): VisualizationScheduleRow[] {
  const errors = getVisualizationScheduleRowErrors(rows);

  return rows
    .map(normalizeVisualizationScheduleRow)
    .filter((row) => isMeaningfulVisualizationScheduleRow(row) && !errors[row.id]);
}

export function hasConfiguredVisualizationSeats(row: VisualizationScheduleRow): boolean {
  return normalizeVisualizationScheduleRow(row).seats.length > 0;
}

export function countConfiguredVisualizationSeatMaps(
  rows: VisualizationScheduleRow[],
): number {
  return getValidVisualizationScheduleRows(rows).filter(hasConfiguredVisualizationSeats).length;
}

export function countConfiguredVisualizationScheduleRows(
  rows: VisualizationScheduleRow[],
): number {
  return getValidVisualizationScheduleRows(rows).length;
}
