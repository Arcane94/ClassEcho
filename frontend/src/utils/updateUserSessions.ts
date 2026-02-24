import { API_BASE_URL } from "../config";

//Uses a given userId and sessionId to update the sessions array of that user in the database
export async function updateUserSessions(
	userId: string | number,
	sessionId: number,
): Promise<{ success: boolean; error?: string;}> {
	try {
		const response = await fetch(`${API_BASE_URL}/user/${userId}/sessions`, {
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
				error: errorData.error || "Failed to update user sessions",
			};
		}
		return {
			success: true,
		};
	} catch (err) {
		console.error("Error updating user sessions:", err);
		return {
			success: false,
			error: "Network error",
		};
	}
}
