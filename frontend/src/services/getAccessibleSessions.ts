// Returns the sessions the current user can access, including their permission flags.
import { API_BASE_URL } from "../config";
import { normalizeSessionData, type SessionData } from "./fetchSessionById";

export async function getAccessibleSessions(userId: string | number): Promise<SessionData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/sessions/access`);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn("User not found");
        return [];
      }

      throw new Error("Failed to fetch accessible sessions");
    }

    const data = await response.json();
    return Array.isArray(data.sessions)
      ? data.sessions.map((session: Record<string, unknown>) => normalizeSessionData(session))
      : [];
  } catch (error) {
    console.error("Error fetching accessible sessions:", error);
    return [];
  }
}
