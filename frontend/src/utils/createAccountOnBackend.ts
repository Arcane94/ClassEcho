import { API_BASE_URL } from "../config";

// Calls the server and sends all the data needed to create a user's account
export async function createAccountOnBackend(username: string, email: string, password: string): Promise<{success: boolean; error?: string; result?: any}> {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to create account",
      };
    }

    const result = await response.json();
    return {
      success: true,
      result,
    };
  } catch (err) {
    console.error("Error creating user's account:", err);
    return {
      success: false,
      error: "Network error",
    };
  }
}
