// Fetches one saved session and normalizes the response shape for the UI.
import { API_BASE_URL } from "../config";

export interface SessionData {
    session_id: string;
    creator: number;
    teacher_name: string;
    lesson_name: string;
    lesson_description: string;
    local_time: string;
    server_time: string;
    join_code: string;
    student_id_numeric_only: boolean;
    access_role?: "creator" | "viewer" | "viz_editor" | "full_editor" | null;
    access_role_label?: string | null;
    is_creator?: boolean;
    permissions?: {
      can_view_session: boolean;
      can_export_csv: boolean;
      can_edit_visualization: boolean;
      can_edit_session: boolean;
      can_delete_session: boolean;
      can_manage_access: boolean;
    };
  }

  export function normalizeSessionData(data: Record<string, unknown>): SessionData {
    return {
      ...data,
      session_id: String(data.session_id ?? ""),
      creator: Number(data.creator ?? 0),
      teacher_name: String(data.teacher_name ?? ""),
      lesson_name: String(data.lesson_name ?? data.session_name ?? ""),
      lesson_description: String(data.lesson_description ?? ""),
      local_time: String(data.local_time ?? ""),
      server_time: String(data.server_time ?? ""),
      join_code: String(data.join_code ?? ""),
      student_id_numeric_only: Boolean(Number(data.student_id_numeric_only ?? 0)),
      access_role:
        typeof data.access_role === "string"
          ? (data.access_role as SessionData["access_role"])
          : null,
      access_role_label:
        typeof data.access_role_label === "string" ? data.access_role_label : null,
      is_creator: Boolean(data.is_creator),
      permissions:
        data.permissions && typeof data.permissions === "object"
          ? {
              can_view_session: Boolean((data.permissions as Record<string, unknown>).can_view_session),
              can_export_csv: Boolean((data.permissions as Record<string, unknown>).can_export_csv),
              can_edit_visualization: Boolean((data.permissions as Record<string, unknown>).can_edit_visualization),
              can_edit_session: Boolean((data.permissions as Record<string, unknown>).can_edit_session),
              can_delete_session: Boolean((data.permissions as Record<string, unknown>).can_delete_session),
              can_manage_access: Boolean((data.permissions as Record<string, unknown>).can_manage_access),
            }
          : undefined,
    } as SessionData;
  }
  
  //Calls server and attempts to retrieve session information using session id
  export async function fetchSessionById(sessionId: string, userId?: string | number | null): Promise<SessionData | null> {
    try {
      const queryString =
        userId !== undefined && userId !== null
          ? `?${new URLSearchParams({ user_id: String(userId) }).toString()}`
          : "";
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}${queryString}`);
  
      if (!response.ok) {
        //If session could not be found, alert console
        if (response.status === 404) {
          console.warn("Session not found");
          return null;
        }
        //throw error if unexpected error occurs either in servr or in API call
        throw new Error("Failed to fetch session data");
      }
      
      //Save and normalize collected data
      const data = await response.json();
      return normalizeSessionData(data as Record<string, unknown>);
  
    } catch (error) {
      console.error("Error fetching session:", error);
      return null;
    }
  }
  
