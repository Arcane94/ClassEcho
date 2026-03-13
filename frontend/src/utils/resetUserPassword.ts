import { API_BASE_URL } from "../config";

// Calls backend route to reset a user's password using identifier and reset code
export async function resetUserPassword(identifier: string, resetCode: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/password-reset/confirm`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, reset_code: resetCode, new_password: newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to reset password",
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Password reset successful",
    };
  } catch (err) {
    console.error("Error resetting user password:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
