// Updates the legacy observer list associated with a session.
import { API_BASE_URL } from "../config";

//Uses a given sessionId and userId to update the observers array of that session in the database
export async function updateSessionObservers(
	sessionId: string | number,
	userId: number,
): Promise<{ success: boolean; error?: string;}> {
	try {
		const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/observers`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ user_id: userId }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return {
				success: false,
				error: errorData.error || "Failed to update session observers",
			};
		}
		return {
			success: true,
		};
	} catch (err) {
		console.error("Error updating session observers:", err);
		return {
			success: false,
			error: "Network error",
		};
	}
}
