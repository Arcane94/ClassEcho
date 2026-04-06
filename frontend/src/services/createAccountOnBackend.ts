import { API_BASE_URL } from "../config";
import {
  getBackendUnavailableMessage,
  getErrorMessageFromPayload,
  readJsonResponse,
  type ApiResult,
} from "./apiHelpers";

// Calls the server and sends all the data needed to create a user's account
export async function createAccountOnBackend(
  username: string,
  email: string,
  password: string,
): Promise<ApiResult<{ user_id: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const payload = await readJsonResponse<{ user_id: number; error?: string; message?: string }>(response);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        reason: payload ? "http" : "invalid-response",
        error: getErrorMessageFromPayload(
          payload,
          response.status >= 500
            ? "The server could not create the account. Check the backend logs and database connection, then try again."
            : "Failed to create account.",
        ),
      };
    }

    if (!payload) {
      return {
        success: false,
        status: response.status,
        reason: "invalid-response",
        error: "The server returned an unexpected signup response. Check the backend logs and try again.",
      };
    }

    return {
      success: true,
      status: response.status,
      result: payload,
    };
  } catch (err) {
    console.error("Error creating user's account:", err);
    return {
      success: false,
      reason: "network",
      error: getBackendUnavailableMessage("create an account"),
    };
  }
}
