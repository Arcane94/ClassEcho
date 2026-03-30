import { API_BASE_URL } from "../config";

export interface SessionSectionInfo {
  section_id: number;
  session_segtor: string;
  section_name: string;
  tags: string[];
}

// Calls server to retrieve all session sections and their tags
export async function getSessionSectionInfo(sessionId: string): Promise<SessionSectionInfo[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/sections`);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn("Session sections not found");
        return null;
      }
      throw new Error("Failed to fetch session sections");
    }

    const data: { sections?: SessionSectionInfo[] } = await response.json();
    return Array.isArray(data.sections) ? data.sections : [];
  } catch (error) {
    console.error("Error fetching session sections:", error);
    return null;
  }
}
