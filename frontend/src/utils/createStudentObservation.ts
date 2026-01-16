import { API_BASE_URL } from "../config";

// Defines the call to create a new student observation in database

export interface StudentObservationData {
    session_id: number;
    student_id?: string;
    behavior_tags?: string[];
    affect?: string[];
    custom_tags?: string[],
    submitted_by_user?: boolean;
    recording?: boolean;
    note?: string;
    picture_attachments?: string;
    on_task?: boolean;
    //New tag sent only to controller in server to loosen error-checking for single click observations
    single_click?: boolean; 
  }
  
  //Calls the server and sends all the data needed to create a new student observation
  export async function createStudentObservation(data: StudentObservationData) {
    if (data.single_click) {
      console.log(`[${new Date().toISOString()}] Creating new single tag Student observation: ${JSON.stringify(data)}`);
    } else {
      console.log(`[${new Date().toISOString()}] Creating new whole Student observation: ${JSON.stringify(data)}`);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/observations/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create student observation');
      }
  
      const result = await response.json();
      console.log(`[${new Date().toISOString()}] Observation Created`);
      return result;
    } catch (err) {
      console.error('Error creating teacher observation:', err);
      throw err;
    }
  }
  