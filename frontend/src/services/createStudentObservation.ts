// Builds the student observation payload shape used by the create and export flows.
import type { ObservationRecordingFlag } from "../utils/observationLogging";
import { API_BASE_URL } from "../config";

// Defines the call to create a new student observation in database

export interface StudentObservationData {
    session_id: number;
    observer_id: number;
    observer_name?: string;
    client_observation_id?: string;
    student_id?: string;
    start_time?: string;
    end_time?: string;
    selected_tags?: Record<string, string[]>;
    behavior_tags?: Record<string, string[]> | string[];
    affect?: string[];
    custom_tags?: string[];
    recording: ObservationRecordingFlag;
    note?: string;
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
  
