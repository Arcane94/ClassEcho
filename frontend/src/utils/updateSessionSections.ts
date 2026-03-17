import { API_BASE_URL } from "../config";

export interface UpdatedSessionSectionInput {
  session_segtor: string;
  section_name: string;
  tags: { tag_name: string }[];
}

//Uses a given sessionId and updated sections to replace the section/tag structure in the database
export async function updateSessionSections(
  sessionId: string | number,
  sections: UpdatedSessionSectionInput[],
): Promise<{ success: boolean; error?: string; }> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/sections`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sections }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to update session sections",
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error("Error updating session sections:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
