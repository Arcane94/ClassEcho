import { API_BASE_URL } from "../config";

//Uses a given userId and sessionId to update the edit_sessions array of that user in the database
export async function updateUserEditSessions(
	userId: string | number,
	sessionId: number,
): Promise<{ success: boolean; error?: string;}> {
	try {
		const response = await fetch(`${API_BASE_URL}/user/${userId}/sessions/edit`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ session_id: sessionId }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return {
				success: false,
				error: errorData.error || "Failed to update user edit sessions",
			};
		}
		return {
			success: true,
		};
	} catch (err) {
		console.error("Error updating user edit sessions:", err);
		return {
			success: false,
			error: "Network error",
		};
	}
}
