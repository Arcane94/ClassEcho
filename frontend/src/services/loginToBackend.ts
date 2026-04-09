// Sends login credentials to the backend and returns the authenticated user payload.
import { API_BASE_URL } from "../config";
import {
  getBackendUnavailableMessage,
  getErrorMessageFromPayload,
  readJsonResponse,
  type ApiResult,
} from "./apiHelpers";

// Calls the server and sends all the data needed to log in to the user's account with username or email
export async function loginToBackend(
  identifier: string,
  password: string,
): Promise<ApiResult<{ user_id: number; username: string; sessions: unknown[] | string }>> {
  try {
    const normalizedIdentifier = identifier.trim();
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: normalizedIdentifier, email: normalizedIdentifier, password }),
    });

    const payload = await readJsonResponse<{ user_id: number; username: string; sessions: unknown[] | string; error?: string; message?: string }>(response);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        reason: payload ? "http" : "invalid-response",
        error: getErrorMessageFromPayload(
          payload,
          response.status >= 500
            ? "The server could not complete login. Check the backend logs and try again."
            : "Failed to log in.",
        ),
      };
    }

    if (!payload) {
      return {
        success: false,
        status: response.status,
        reason: "invalid-response",
        error: "The server returned an unexpected login response. Please try again.",
      };
    }

    return {
      success: true,
      status: response.status,
      result: payload,
    };
  } catch (err) {
    console.error("Error logging in to user's account:", err);
    return {
      success: false,
      reason: "network",
      error: getBackendUnavailableMessage("log in"),
    };
  }
}
  
