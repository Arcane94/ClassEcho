import { API_BASE_URL } from "../config";

export interface UserSummary {
  user_id: number;
  username: string;
}

export async function getUserById(userId: string | number): Promise<UserSummary | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }

      throw new Error("Failed to fetch user");
    }

    const data = await response.json();
    if (!data || typeof data.user_id !== "number" || typeof data.username !== "string") {
      return null;
    }

    return {
      user_id: data.user_id,
      username: data.username,
    };
  } catch (error) {
    console.error("Error fetching user by id:", error);
    return null;
  }
}
