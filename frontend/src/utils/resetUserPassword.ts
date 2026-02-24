import { API_BASE_URL } from "../config";

// Calls backend route to reset a user's password by user id
export async function resetUserPassword(userId: number | string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${String(userId)}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_password: newPassword }),
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
