// Loads and saves replay-window setup data for the visualization editor.
import { API_BASE_URL } from "@/config";
import type { VisualizationScheduleRow } from "../types";
import { createVisualizationScheduleRow, createVisualizationSeat } from "../utils/schedule";
import { EASTERN_TIME_ZONE } from "../utils";

type VisualizationSetupApiSeat = {
  period_seat_id?: number | null;
  assignment_id?: number | null;
  seat_label?: string | null;
  x: number;
  y: number;
  seat_type?: "student" | "teacher" | "blocked";
  student_identifier?: string | null;
};

type VisualizationSetupApiRow = {
  session_date_id?: number | null;
  session_period_id?: number | null;
  date: string;
  period: string;
  timezone?: string | null;
  start_time: string;
  end_time: string;
  seats?: VisualizationSetupApiSeat[];
};

type VisualizationSetupApiResponse = {
  replay_windows?: VisualizationSetupApiRow[];
};

function normalizeSetupRows(rows: VisualizationSetupApiRow[] | undefined): VisualizationScheduleRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) =>
    createVisualizationScheduleRow({
      session_date_id: row.session_date_id ?? null,
      session_period_id: row.session_period_id ?? null,
      date: row.date,
      period: row.period,
      timezone: row.timezone ?? EASTERN_TIME_ZONE,
      start_time: row.start_time,
      end_time: row.end_time,
      seats: (row.seats ?? []).map((seat) =>
        createVisualizationSeat({
          period_seat_id: seat.period_seat_id ?? null,
          assignment_id: seat.assignment_id ?? null,
          seat_label: String(seat.seat_label ?? "").trim(),
          x: Number(seat.x),
          y: Number(seat.y),
          seat_type: seat.seat_type === "teacher" || seat.seat_type === "blocked" ? seat.seat_type : "student",
          student_identifier: String(seat.student_identifier ?? "").trim(),
        }),
      ),
    }),
  );
}

export async function fetchVisualizationSetup(
  sessionId: string | number,
  userId?: string | number | null,
): Promise<VisualizationScheduleRow[]> {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const queryString = new URLSearchParams({
    user_id: String(resolvedUserId ?? ""),
  });
  const response = await fetch(`${API_BASE_URL}/visualization/sessions/${sessionId}/setup?${queryString.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }

    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || "Failed to fetch visualization setup");
  }

  const payload: VisualizationSetupApiResponse = await response.json();
  return normalizeSetupRows(payload.replay_windows);
}

export async function saveVisualizationSetup(
  sessionId: string | number,
  rows: VisualizationScheduleRow[],
  userId?: string | number | null,
): Promise<VisualizationScheduleRow[]> {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const response = await fetch(`${API_BASE_URL}/visualization/sessions/${sessionId}/setup`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: resolvedUserId ?? null,
      replay_windows: rows.map((row) => ({
        session_date_id: row.session_date_id ?? null,
        session_period_id: row.session_period_id ?? null,
        date: row.date,
        period: row.period,
        timezone: row.timezone,
        start_time: row.start_time,
        end_time: row.end_time,
        seats: row.seats.map((seat) => ({
          period_seat_id: seat.period_seat_id ?? null,
          assignment_id: seat.assignment_id ?? null,
          seat_label: seat.seat_label || null,
          x: seat.x,
          y: seat.y,
          seat_type: seat.seat_type,
          student_identifier: seat.student_identifier || null,
        })),
      })),
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || "Failed to save visualization setup");
  }

  const payload: VisualizationSetupApiResponse = await response.json();
  return normalizeSetupRows(payload.replay_windows);
}
