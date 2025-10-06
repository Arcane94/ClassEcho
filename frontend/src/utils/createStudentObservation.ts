// Defines the call to create a new student observation in database

export interface StudentObservationData {
    session_id: number;
    student_id?: string;
    behavior_tags?: string[];
    affect?: string[];
    submitted_by_user?: boolean;
    recording?: boolean;
    note?: string;
    picture_attachments?: string;
    //New tag sent only to controller in server to loosen error-checking for single click observations
    single_click?: boolean; 
  }
  
  //Calls the server and sends all the data needed to create a new student observation
  export async function createStudentObservation(data: StudentObservationData) {
    try {
      const response = await fetch('http://localhost:3011/observations/student', {
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
      return result;
    } catch (err) {
      console.error('Error creating teacher observation:', err);
      throw err;
    }
  }
  