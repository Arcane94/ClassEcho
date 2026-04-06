import { API_BASE_URL } from "../config";
import {
  getBackendUnavailableMessage,
  getErrorMessageFromPayload,
  readJsonResponse,
  type ApiResult,
} from "./apiHelpers";

export async function requestPasswordResetCode(identifier: string): Promise<ApiResult<{ message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/password-reset/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier }),
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
            ? "The server could not send a reset code. Check the backend email configuration and try again."
            : "Failed to send reset code.",
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
      result: { message: payload.message || "Reset code sent" },
    };
  } catch (err) {
    console.error("Error requesting password reset code:", err);
    return {
      success: false,
      reason: "network",
      error: getBackendUnavailableMessage("request a password reset code"),
    };
  }
}
