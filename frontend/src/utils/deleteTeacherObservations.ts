import { API_BASE_URL } from "../config";

  //Calls the server and sends all the data needed to delete a collection of student observations
  export async function deleteTeacherObservations(ids: number[]) {
    try {
    //Try to call server
      const response = await fetch(`${API_BASE_URL}/observations/teacher/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ids}),
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete teacher observations');
      }
  
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error deleting teacher observation:', err);
      throw err;
    }
  }
  