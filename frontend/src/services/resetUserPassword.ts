import { API_BASE_URL } from "../config";
import {
  getBackendUnavailableMessage,
  getErrorMessageFromPayload,
  readJsonResponse,
  type ApiResult,
} from "./apiHelpers";

// Calls backend route to reset a user's password using identifier and reset code
export async function resetUserPassword(
  identifier: string,
  resetCode: string,
  newPassword: string,
): Promise<ApiResult<{ message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/password-reset/confirm`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, reset_code: resetCode, new_password: newPassword }),
    });

    const payload = await readJsonResponse<{ error?: string; message?: string }>(response);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        reason: payload ? "http" : "invalid-response",
        error: getErrorMessageFromPayload(
          payload,
          response.status >= 500
            ? "The server could not reset the password. Check the backend logs and try again."
            : "Failed to reset password.",
        ),
      };
    }

    if (!payload) {
      return {
        success: false,
        status: response.status,
        reason: "invalid-response",
        error: "The server returned an unexpected password reset response. Please try again.",
      };
    }

    return {
      success: true,
      status: response.status,
      result: { message: payload.message || "Password reset successful" },
    };
  } catch (err) {
    console.error("Error resetting user password:", err);
    return {
      success: false,
      reason: "network",
      error: getBackendUnavailableMessage("reset the password"),
    };
  }
}
