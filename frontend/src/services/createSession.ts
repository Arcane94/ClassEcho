import { API_BASE_URL } from "../config";

export interface SessionTagInput {
  tag_name: string;
  is_selected?: boolean;
}

export interface SessionSectionInput {
  session_segtor: string;
  section_name: string;
  tags?: SessionTagInput[];
}

export interface CreateSessionPayload {
  local_time?: string;
  observer_name: string;
  teacher_name: string;
  session_name: string;
  lesson_description?: string;
  join_code: string;
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
      const errorData = await response.json();
      console.log("API Error:", errorData);
      throw new Error(errorData.message || "Failed to create session");
    }

    const result = await response.json();
    console.log(`[${new Date().toISOString()}] Session Created`);
    return { session_id: result.session_id };
  } catch (err) {
    console.error("Error creating session:", err);
    throw err;
  }
}
