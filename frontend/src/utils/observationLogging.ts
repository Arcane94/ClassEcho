// Shared observation logging helpers for timestamps, window sizing, and recording flags.
export type ObservationRecordingFlag = 0 | 1;

const INSTANT_OBSERVATION_WINDOW_MS = 10_000;

const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime());

export function buildObservationClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getStoredObserverId(): number | null {
  const rawUserId = localStorage.getItem("user_id");
  if (!rawUserId) {
    return null;
  }

  const observerId = Number(rawUserId);
  return Number.isNaN(observerId) ? null : observerId;
}

export function buildObservationWindow({
  sustained,
  recordingStartedAt,
  clickedAt = new Date(),
}: {
  sustained: boolean;
  recordingStartedAt?: string | null;
  clickedAt?: Date;
}): {
  start_time: string;
  end_time: string;
  recording: ObservationRecordingFlag;
} {
  const safeClickedAt = isValidDate(clickedAt) ? clickedAt : new Date();

  if (sustained) {
    const parsedStartTime = recordingStartedAt ? new Date(recordingStartedAt) : null;
    const safeStartTime = parsedStartTime && isValidDate(parsedStartTime) ? parsedStartTime : safeClickedAt;

    return {
      start_time: safeStartTime.toISOString(),
      end_time: safeClickedAt.toISOString(),
      recording: 1,
    };
  }

  const instantStartTime = new Date(safeClickedAt.getTime() - INSTANT_OBSERVATION_WINDOW_MS);

  return {
    start_time: instantStartTime.toISOString(),
    end_time: safeClickedAt.toISOString(),
    recording: 0,
  };
}

export function normalizeObservationPayloadTiming<
  T extends {
    start_time?: string;
    end_time?: string;
    recording?: ObservationRecordingFlag | boolean | null;
  },
>(observation: T): T & { start_time: string; end_time: string; recording: ObservationRecordingFlag } {
  const normalizedRecording: ObservationRecordingFlag = observation.recording === 1 || observation.recording === true ? 1 : 0;

  const parsedEndTime = observation.end_time ? new Date(observation.end_time) : null;
  const safeEndTime = parsedEndTime && isValidDate(parsedEndTime)
    ? parsedEndTime
    : observation.start_time
      ? new Date(observation.start_time)
      : new Date();

  const parsedStartTime = observation.start_time ? new Date(observation.start_time) : null;
  const safeStartTime = parsedStartTime && isValidDate(parsedStartTime)
    ? parsedStartTime
    : normalizedRecording === 1
      ? safeEndTime
      : new Date(safeEndTime.getTime() - INSTANT_OBSERVATION_WINDOW_MS);

  return {
    ...observation,
    start_time: safeStartTime.toISOString(),
    end_time: safeEndTime.toISOString(),
    recording: normalizedRecording,
  };
}
