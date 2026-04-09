// Lightweight observation count lookup used to disable export buttons when a session has no logs yet.
import { API_BASE_URL } from "../config";

export interface SessionObservationCounts {
  teacherCount: number | null;
  studentCount: number | null;
}

async function fetchCount(url: string): Promise<number | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const rawCount = payload?.count;
    const parsedCount = Number(rawCount);

    return Number.isFinite(parsedCount) ? parsedCount : null;
  } catch (error) {
    console.error("Error fetching observation count:", error);
    return null;
  }
}

export async function getSessionObservationCounts(
  sessionId: string | number,
  userId?: string | number | null,
): Promise<SessionObservationCounts> {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const queryString = new URLSearchParams({
    user_id: String(resolvedUserId ?? ""),
  }).toString();

  const teacherUrl = `${API_BASE_URL}/observations/teacher/session/${sessionId}/count?${queryString}`;
  const studentUrl = `${API_BASE_URL}/observations/student/session/${sessionId}/count?${queryString}`;

  const [teacherCount, studentCount] = await Promise.all([
    fetchCount(teacherUrl),
    fetchCount(studentUrl),
  ]);

  return {
    teacherCount,
    studentCount,
  };
}
