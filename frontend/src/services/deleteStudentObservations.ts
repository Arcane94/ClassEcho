// Deletes a collection of student observations through the backend bulk-delete route.
import { API_BASE_URL } from "../config";

  //Calls the server and sends all the data needed to delete a collection of student observations
  export async function deleteStudentObservations(ids: number[]) {
    try {
    //Try to call server
      const response = await fetch(`${API_BASE_URL}/observations/student/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ids}),
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete student observations');
      }
  
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error deleting student observation:', err);
      throw err;
    }
  }
  
