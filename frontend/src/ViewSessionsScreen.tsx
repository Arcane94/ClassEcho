import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { getAllUserSessions } from "./services/getAllUserSessions";
import type { SessionData } from "./services/fetchSessionById";

export default function ViewSessionsScreen() {
    const navigate = useNavigate();
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            const userId = localStorage.getItem("user_id");
            if (userId) {
                const userSessions = await getAllUserSessions(userId);
                setSessions(userSessions);
            }
            setLoading(false);
        };

        fetchSessions();
    }, []);

    const toggleSession = (sessionId: string) => {
        setExpandedSessions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sessionId)) {
                newSet.delete(sessionId);
            } else {
                newSet.add(sessionId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
                <div className="text-white text-xl">Loading sessions...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
            <div className="relative w-4/5 max-w-2xl h-[80vh] py-8 px-5 lg:px-8 bg-white shadow-lg flex flex-col">
                <ArrowLeft className="absolute top-4 left-4 w-6 h-6 cursor-pointer" onClick={() => navigate('/session-options')} />
                
                <h1 className="mt-8 text-2xl lg:text-3xl mb-6 text-center font-semibold">Previous Sessions</h1>

                {/* Scrollable container */}
                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <p className="text-center text-gray-500 mt-4">No sessions found</p>
                    ) : (
                        sessions.map((session, index) => (
                        <div key={session.session_id} className={`mb-0 ${index === 0 ? 'border-t border-black' : ''}`}>
                            {/* Session header row - clickable bar with session name and dropdown when collapsed */}
                            {!expandedSessions.has(session.session_id) && (
                                <div
                                    className="py-4 px-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between border-b border-black"
                                    onClick={() => toggleSession(session.session_id)}
                                >
                                    <h2 className="text-lg font-medium">{session.lesson_name}</h2>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            )}

                            {/* Expanded session details */}
                            {expandedSessions.has(session.session_id) && (
                                <div className="p-6 bg-white border-b border-black">
                                    {/* Session Name Section with dropdown icon */}
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-0.5">Session Name</p>
                                            <p className="text-lg text-black">{session.lesson_name}</p>
                                        </div>
                                        <div className="ml-4 mt-1 cursor-pointer" onClick={() => toggleSession(session.session_id)}>
                                            <ChevronUp className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Teacher Name Section */}
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-600 mb-0.5">Teacher Name</p>
                                        <p className="text-lg text-black">{session.teacher_name}</p>
                                    </div>

                                    {/* Description Section */}
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-0.5">Description</p>
                                        <p className="text-sm text-black">{session.lesson_description || 'N/A'}</p>
                                    </div>

                                    {/* Rejoin Session Button */}
                                    <button 
                                        className="w-full bg-[var(--green-accent)] text-black py-2 px-4 rounded-sm cursor-pointer hover:opacity-90"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Rejoin session:', session.session_id);
                                            //Navigate to the join-existing screen and save join code in search params
                                            navigate(`/join-existing?joinCode=${session.join_code}`);
                                        }}
                                    >
                                        Rejoin Session
                                    </button>
                                </div>
                            )}
                        </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
