import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { getAllUserEditSessions } from "./utils/getAllUserEditSessions";
import type { SessionData } from "./utils/fetchSessionById";
import { updateSessionInfo } from "./utils/updateSessionInfo";
import { deleteSession } from "./utils/deleteSession";
import { exportStudentObservationsToCSV } from "./utils/exportStudentObservationsToCSV";
import { exportTeacherObservationsToCSV } from "./utils/exportTeacherObservationsToCSV";

export default function ManageSessionsScreen() {
    const navigate = useNavigate();
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [controlPanelSession, setControlPanelSession] = useState<SessionData | null>(null);
    const [observerName, setObserverName] = useState("");
    const [teacherName, setTeacherName] = useState("");
    const [sessionName, setSessionName] = useState("");
    const [lessonDescription, setLessonDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isControlSaving, setIsControlSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [controlPanelStatus, setControlPanelStatus] = useState("");
    const [exportingSessionId, setExportingSessionId] = useState<string | null>(null);
    const [exportingType, setExportingType] = useState<"teacher" | "student" | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            const userId = localStorage.getItem("user_id");
            if (userId) {
                const userEditSessions = await getAllUserEditSessions(userId);
                setSessions(userEditSessions);
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

    const openControlPanel = (session: SessionData) => {
        setControlPanelSession(session);
        setObserverName(session.observer_name || "");
        setTeacherName(session.teacher_name || "");
        setSessionName(session.lesson_name || "");
        setLessonDescription(session.lesson_description || "");
        setJoinCode(session.join_code || "");
        setControlPanelStatus("");
    };

    const closeControlPanel = () => {
        if (isControlSaving || isDeleting) {
            return;
        }
        setControlPanelSession(null);
        setControlPanelStatus("");
    };

    const handleSaveControlPanel = async () => {
        if (!controlPanelSession) {
            return;
        }

        setIsControlSaving(true);
        setControlPanelStatus("");

        const result = await updateSessionInfo(controlPanelSession.session_id, {
            observer_name: observerName,
            teacher_name: teacherName,
            session_name: sessionName,
            lesson_description: lessonDescription,
            join_code: joinCode,
        });

        if (!result.success) {
            setControlPanelStatus(result.error || "Failed to update session info");
            setIsControlSaving(false);
            return;
        }

        setSessions(prev => prev.map(session => (
            session.session_id === controlPanelSession.session_id
                ? {
                    ...session,
                    observer_name: observerName,
                    teacher_name: teacherName,
                    lesson_name: sessionName,
                    lesson_description: lessonDescription,
                    join_code: joinCode,
                }
                : session
        )));

        setControlPanelStatus("Session info updated");
        setIsControlSaving(false);
        setControlPanelSession(null);
    };

    const handleDeleteSession = async () => {
        if (!controlPanelSession) {
            return;
        }

        const confirmed = window.confirm("Delete this session permanently?");
        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        setControlPanelStatus("");

        const result = await deleteSession(controlPanelSession.session_id);

        if (!result.success) {
            setControlPanelStatus(result.error || "Failed to delete session");
            setIsDeleting(false);
            return;
        }

        setSessions(prev => prev.filter(session => session.session_id !== controlPanelSession.session_id));
        setExpandedSessions(prev => {
            const newSet = new Set(prev);
            newSet.delete(controlPanelSession.session_id);
            return newSet;
        });

        setIsDeleting(false);
        setControlPanelSession(null);
    };

    const handleExportTeacherCSV = async (sessionId: string) => {
        setExportingSessionId(sessionId);
        setExportingType("teacher");
        await exportTeacherObservationsToCSV(sessionId);
        setExportingSessionId(null);
        setExportingType(null);
    };

    const handleExportStudentCSV = async (sessionId: string) => {
        setExportingSessionId(sessionId);
        setExportingType("student");
        await exportStudentObservationsToCSV(sessionId);
        setExportingSessionId(null);
        setExportingType(null);
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
                <ArrowLeft className="absolute top-4 left-4 w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />
                
                <h1 className="mt-8 text-2xl lg:text-3xl mb-6 text-center font-semibold">Manage Your Sessions</h1>

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
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600 mb-0.5">Session Name</p>
                                                    <p className="text-lg text-black">{session.lesson_name}</p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-sm text-gray-600 mb-0.5">Teacher Name</p>
                                                <p className="text-lg text-black">{session.teacher_name}</p>
                                            </div>
                                        </div>

                                        <div className="mt-1 cursor-pointer self-start" onClick={() => toggleSession(session.session_id)}>
                                            <ChevronUp className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Description Section */}
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-0.5">Description</p>
                                        <p className="text-sm text-black">{session.lesson_description || 'N/A'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            className="w-full bg-[var(--accent-color)] text-white py-2 px-4 rounded-sm cursor-pointer hover:opacity-90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openControlPanel(session);
                                            }}
                                        >
                                            Update Session Info
                                        </button>
                                        <button 
                                            className="w-full bg-[var(--green-accent)] text-black py-2 px-4 rounded-sm cursor-pointer hover:opacity-90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/manage-session?sessionId=${session.session_id}`);
                                            }}
                                        >
                                            Manage Session Tags
                                        </button>
                                    </div>

                                    <div className="mt-3 pt-2 flex flex-wrap gap-2 justify-end border-t border-gray-200">
                                        <button
                                            className="bg-[var(--accent-color)] text-white py-1.5 px-2.5 rounded-sm cursor-pointer hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-1.5 text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportTeacherCSV(session.session_id);
                                            }}
                                            disabled={exportingSessionId === session.session_id && exportingType !== null}
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{exportingSessionId === session.session_id && exportingType === "teacher" ? "Exporting..." : "Export Teacher CSV"}</span>
                                        </button>
                                        <button
                                            className="bg-[var(--green-accent)] text-black py-1.5 px-2.5 rounded-sm cursor-pointer hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-1.5 text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportStudentCSV(session.session_id);
                                            }}
                                            disabled={exportingSessionId === session.session_id && exportingType !== null}
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{exportingSessionId === session.session_id && exportingType === "student" ? "Exporting..." : "Export Student CSV"}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        ))
                    )}
                </div>
            </div>

            {controlPanelSession && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center z-50 px-4">
                    <div className="w-full max-w-[600px] bg-white p-4">
                        <p className="text-xl mb-4">Session Control Panel</p>

                        <div className="mb-3">
                            <label className="block text-sm mb-1">Name</label>
                            <input
                                value={observerName}
                                onChange={(e) => setObserverName(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm mb-1">Teacher Name</label>
                            <input
                                value={teacherName}
                                onChange={(e) => setTeacherName(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm mb-1">Session Name</label>
                            <input
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm mb-1">Lesson Description</label>
                            <textarea
                                value={lessonDescription}
                                onChange={(e) => setLessonDescription(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-sm h-24 resize-none"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm mb-1">Join Code</label>
                            <input
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
                            />
                        </div>

                        {controlPanelStatus && (
                            <p className="text-sm text-[var(--accent-color)] mb-3">{controlPanelStatus}</p>
                        )}

                        <div className="flex flex-wrap gap-2 justify-end">
                            <button
                                onClick={closeControlPanel}
                                className="border-1 border-[var(--grey-accent)] p-2 cursor-pointer"
                                disabled={isControlSaving || isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveControlPanel}
                                disabled={isControlSaving || isDeleting}
                                className="bg-[var(--medium-blue-accent)] text-white p-2 cursor-pointer disabled:opacity-70"
                            >
                                {isControlSaving ? "Saving..." : "Save Session Info"}
                            </button>
                            <button
                                onClick={handleDeleteSession}
                                disabled={isDeleting || isControlSaving}
                                className="bg-red-500 text-white p-2 cursor-pointer disabled:opacity-70"
                            >
                                {isDeleting ? "Deleting..." : "Delete Session"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
