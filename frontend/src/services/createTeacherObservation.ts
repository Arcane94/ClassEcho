// Builds the teacher observation payload shape used by the create and export flows.
import type { ObservationRecordingFlag } from "../utils/observationLogging";
import { API_BASE_URL } from "../config";

// Defines the call to create a new teacher observation in database

export interface TeacherObservationData {
    session_id: number;
    observer_id: number;
    observer_name?: string;
    client_observation_id?: string;
    student_id?: string;
    start_time?: string;
    end_time?: string;
    teacher_position?: string;
    selected_tags?: Record<string, string[]>;
    recording: ObservationRecordingFlag;
    note?: string;
    //New tag sent only to controller in server to loosen error-checking for single click observations
    single_click?: boolean; 
  }
  
  //Calls the server and sends all the data needed to create a new teacher observation
  export async function createTeacherObservation(data: TeacherObservationData) {
    if (data.single_click) {
      console.log(`[${new Date().toISOString()}] Creating new single tag Teacher observation: ${JSON.stringify(data)}`);
    } else {
      console.log(`[${new Date().toISOString()}] Creating new whole Teacher observation: ${JSON.stringify(data)}`);
    }
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
      console.log(`[${new Date().toISOString()}] Observation Created`);
      return result;
    } catch (err) {
      console.error('Error creating teacher observation:', err);
      throw err;
    }
  }
  
