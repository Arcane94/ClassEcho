import { API_BASE_URL } from "../config";

export async function requestPasswordResetCode(identifier: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/password-reset/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to send reset code",
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Reset code sent",
    };
  } catch (err) {
    console.error("Error requesting password reset code:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
