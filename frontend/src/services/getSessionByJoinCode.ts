import { API_BASE_URL } from "../config";

export interface SessionInfo {
  session_id: number;
  observer_name: string;
  teacher_name: string;
  session_name: string;
  lesson_description: string | null;
  local_time: string | null;
  server_time: string;
  join_code: string;
  observers: number[] | null;
  editors: number[] | null;
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

    const session: SessionInfo = await response.json();
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
