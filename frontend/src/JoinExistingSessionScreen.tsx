//Package Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "react-router-dom";

//File Imports
import LargeTextForm from "./components/LargeTextForm";
import { getSessionByJoinCode } from "./utils/getSessionByJoinCode";

export default function JoinExistingSessionScreen() {
    //Search params
    const searchParams = useSearchParams();
    //State to hold name, joinCode, and errorMsg inputs
    const [name, setName] = useState(localStorage.getItem('username') || "");
    //boolean to switch view if a session is found
    const [sessionFound, setSessionFound] = useState(false);
    const [joinCode, setJoinCode] = useState(searchParams[0].get('joinCode') || "");
    const [errorMsg, setErrorMsg] = useState("");

    //Set up navigator
    const navigate = useNavigate();

    // Function to handle session search submission
    const handleSearchSession = async () => {
        try {
            console.log("Searching for session with code:", joinCode, "for user:", name);
            const sessionInfo = await getSessionByJoinCode(joinCode);
            if (sessionInfo.success && sessionInfo.session) {
                console.log("Session found:", sessionInfo.session.session_id);
                //Set sessionFound to true to switch view and display info
                setSessionFound(true);
                //Store sessionInfo session object in localStorage for use later
                localStorage.setItem("session_info", JSON.stringify(sessionInfo.session));
                console.log("Saved session_info to localStorage:", sessionInfo.session);
            } else {
                setErrorMsg(sessionInfo.error || "Failed to find session");
            }
        } catch (error) {
            console.error("Error searching for session:", error);
            setErrorMsg("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
            <div className="relative w-4/5 max-w-lg py-12 px-5 lg:px-12 bg-white shadow-lg">
                <ArrowLeft className="absolute top-4 left-4 w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />
                <h1 className="mt-4 text-2xl lg:text-3xl mb-1 text-center">Join Existing Session</h1>

                {sessionFound ? (
                    <>
                        <div className="mt-8 bg-[var(--accent-color)] p-6 rounded-lg w-full shadow-lg">
                            {/* Join Code Section */}
                            <div className="mb-3">
                                <p className="text-sm text-[var(--grey-accent-medium)] mb-0.5">Join Code</p>
                                <p className="text-3xl text-white">{localStorage.getItem('sessionJoinCode') || joinCode}</p>
                            </div>

                            {/* Session Name Section */}
                            <div className="mb-3">
                                <p className="text-sm text-[var(--grey-accent-medium)] mb-0.5">Session Name</p>
                                <p className="text-lg text-white">{JSON.parse(localStorage.getItem('session_info') || '{}').session_name || 'N/A'}</p>
                            </div>

                            {/* Teacher Name Section */}
                            <div className="mb-3">
                                <p className="text-sm text-[var(--grey-accent-medium)] mb-0.5">Teacher Name</p>
                                <p className="text-lg text-white">{JSON.parse(localStorage.getItem('session_info') || '{}').teacher_name || 'N/A'}</p>
                            </div>

                            {/* Description Section */}
                            <div className="mb-3">
                                <p className="text-sm text-[var(--grey-accent-medium)] mb-0.5">Description</p>
                                <p className="text-sm text-white">{JSON.parse(localStorage.getItem('session_info') || '{}').lesson_description || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Join button */}
                        <button className="rounded-sm bg-[var(--green-accent)] text-black py-2 px-4 w-full mt-3 cursor-pointer" onClick={() => navigate('/observation-session')}>Join Session as {name}</button>

                        {/* Cancel Button */}
                        <div className="flex justify-end mt-3">
                            <button onClick={() => setSessionFound(false)} className="rounded-sm bg-[var(--grey-accent-medium)] text-white py-2 px-4 cursor-pointer">Cancel</button>
                        </div>
                    </>
                ) : (
                    <>
                        <LargeTextForm label="Name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="mb-6 placeholder:text-[18px] lg:placeholder:text-base" />
                        <LargeTextForm label="Join Code" placeholder="Enter session join code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="mb-4 placeholder:text-[18px] lg:placeholder:text-base" />
                        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
                        <button onClick={handleSearchSession} className="mt-6 w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer">Search for session</button>
                    </>
                )}
            </div>
        </div>
    );
}
