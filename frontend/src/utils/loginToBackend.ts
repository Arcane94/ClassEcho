import { API_BASE_URL } from "../config";

  //Calls the server and sends all the data needed to log in to the user's accouunt
  export async function loginToBackend(username: string, password: string): Promise<{success: boolean; error?: string; result?: any}> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        //Return error message from backend to be printed to user
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Failed to login'
        };
      }
  
      const result = await response.json();
      return {
        success: true,
        result
      };
    } catch (err) {
      console.error('Error logging in to user\'s account:', err);
      throw err;
    }
  }
  