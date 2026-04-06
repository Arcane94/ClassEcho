import { API_BASE_URL } from "../config";

export type ApiResult<T> =
  | {
      success: true;
      result: T;
      status: number;
    }
  | {
      success: false;
      error: string;
      status?: number;
      reason: "network" | "http" | "invalid-response";
    };

type ErrorPayload = {
  error?: string;
  message?: string;
};

export async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getBackendUnavailableMessage(action: string): string {
  return `Unable to ${action} because the backend at ${API_BASE_URL} is not reachable. Start the backend server with "npm run backend:start" from the repository root and try again.`;
}

export function getErrorMessageFromPayload(
  payload: ErrorPayload | null,
  fallback: string,
): string {
  return payload?.error || payload?.message || fallback;
}
