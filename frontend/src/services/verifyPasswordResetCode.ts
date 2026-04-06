import { API_BASE_URL } from "../config";
import {
  getBackendUnavailableMessage,
  getErrorMessageFromPayload,
  readJsonResponse,
  type ApiResult,
} from "./apiHelpers";

export async function verifyPasswordResetCode(
  identifier: string,
  resetCode: string,
): Promise<ApiResult<{ message: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/password-reset/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, reset_code: resetCode }),
    });

    const payload = await readJsonResponse<{ error?: string; message?: string }>(response);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        reason: payload ? "http" : "invalid-response",
        error: getErrorMessageFromPayload(payload, "Invalid reset code."),
      };
    }

    if (!payload) {
      return {
        success: false,
        status: response.status,
        reason: "invalid-response",
        error: "The server returned an unexpected reset-code response. Please try again.",
      };
    }

    return {
      success: true,
      status: response.status,
      result: { message: payload.message || "Reset code is valid" },
    };
  } catch (err) {
    console.error("Error verifying password reset code:", err);
    return {
      success: false,
      reason: "network",
      error: getBackendUnavailableMessage("verify the reset code"),
    };
  }
}
