import { API_BASE_URL } from "../config";

interface UpdateSessionInfoPayload {
  observer_name: string;
  teacher_name: string;
  session_name: string;
  lesson_description: string;
  join_code: string;
}

//Uses a given sessionId and session details to update a session in the database
export async function updateSessionInfo(
  sessionId: string | number,
  payload: UpdateSessionInfoPayload,
): Promise<{ success: boolean; error?: string; }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to update session info",
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error("Error updating session info:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
