// Deletes a session after the backend verifies the requester is the session creator.
import { API_BASE_URL } from "../config";

//Uses a given sessionId to delete a session in the database
export async function deleteSession(
  sessionId: string | number,
  requesterId?: string | number | null,
): Promise<{ success: boolean; error?: string; }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requester_id: requesterId ?? null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to delete session",
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error("Error deleting session:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
