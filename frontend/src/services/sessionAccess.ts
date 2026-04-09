// Frontend client for sharing sessions, changing access levels, and loading access lists.
import { API_BASE_URL } from "../config";

export type SharedSessionRole = "viewer" | "viz_editor" | "full_editor";
export type SessionAccessRole = SharedSessionRole | "creator";

export const SESSION_ACCESS_ROLE_LABELS: Record<SessionAccessRole, string> = {
  creator: "Session Creator",
  viewer: "View Only",
  viz_editor: "Visualization Editor",
  full_editor: "Full Editor",
};

export type SessionAccessEntry = {
  session_user_access_id: number;
  user_id: number;
  username: string | null;
  email: string | null;
  role: SharedSessionRole;
  granted_by: number | null;
  granted_by_username: string | null;
  granted_at: string;
};

export type SessionAccessList = {
  session_id: number;
  owner: {
    user_id: number;
    username: string | null;
    email: string | null;
  };
  shared_users: SessionAccessEntry[];
};

type SessionAccessMutationResult = {
  success: boolean;
  data?: SessionAccessList;
  error?: string;
};

async function parseSessionAccessResponse(response: Response): Promise<SessionAccessMutationResult> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      error: data.error || "Request failed",
    };
  }

  return {
    success: true,
    data: data as SessionAccessList,
  };
}

export async function fetchSessionAccessList(
  sessionId: string | number,
  userId: string | number,
): Promise<SessionAccessMutationResult> {
  try {
    const queryString = new URLSearchParams({
      user_id: String(userId),
    });
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/access?${queryString.toString()}`);
    return parseSessionAccessResponse(response);
  } catch (error) {
    console.error("Error fetching session access list:", error);
    return {
      success: false,
      error: "Network error",
    };
  }
}

export async function shareSessionWithUser(
  sessionId: string | number,
  requesterId: string | number,
  identifier: string,
  role: SharedSessionRole,
): Promise<SessionAccessMutationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requester_id: requesterId,
        identifier,
        role,
      }),
    });

    return parseSessionAccessResponse(response);
  } catch (error) {
    console.error("Error sharing session:", error);
    return {
      success: false,
      error: "Network error",
    };
  }
}

export async function updateSharedSessionRole(
  sessionId: string | number,
  targetUserId: string | number,
  requesterId: string | number,
  role: SharedSessionRole,
): Promise<SessionAccessMutationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/access/${targetUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requester_id: requesterId,
        role,
      }),
    });

    return parseSessionAccessResponse(response);
  } catch (error) {
    console.error("Error updating session access role:", error);
    return {
      success: false,
      error: "Network error",
    };
  }
}

export async function removeSharedSessionAccess(
  sessionId: string | number,
  targetUserId: string | number,
  requesterId: string | number,
): Promise<SessionAccessMutationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/access/${targetUserId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requester_id: requesterId,
      }),
    });

    return parseSessionAccessResponse(response);
  } catch (error) {
    console.error("Error removing session access:", error);
    return {
      success: false,
      error: "Network error",
    };
  }
}
