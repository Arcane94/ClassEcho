// Offline queue for storing observation events locally until connectivity returns.


//Import observation data objects
import type { StudentObservationData } from "./createStudentObservation";
import type { TeacherObservationData } from "./createTeacherObservation";

import { createStudentObservation } from "./createStudentObservation";
import { createTeacherObservation } from "./createTeacherObservation";
import { isServerOnline, isUserOnline } from "./networkChecks";
import {
    buildObservationClientId,
    getStoredObserverId,
    normalizeObservationPayloadTiming,
} from "../utils/observationLogging";

//Local Storage keys
const STUDENT_KEY = "pendingStudentObservations";
const TEACHER_KEY = "pendingTeacherObservations";
const MAX_FAILED_ATTEMPTS = 3;
const FLUSH_INTERVAL_MS = 15000;
const CONNECTIVITY_CHECK_TIMEOUT_MS = 5000;
const OBSERVATION_SEND_TIMEOUT_MS = 10000;
let activeFlushPromise: Promise<boolean> | null = null;
let syncRegistrationCount = 0;
let syncIntervalId: number | null = null;

function triggerOfflineQueueFlush() {
    void offlineLogging();
}

function handleOfflineQueueVisibilityChange() {
    if (document.visibilityState === "visible") {
        triggerOfflineQueueFlush();
    }
}

function attachOfflineQueueSync() {
    if (typeof window === "undefined") {
        return;
    }

    if (syncRegistrationCount === 0) {
        window.addEventListener("online", triggerOfflineQueueFlush);
        window.addEventListener("focus", triggerOfflineQueueFlush);
        document.addEventListener("visibilitychange", handleOfflineQueueVisibilityChange);
        syncIntervalId = window.setInterval(triggerOfflineQueueFlush, FLUSH_INTERVAL_MS);
        triggerOfflineQueueFlush();
    }

    syncRegistrationCount += 1;
}

function detachOfflineQueueSync() {
    if (typeof window === "undefined" || syncRegistrationCount === 0) {
        return;
    }

    syncRegistrationCount -= 1;

    if (syncRegistrationCount > 0) {
        return;
    }

    window.removeEventListener("online", triggerOfflineQueueFlush);
    window.removeEventListener("focus", triggerOfflineQueueFlush);
    document.removeEventListener("visibilitychange", handleOfflineQueueVisibilityChange);

    if (syncIntervalId !== null) {
        window.clearInterval(syncIntervalId);
        syncIntervalId = null;
    }
}

type QueuedObservation = (StudentObservationData | TeacherObservationData) & {
    queue_id?: string;
    status?: "pending";
    failed_attempts?: number;
};

function generateQueueId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getObservationClientId(observation: QueuedObservation) {
    if ("client_observation_id" in observation && typeof observation.client_observation_id === "string" && observation.client_observation_id.trim()) {
        return observation.client_observation_id.trim();
    }

    return buildObservationClientId();
}

function normalizeQueuedObservation(observation: QueuedObservation): QueuedObservation {
    const observerId = "observer_id" in observation && typeof observation.observer_id === "number"
        ? observation.observer_id
        : getStoredObserverId();
    const normalizedObservation = normalizeObservationPayloadTiming(observation);
    const clientObservationId = getObservationClientId(observation);

    return {
        ...normalizedObservation,
        observer_id: observerId ?? 0,
        client_observation_id: clientObservationId,
        queue_id: observation.queue_id ?? clientObservationId ?? generateQueueId(),
        status: "pending",
        failed_attempts: observation.failed_attempts ?? 0,
    };
}

function readQueuedObservations(storageKey: string): QueuedObservation[] {
    const storedEntries = localStorage.getItem(storageKey);
    const parsedEntries: QueuedObservation[] = storedEntries ? JSON.parse(storedEntries) : [];
    const normalizedEntries = parsedEntries.map(normalizeQueuedObservation);

    if (JSON.stringify(parsedEntries) !== JSON.stringify(normalizedEntries)) {
        localStorage.setItem(storageKey, JSON.stringify(normalizedEntries));
    }

    return normalizedEntries;
}

function writeQueuedObservations(storageKey: string, observations: QueuedObservation[]) {
    localStorage.setItem(storageKey, JSON.stringify(observations));
}

function removeQueueMetadata(observation: QueuedObservation): StudentObservationData | TeacherObservationData {
    const payload = { ...observation };
    delete payload.queue_id;
    delete payload.status;
    delete payload.failed_attempts;
    return payload as StudentObservationData | TeacherObservationData;
}

function isAbortLikeError(error: unknown) {
    return error instanceof DOMException && error.name === "AbortError";
}

function isTransientQueueError(error: unknown) {
    if (isAbortLikeError(error)) {
        return true;
    }

    if (error instanceof TypeError) {
        return true;
    }

    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();
    return message.includes("network")
        || message.includes("failed to fetch")
        || message.includes("load failed")
        || message.includes("timeout");
}

async function runWithTimeout<T>(
    action: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number,
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await action(controller.signal);
    } finally {
        window.clearTimeout(timeoutId);
    }
}

