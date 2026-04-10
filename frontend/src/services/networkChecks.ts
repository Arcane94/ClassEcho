// Lightweight connectivity check used to confirm the backend is online.
import { API_BASE_URL } from "../config";

type ServerOnlineCheckOptions = {
    signal?: AbortSignal;
};

//exportable function that checks if the user is currently online
export function isUserOnline() {
    //Check navigator
    return navigator.onLine;
}

//exportable function that calls the server check API route to see if server is currently online
export async function isServerOnline(options: ServerOnlineCheckOptions = {}) {
    try {
        //Try to call GET server check route
        const response = await fetch(`${API_BASE_URL}/sessions/check`, {
            method: "GET",
            //Make as light-weight as possible since nothing is actually being sent
            cache: "no-cache",
            signal: options.signal,
        });

        return response.ok;
    } catch(err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            return false;
        }
        //Report error
        console.error("Error Checking Server Status: ", err);
        //Return false, server is offline
        return false;
    }
}
