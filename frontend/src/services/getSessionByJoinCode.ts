// Looks up a session by join code for the join-session workflow.
import { API_BASE_URL } from "../config";

export interface SessionInfo {
  session_id: number;
  creator: number;
  teacher_name: string;
  session_name: string;
  lesson_description: string | null;
  local_time: string | null;
  server_time: string;
  join_code: string;
  observers: number[] | null;
  editors: number[] | null;
  student_id_numeric_only: boolean;
}

// Calls the server to retrieve session information using a join code
export async function getSessionByJoinCode(
  joinCode: string
): Promise<{ success: boolean; error?: string; session?: SessionInfo }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/join/${joinCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to find session",
      };
    }

    const rawSession = await response.json();
    const session: SessionInfo = {
      ...rawSession,
      student_id_numeric_only: Boolean(Number(rawSession.student_id_numeric_only ?? 0)),
    };
    return {
      success: true,
      session,
    };
  } catch (err) {
    console.error("Error retrieving session by join code:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