async function sendQueuedObservation(storageKey: string, payload: StudentObservationData | TeacherObservationData) {
    return runWithTimeout(async (signal) => {
        if (storageKey === STUDENT_KEY) {
            return createStudentObservation(payload as StudentObservationData, { signal });
        }

        return createTeacherObservation(payload as TeacherObservationData, { signal });
    }, OBSERVATION_SEND_TIMEOUT_MS);
}

export function storeObservationLocally(observationData: (StudentObservationData | TeacherObservationData)) {
    try {
        //Determine which type of observation this is, use studentId field since only studentObservations contain this
        const isStudentObservation = "on_task" in observationData;
        //Set storage key
        const storageKey = isStudentObservation ? STUDENT_KEY : TEACHER_KEY;

        //Get any existing entries and parse into an array
        const obsArray = readQueuedObservations(storageKey);
        const normalizedObservation = normalizeQueuedObservation(observationData);
        const existingObservationIndex = obsArray.findIndex(
            (queuedObservation) => queuedObservation.client_observation_id === normalizedObservation.client_observation_id,
        );

        if (existingObservationIndex === -1) {
            obsArray.push(normalizedObservation);
        } else {
            obsArray[existingObservationIndex] = {
                ...obsArray[existingObservationIndex],
                ...normalizedObservation,
            };
        }

        //Set localStorage back
        writeQueuedObservations(storageKey, obsArray);

        //Log in console
        console.log(`Stored ${isStudentObservation ? 'student observation' : 'teacher observation'} in local storage.`)

        if (isUserOnline()) {
            triggerOfflineQueueFlush();
        }
    } catch (error) {
        console.log("Error occured saving observation", error);
    }
}

//Function to help to mass send all observations when connection is re-opened
async function sendAllObservationsByKey(storageKey: string) {
    //Get observations from local storage
    const obsArray = readQueuedObservations(storageKey);
    if (obsArray.length === 0) return true; //Nothing in logs to send

    //Flag to set if a error occurs while sending tags to backend
    let allSent = true;

    for (const observation of obsArray) {
        const payload = removeQueueMetadata(observation);

        try {
            //Send first observation to server
            await sendQueuedObservation(storageKey, payload);

            const latestQueue = readQueuedObservations(storageKey);
            writeQueuedObservations(
                storageKey,
                latestQueue.filter((queuedObservation) => queuedObservation.queue_id !== observation.queue_id),
            );
        } catch (error) {
            allSent = false;
            if (isTransientQueueError(error)) {
                console.warn("Deferred queued observation flush until connectivity stabilizes.", {
                    storageKey,
                    error,
                });
                return false;
            }

            const latestQueue = readQueuedObservations(storageKey);
            const matchingIndex = latestQueue.findIndex(
                (queuedObservation) => queuedObservation.queue_id === observation.queue_id,
            );

            if (matchingIndex === -1) {
                continue;
            }

            const failedAttempts = (latestQueue[matchingIndex].failed_attempts ?? 0) + 1;

            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                //Remove permanently failing item so remaining observations can still flush
                latestQueue.splice(matchingIndex, 1);
                console.warn("Dropping queued observation after repeated failures", {
                    storageKey,
                    failedAttempts,
                    error,
                });
            } else {
                latestQueue[matchingIndex] = {
                    ...latestQueue[matchingIndex],
                    failed_attempts: failedAttempts,
                };
            }

            //Persist queue updates after each failed attempt
            writeQueuedObservations(storageKey, latestQueue);
        }
    }
    return allSent;
}

//Exportable function that defines the logic for checking if there are local stored observations and sending to server if everything is online
export async function offlineLogging() {
    if (activeFlushPromise) {
        return activeFlushPromise;
    }

    activeFlushPromise = (async () => {
        try {
            const studentLogs = readQueuedObservations(STUDENT_KEY);
            const teacherLogs = readQueuedObservations(TEACHER_KEY);

            const pendingLogs = studentLogs.length > 0 || teacherLogs.length > 0;
            if (!pendingLogs) return true; // Nothing to send
            //Check if both user and server is online and try to send logs if they are
            const userOnline = isUserOnline();
            if (!userOnline) return false;

            const serverOnline = await runWithTimeout(
                (signal) => isServerOnline({ signal }),
                CONNECTIVITY_CHECK_TIMEOUT_MS,
            ).catch((error) => {
                if (!isTransientQueueError(error)) {
                    throw error;
                }

                console.warn("Skipping offline queue flush because the backend is still unreachable.", error);
                return false;
            });

            if (!serverOnline) return false;

            const studentResult = await sendAllObservationsByKey(STUDENT_KEY);
            const teacherResult = await sendAllObservationsByKey(TEACHER_KEY);

            return (!studentResult || !teacherResult) ? false : true;
        } catch (err) {
            console.error("Error completing offline logging", err);
            return false;
        } finally {
            activeFlushPromise = null;
        }
    })();

    return activeFlushPromise;
}

export function registerOfflineQueueSync() {
    attachOfflineQueueSync();

    return () => {
        detachOfflineQueueSync();
    };
}
