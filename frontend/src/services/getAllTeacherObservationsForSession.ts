// Fetches teacher observations for a session and backfills missing observer names when needed.
import { API_BASE_URL } from "../config";
import type { TeacherObservationData } from "./createTeacherObservation";
import { getUserById } from "./getUserById";

//Calls server and retrieves all teacher observations for a given session
export async function getAllTeacherObservationsForSession(
  sessionId: string | number,
  userId?: string | number | null,
): Promise<TeacherObservationData[]> {
  try {
    const resolvedUserId = userId ?? localStorage.getItem("user_id");
    const queryString = new URLSearchParams({
      user_id: String(resolvedUserId ?? ""),
    });
    const response = await fetch(`${API_BASE_URL}/observations/teacher/session/${sessionId}?${queryString.toString()}`);

    if (!response.ok) {
      //If session could not be found, alert console
      if (response.status === 404) {
        console.warn("Session not found");
        return [];
      }
      //throw error if unexpected error occurs either in server or in API call
      throw new Error("Failed to fetch teacher observations");
    }
    
    //Save and return collected data
    const data = await response.json();
    const observations = Array.isArray(data) ? data as TeacherObservationData[] : [];
    const missingObserverIds = Array.from(
      new Set(
        observations
          .filter((observation) => !observation.observer_name && Number.isFinite(Number(observation.observer_id)))
          .map((observation) => Number(observation.observer_id)),
      ),
    );

    if (missingObserverIds.length === 0) {
      return observations;
    }

    const users = await Promise.all(missingObserverIds.map((observerId) => getUserById(observerId)));
    const observerNameMap = new Map<number, string>();

    users.forEach((user) => {
      if (user) {
        observerNameMap.set(user.user_id, user.username);
      }
    });

    return observations.map((observation) => ({
      ...observation,
      observer_name: observation.observer_name || observerNameMap.get(Number(observation.observer_id)) || "",
    }));

  } catch (error) {
    console.error("Error fetching teacher observations:", error);
    return [];
  }
}
