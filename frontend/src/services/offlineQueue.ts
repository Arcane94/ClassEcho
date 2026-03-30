//File that holds all of the logic for storing teacher/student observations on local storage when their is a network issue with either server or frontend 
//and sending all observations in one mass send when connection problems are resolved.


//Import observation data objects
import type { StudentObservationData } from "./createStudentObservation";
import type { TeacherObservationData } from "./createTeacherObservation";

import { createStudentObservation } from "./createStudentObservation";
import { createTeacherObservation } from "./createTeacherObservation";
import { isServerOnline, isUserOnline } from "./networkChecks";

//Local Storage keys
const STUDENT_KEY = "pendingStudentObservations";
const TEACHER_KEY = "pendingTeacherObservations";
const MAX_FAILED_ATTEMPTS = 3;

type QueuedObservation = (StudentObservationData | TeacherObservationData) & {
    status?: "pending";
    failed_attempts?: number;
};

function removeQueueMetadata(observation: QueuedObservation): StudentObservationData | TeacherObservationData {
    const { status, failed_attempts, ...payload } = observation;
    return payload as StudentObservationData | TeacherObservationData;
}

export function storeObservationLocally(observationData: (StudentObservationData | TeacherObservationData)) {
    try {
        //Determine which type of observation this is, use studentId field since only studentObservations contain this
        const isStudentObservation = "on_task" in observationData;
        //Set storage key
        const storageKey = isStudentObservation ? STUDENT_KEY : TEACHER_KEY;

        //Get any existing entries and parse into an array
        const existingEntries = localStorage.getItem(storageKey);
        const obsArray = existingEntries ? JSON.parse(existingEntries) : [];

        //Push new observation onto array
        obsArray.push({
            ...observationData,
            status: "pending",
            failed_attempts: 0,
        })

        //Set localStorage back
        localStorage.setItem(storageKey, JSON.stringify(obsArray));

        //Log in console
        console.log(`Stored ${isStudentObservation ? 'student observation' : 'teacher observation'} in local storage.`)
    } catch (error) {
        console.log("Error occured saving observation", error);
    }
}

//Function to help to mass send all observations when connection is re-opened
async function sendAllObservationsByKey(storageKey: string) {
    //Get observations from local storage
    const obsArray: QueuedObservation[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (obsArray.length === 0) return true; //Nothing in logs to send

    //Flag to set if a error occurs while sending tags to backend
    let allSent = true;
    let index = 0;

    //Loop through the array and send observations while there are entries left
    while (index < obsArray.length) {
        const observation = obsArray[index];
        const payload = removeQueueMetadata(observation);

        try {
            //Send first observation to server
            if (storageKey === STUDENT_KEY) {
                await createStudentObservation(payload as StudentObservationData);
              } else {
                await createTeacherObservation(payload as TeacherObservationData);
              }

            //Remove this observation from the obsArray
            obsArray.splice(index, 1);
            //Reset localStorage with shortened array to ensure saved observations remain correct in case of network loss
            localStorage.setItem(storageKey, JSON.stringify(obsArray));

            //Do not increment index after splice, next item shifts into current index
        } catch (error) {
            const failedAttempts = (observation.failed_attempts ?? 0) + 1;
            allSent = false;

            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                //Remove permanently failing item so remaining observations can still flush
                obsArray.splice(index, 1);
                console.warn("Dropping queued observation after repeated failures", {
                    storageKey,
                    failedAttempts,
                    error,
                });
            } else {
                obsArray[index] = {
                    ...observation,
                    failed_attempts: failedAttempts,
                };
                index += 1;
            }

            //Persist queue updates after each failed attempt
            localStorage.setItem(storageKey, JSON.stringify(obsArray));
        }
    }
    return allSent;
}

//Exportable function that defines the logic for checking if there are local stored observations and sending to server if everything is online
export async function offlineLogging() {
    try {
        const studentLogs = JSON.parse(localStorage.getItem(STUDENT_KEY) || "[]");
        const teacherLogs = JSON.parse(localStorage.getItem(TEACHER_KEY) || "[]");

        const pendingLogs = studentLogs.length > 0 || teacherLogs.length > 0;
        if (!pendingLogs) return true // Nothing to send
        //Check if both user and server is online and try to send logs if they are
        const userOnline = isUserOnline();
        const serverOnline = await isServerOnline();

        if (!userOnline || !serverOnline) return false;

        const studentResult = await sendAllObservationsByKey(STUDENT_KEY);
        const teacherResult = await sendAllObservationsByKey(TEACHER_KEY);

        return (!studentResult || !teacherResult) ? false : true;
    } catch (err) {
        console.error("Error completing offline logging", err);
        return false;
    }
}

