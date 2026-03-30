import { API_BASE_URL } from "../config";

export async function verifyPasswordResetCode(identifier: string, resetCode: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/password-reset/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, reset_code: resetCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Invalid reset code",
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Reset code is valid",
    };
  } catch (err) {
    console.error("Error verifying password reset code:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
