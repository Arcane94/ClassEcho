import { API_BASE_URL } from "../config";

// Defines the call to create a new teacher observation in database

export interface TeacherObservationData {
    session_id: number;
    student_id?: string;
    start_time?: string;
    behavior_tags?: string[];
    function_tags?: string[];
    structure_tags?: string[];
    custom_tags?: string[];
    submitted_by_user?: boolean;
    recording?: boolean;
    note?: string;
    picture_attachments?: string;
    //New tag sent only to controller in server to loosen error-checking for single click observations
    single_click?: boolean; 
  }
  
  //Calls the server and sends all the data needed to create a new teacher observation
  export async function createTeacherObservation(data: TeacherObservationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/observations/teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create teacher observation');
      }
  
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error creating teacher observation:', err);
      throw err;
    }
  }
  