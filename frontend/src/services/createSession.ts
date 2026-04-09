// Creates a new observation session and posts the initial sections payload to the backend.
import { API_BASE_URL } from "../config";

export interface SessionTagInput {
  tag_name: string;
  is_selected?: boolean;
}

export interface SessionSectionInput {
  session_sector: string;
  section_name: string;
  tags?: SessionTagInput[];
}

export interface CreateSessionPayload {
  local_time?: string;
  creator: number;
  teacher_name: string;
  session_name: string;
  lesson_description?: string;
  join_code: string;
  student_id_numeric_only: boolean;
  // Start with the current user's id in these arrays
  observers?: number[];
  editors?: number[];
  sections?: SessionSectionInput[];
}

// Calls the server and sends all data needed to create a new session
export async function createSession(data: CreateSessionPayload): Promise<{ session_id: number }> {
  console.log(`[${new Date().toISOString()}] Creating new session: ${JSON.stringify(data)}`);
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("API Error:", errorData);
      throw new Error(errorData.error || errorData.message || "Failed to create session");
    }

    const result = await response.json();
    console.log(`[${new Date().toISOString()}] Session Created`);
    return { session_id: result.session_id };
  } catch (err) {
    console.error("Error creating session:", err);
    throw err;
  }
}
