import { API_BASE_URL } from "../config";

// Calls backend route to get a user's id by username or email
export async function getUserIDFromUsername(identifier: string): Promise<{ success: boolean; user_id?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/username/${encodeURIComponent(identifier)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to find user",
      };
    }

    const result = await response.json();
    return {
      success: true,
      user_id: result.user_id,
    };
  } catch (err) {
    console.error("Error retrieving user id by username/email:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
