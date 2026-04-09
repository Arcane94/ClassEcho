//First pull all session info using the join code
// Live observation screen used to record teacher and student events during a session.
import { ArrowLeft, CircleCheckBig } from "lucide-react";
import { useEffect, useState } from "react";
import studentSendFormSvg from "@/assets/images/student_send_form.svg";
import invalidSendFormSvg from "@/assets/images/invalid_send_form.svg";
import deleteRecordingSvg from "@/assets/images/delete_recording.svg";
import startRecordPng from "@/assets/images/start_recording.png";
import stopRecordSvg from "@/assets/images/stop_recording.svg";
import { useNavigate } from "react-router-dom";
import AddTagModal from "@/components/Modal/AddTagModal";
import ObservationSegmentedTabs from "@/features/observation-mode/components/ObservationSegmentedTabs";
import ObservationInfoButton from "@/features/observation-mode/components/ObservationInfoButton";
import ObservationSelectableTagSection from "@/features/observation-mode/components/ObservationSelectableTagSection";
import ObservationTextField from "@/features/observation-mode/components/ObservationTextField";
import {
    OBSERVATION_PAGE_TITLE,
    getObservationSessionSectionSubtitle,
} from "@/features/observation-mode/config/observationCopy";
import { formatToMonthDayHourMinute } from "@/utils/formatToMonthDayHourMinute";
import { createTeacherObservation } from "@/services/createTeacherObservation";
import { createStudentObservation } from "@/services/createStudentObservation";
import type { SessionSectionInfo } from "@/services/getSessionSectionInfo";
import type { SessionInfo } from "@/services/getSessionByJoinCode";
import OfflineIndicator from "@/components/Status/OfflineIndicator";
import { getSessionSectionInfo } from "@/services/getSessionSectionInfo";
import { normalizeStudentIdForSubmission, sanitizeStudentIdInput } from "@/utils/studentIdFormatting";


//Affect Icon Svg Imports 
import angryAffectIcon from "@/assets/images/angry_affect.svg";
import boredAffectIcon from "@/assets/images/bored_affect.svg";
import confusedAffectIcon from "@/assets/images/confused_affect.svg";
import excitedAffectIcon from "@/assets/images/excited_affect.svg";
import frustratedAffectIcon from "@/assets/images/frustrated_affect.svg";
import happyAffectIcon from "@/assets/images/happy_affect.svg";
import relaxedAffectIcon from "@/assets/images/relaxed_affect.svg";
import tiredAffectIcon from "@/assets/images/tired_affect.svg";
import sadAffectIcon from "@/assets/images/sad_affect.svg";

import { storeObservationLocally, offlineLogging } from "@/services/offlineQueue";
import { updateSessionObservers } from "@/services/updateSessionObservers";
import { updateUserSessions } from "@/services/updateUserSessions";
import { buildObservationClientId, buildObservationWindow, getStoredObserverId } from "@/utils/observationLogging";

//Defines the behavior and design of the screen allowing users to make observations on both teachers an students
export default function ObservationSessionPage() {

    //Navigator
    const navigator = useNavigate();

    //Helper function to leave observation and clear session-scoped observer override
    const handleExitObservation = () => {
        localStorage.removeItem('custom_username');
        navigator('/session-options');
    };

    //Page-load timestamp used for Joined label
    const [joinedAt] = useState<string>(() => new Date().toISOString());

    //Flag to store if the joined session's observer array has been updated with this user's id and if the user's sessions array has been updated with this session's id
    const [sessionJoinLogged, setSessionJoinLogged] = useState(false);

    //State to store id of the user
    const [userId, setUserId] = useState<string | null>(null);

    //State to store sessionInfo for this session, stored together as this should not change
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

    //State to store the section info for the teacher observation side of the session
    const [teacherSections, setTeacherSections] = useState<SessionSectionInfo[]>([]);

    //State to store the section info for the student observation side of the session
    const [studentSections, setStudentSections] = useState<SessionSectionInfo[]>([]);

    //State to store the category, if any, that the add tag modal is opened for
    const [AddTagModalString, setAddTagModalString] = useState('');

    //State to store custom tags keyed by section key (teacher:<section> or student:<section>)
    const [customTags, setCustomTags] = useState<Map<string, string[]>>(new Map());

    //State to store if a student is on task (if false assume off task)
    const [isStudentOnTask, setIsStudentOnTask] = useState(true);

    //State to store if user is observing a teacher (serves as a way to switch between student and teacher screens)
    const [observingTeacher, setObservingTeacher] = useState(true);

    //State to store if the user is currently recording a task on teacher obsrvation side
    const [isRecordingTeacherObs, setIsRecordingTeacherObs] = useState(false);

    //State to store if the user is currently recording a task on student observation side
    const [isRecordingStudentObs, setIsRecordingStudentObs] = useState(false);

    //State to guard recording toolbar actions while async work is in flight
    const [isRecordingActionPending, setIsRecordingActionPending] = useState(false);

    //State to store which action button should briefly show a success checkmark
    const [recentSuccessAction, setRecentSuccessAction] = useState<{ type: "record" | "submit"; token: number } | null>(null);

    //State to store when the current recording started so offline replays keep the original timestamp
    const [recordingStartedAt, setRecordingStartedAt] = useState<string | null>(null);

    //State to store potential extra notes from teacherObsrvation
    const [extraTeacherNote, setExtraTeacherNote] = useState("");

     //State to store potential extra notes from studentObsrvation
     const [extraStudentNote, setExtraStudentNote] = useState("");

    //State to store selected behavior tag class
    const [behaviorClass, setBehaviorClass] = useState('');

    //State to store the selected tags for teacher observation
    const [selectedTeacherTags, setSelectedTeacherTags] = useState<Record<string, string[]>>({});

    //State to store the selected behavior tags for student observation
    const [selectedStudentTags, setSelectedStudentTags] = useState<Record<string, string[]>>({});

    //State to store selected student affect tags
    const [selectedAffectTags, setSelectedAffectTags] = useState<string[]>([]);

    //State to store student ID(s) from teacher side
    const [teacherObsStudentId, setTeacherObsStudentId] = useState('');

    //State to store student ID(s) from student side
    const [studentObsStudentId, setStudentObsStudentId] = useState('');

    //Constant List of Teacher Position Tags
    const teacherPositionTags = ["By Student", "At Front", "On LMS", "Walking"];

    //Constant List of Student Emotion Affects
    const studentAffects = ["Excited", "Suprised", "Happy", "Relaxed", "Tired", "Bored", "Sad", "Confused", "Frustrated", "Angry", "Focused", "Unfocused"];

    //Constant List of Student Emotion Affect Icons
    const studentAffectIcons = [excitedAffectIcon, excitedAffectIcon, happyAffectIcon, relaxedAffectIcon, tiredAffectIcon, boredAffectIcon, sadAffectIcon, confusedAffectIcon, frustratedAffectIcon, angryAffectIcon, happyAffectIcon, boredAffectIcon];

    //Session id pulled from url (used for server call)
    const [sessionId, setSessionId] = useState(0);

    //UseEffect statement to be triggered when sessionId is populated, triggers two API calls to update user and session information in database
    useEffect(() => {
        const logSessionJoin = async () => {
            if (sessionId && userId && !sessionJoinLogged) {
                try {
                    //Call util functions to update both user and session information in database with this join
                    await updateSessionObservers(sessionId, Number(userId));
                    await updateUserSessions(Number(userId), sessionId);
                    console.log(`Logged session join for user ${userId} and session ${sessionId}`);
                    setSessionJoinLogged(true);
                } catch (error) {
                    console.error("Error logging session join:", error);
                }
            }
        };
        logSessionJoin();
    }, [sessionId, sessionJoinLogged, userId]);
                    
    //UseEffect statement to be triggered on component load that pulls the session information from local storage and saves it 
    useEffect(() => {
        //Pull the user id from local storage
        const userId = localStorage.getItem("user_id");
        //Set user id state
        setUserId(userId ? userId : null);
        //Pull the saved session information from local storage 
        const sessionInfo = localStorage.getItem("session_info");
        //Ensure the sessionInfo exists before continuing
        if (sessionInfo) {
            try {
                //Parse the session information but into it's original form and save it in the SessionInfo type
                const parsedSessionInfo = JSON.parse(sessionInfo);
                parsedSessionInfo.student_id_numeric_only = Boolean(Number(parsedSessionInfo.student_id_numeric_only ?? 0));
                console.log("Loaded session_info from localStorage:", parsedSessionInfo);
                setSessionInfo(parsedSessionInfo);
            } catch (error) {
                console.error("Error parsing session info from localStorage:", error);
            }
        }
    }, []);

    //UseEffect statement that fires once sessionInfo has been pulled and saved, retrieves the section info for this session 
    useEffect(() => {
        //Ensure sessionInfo exists and has a session_id before trying to pull section info
        if (sessionInfo) {
            const fetchSessionSections = async () => {
                try {
                    //Retrieve session sections using session id and save in state
                    const sections = await getSessionSectionInfo(String(sessionInfo.session_id));
                    //If sections is null, set to empty array to avoid errors
                    if (sections == null) {
                        setTeacherSections([]);
                        setStudentSections([]);
                    } else {
                        //Set session id state
                        setSessionId(sessionInfo.session_id);
                        //Otherwise delegate to the separator function to split the sections and set state
                        separateSectionsBySector(sections);
                    }
                } catch (error) {
                    console.error("Error fetching session sections:", error);
                }
            };
            fetchSessionSections();
        }
    }, [sessionInfo]);

    const studentIdNumericOnly = Boolean(sessionInfo?.student_id_numeric_only);

    useEffect(() => {
        setTeacherObsStudentId((previous) => sanitizeStudentIdInput(previous, studentIdNumericOnly));
        setStudentObsStudentId((previous) => sanitizeStudentIdInput(previous, studentIdNumericOnly));
    }, [studentIdNumericOnly]);

    //UseEffect to monitor local logs that have been stored when service is offline and send all logs to server when connection is restored
    useEffect(() => {
        //Safety flag to avoid changes on unmount
        let isMounted = true;

        //Async function to use offlineLogging method
        const sendLogs = async () => {
            if (!isMounted) return;

            try {
                await offlineLogging();
            } catch (err) {
                console.error("Error in offline logging:", err);
            }
        };

        //Run function immediately
        sendLogs();

        //Set time interval
        const interval = setInterval(sendLogs, 15000);

        //Cleanup unmount
        return () => {
            isMounted = false;
            clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        if (!recentSuccessAction) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setRecentSuccessAction(null);
        }, 2200);

        return () => window.clearTimeout(timeoutId);
    }, [recentSuccessAction]);

    //Helper function to toggle a student tag in the selectedStudentTags state
    const toggleStudentTag = (sectionName: string, tag: string) => {
        setSelectedStudentTags(prev => {
            const sectionTags = prev[sectionName] || [];
            if (sectionTags.includes(tag)) {
                return {
                    ...prev,
                    [sectionName]: sectionTags.filter(t => t !== tag)
                };
            } else {
                return {
                    ...prev,
                    [sectionName]: [...sectionTags, tag]
                };
            }
        });
    };

    //Helper function to toggle a teacher tag in the selectedStructureTags state
    const toggleTeacherTag = (sectionName: string, tag: string) => {
        setSelectedTeacherTags(prev => {
            const sectionTags = prev[sectionName] || [];
            if (sectionTags.includes(tag)) {
                return {
                    ...prev,
                    [sectionName]: sectionTags.filter(t => t !== tag)
                };
            } else {
                return {
                    ...prev,
                    [sectionName]: [...sectionTags, tag]
                };
            }
        });
    };    

    //Helper function that takes all of the session section info and splits it depending on whether the session sector is Teacher or Student
    const separateSectionsBySector = (sectionInfo: SessionSectionInfo[]) => {
        //Filter out all teacherSections and set the teacherSections state to this array
        const teacherSections = sectionInfo.filter(section => section.session_sector === 'Teacher');
        setTeacherSections(teacherSections);
        //Filter out all studentSections and set the studentSections state to this array
        const studentSections = sectionInfo.filter(section => section.session_sector === 'Student');
        setStudentSections(studentSections);
    };
    
    //Helper function that toggles a string in a useState array for selecting tags
    const toggleStringInArray = (array: string[], item: string): string[] => {
        if (array.includes(item)) {
          return array.filter(i => i !== item);
        } else {
          return [...array, item];
        }
      };

    //Builds the key used to store custom tags for teacher/student section pairs
    const buildCustomTagKey = (isTeacherSection: boolean, sectionName: string): string => {
        return `${isTeacherSection ? 'teacher' : 'student'}:${sectionName}`;
    };

    //Returns the current custom tags for a teacher/student section
    const getCustomTagsForSection = (isTeacherSection: boolean, sectionName: string): string[] => {
        return customTags.get(buildCustomTagKey(isTeacherSection, sectionName)) || [];
    };

    //Adds a custom tag to local state only (does not add tag definitions to database)
    const addCustomTag = (key: string, value: string) => {
        const cleanedValue = value.trim();
        if (!cleanedValue) {
            return;
        }

        setCustomTags(prevTags => {
            const updatedTags = new Map(prevTags);
            const existingTags = updatedTags.get(key) || [];

            if (!existingTags.includes(cleanedValue)) {
                updatedTags.set(key, [...existingTags, cleanedValue]);
            }

            return updatedTags;
        });

        console.log(`[${new Date().toISOString()}] Added custom tag "${cleanedValue}" to ${key}`);
    };
  
    //Helper function to determine if a tag is selected in the selected teacher tags state
    const isTeacherTagSelected = (sectionName: string, tag: string): boolean => {
        const sectionTags = selectedTeacherTags[sectionName] || [];
        return sectionTags.includes(tag);
    };

    //Helper function to determine if a tag is selected in the selected student tags state
    const isStudentTagSelected = (sectionName: string, tag: string): boolean => {
        const sectionTags = selectedStudentTags[sectionName] || [];
        return sectionTags.includes(tag);
    };

    const compactSelectedSectionTags = (sections: Record<string, string[]>): Record<string, string[]> => {
        return Object.fromEntries(
            Object.entries(sections).filter(([, tags]) => tags.length > 0),
        );
    };

    const hasTeacherObservationContent = (): boolean => {
        return Boolean(behaviorClass)
            || Object.keys(compactSelectedSectionTags(selectedTeacherTags)).length > 0
            || extraTeacherNote.trim().length > 0;
    };

    const hasStudentObservationContent = (): boolean => {
        return Object.keys(compactSelectedSectionTags(selectedStudentTags)).length > 0
            || selectedAffectTags.length > 0
            || extraStudentNote.trim().length > 0;
    };

    //Helper function to clear all user selections when a observation is submitted
    const clearUserSelections = () => {
        if (observingTeacher) {
            setExtraTeacherNote('');
            setBehaviorClass('');
            setSelectedTeacherTags({});
            setTeacherObsStudentId('');
        } else {
            setExtraStudentNote('');
            setSelectedStudentTags({});
            setSelectedAffectTags([]);
            setIsStudentOnTask(true);
            setStudentObsStudentId('');
        }
    }

    //Helper function to handle a teacher position tag click with some added logging
    const handleTeacherPositionTagClick = (tag: string) => {
        setBehaviorClass(tag);
        console.log(`[${new Date().toISOString()}] Setting teacher position to ${tag}`);
    };

    //Helper function to send teacher observation info to server when the form is officially submitted
    const handleTeacherObservationSubmit = async (sustained = false) => {
        if (!hasTeacherObservationContent()) {
            return false;
        }

        if (!sessionInfo?.session_id || sessionInfo.session_id === 0) {
            console.error("Cannot submit teacher observation: invalid session_id", sessionInfo);
            return false;
        }

        const observerId = getStoredObserverId();
        if (!observerId) {
            console.error("Cannot submit teacher observation: missing observer_id");
            return false;
        }

        const observationWindow = buildObservationWindow({
            sustained,
            recordingStartedAt,
        });
        const normalizedTeacherStudentId = normalizeStudentIdForSubmission(teacherObsStudentId, studentIdNumericOnly);

        const teacherObsData = {
            session_id: sessionInfo?.session_id,
            observer_id: observerId,
            client_observation_id: buildObservationClientId(),
            start_time: observationWindow.start_time,
            end_time: observationWindow.end_time,
            student_id: normalizedTeacherStudentId,
            teacher_position: behaviorClass,
            selected_tags: compactSelectedSectionTags(selectedTeacherTags),
            note: extraTeacherNote.trim(),
            single_click: false,
            recording: observationWindow.recording,
        };
        try {
            await createTeacherObservation(teacherObsData);
            clearUserSelections();
            return true;
        } catch (error) {
            console.error('Failed to submit teacher observation', error);
            console.log('Adding Teacher Observation to waiting logs.');
            storeObservationLocally(teacherObsData);
            clearUserSelections();
            return true;
        }
    };

    //Helper function to send student observation info to server when the form is officially submitted
    const handleStudentObservationSubmit = async (sustained = false) => {
        if (!hasStudentObservationContent()) {
            return false;
        }

        if (!sessionInfo?.session_id || sessionInfo.session_id === 0) {
            console.error("Cannot submit student observation: invalid session_id", sessionInfo);
            return false;
        }

        const observerId = getStoredObserverId();
        if (!observerId) {
            console.error("Cannot submit student observation: missing observer_id");
            return false;
        }

        const observationWindow = buildObservationWindow({
            sustained,
            recordingStartedAt,
        });
        const normalizedStudentStudentId = normalizeStudentIdForSubmission(studentObsStudentId, studentIdNumericOnly);

        const studentObsData = {
            session_id: sessionInfo.session_id,
            observer_id: observerId,
            client_observation_id: buildObservationClientId(),
            start_time: observationWindow.start_time,
            end_time: observationWindow.end_time,
            student_id: normalizedStudentStudentId,
            selected_tags: compactSelectedSectionTags(selectedStudentTags),
            affect: selectedAffectTags,
            note: extraStudentNote.trim(),
            single_click: false,
            recording: observationWindow.recording,
            on_task: isStudentOnTask,
        };
        try {
            await createStudentObservation(studentObsData);
            clearUserSelections();
            return true;
        } catch (error) {
            console.error('Failed to submit student observation', error);
            console.log('Adding Student Observation to waiting logs.')
            storeObservationLocally(studentObsData);
            clearUserSelections();
            return true;
        }
    };

    //Helper function to begin a recording locally and defer persistence until stop
    const handleStartRecordingObservation = () => {
        if (isRecordingActionPending) {
            return;
        }

        if (observingTeacher) {
            setIsRecordingTeacherObs(true);
            setIsRecordingStudentObs(false);
        } else {
            setIsRecordingStudentObs(true);
            setIsRecordingTeacherObs(false);
        }

        setRecordingStartedAt(new Date().toISOString());
    }

    //Helper function to persist a completed recording as one final observation
    const handleStopRecordingObservation = async () => {
        if (isRecordingActionPending) {
            return;
        }

        const recordingTeacher = isRecordingTeacherObs;
        if (!recordingTeacher && !isRecordingStudentObs) {
            return;
        }

        const hasContent = recordingTeacher ? hasTeacherObservationContent() : hasStudentObservationContent();
        if (!hasContent) {
            setIsRecordingTeacherObs(false);
            setIsRecordingStudentObs(false);
            setRecordingStartedAt(null);
            return;
        }

        setIsRecordingActionPending(true);

        try {
            let wasSubmitted = false;
            if (recordingTeacher) {
                wasSubmitted = await handleTeacherObservationSubmit(true);
            } else {
                wasSubmitted = await handleStudentObservationSubmit(true);
            }

            if (wasSubmitted) {
                setRecentSuccessAction({ type: "record", token: Date.now() });
            }
        } catch (error) {
            console.error('Failed to submit observation', error);
        } finally {
            setIsRecordingTeacherObs(false);
            setIsRecordingStudentObs(false);
            setRecordingStartedAt(null);
            setIsRecordingActionPending(false);
        }
    }

    //Helper function to cancel a recording without creating any backend rows
    const handleCancelRecording = () => {
        if (isRecordingActionPending) {
            return;
        }

        clearUserSelections();
        setIsRecordingStudentObs(false);
        setIsRecordingTeacherObs(false);
        setRecordingStartedAt(null);
    }

    const handleSubmitObservation = async () => {
        if (isRecordingActionPending) {
            return;
        }

        setIsRecordingActionPending(true);

        try {
            let wasSubmitted = false;
            if (observingTeacher) {
                wasSubmitted = await handleTeacherObservationSubmit(false);
            } else {
                wasSubmitted = await handleStudentObservationSubmit(false);
            }

            if (wasSubmitted) {
                setRecentSuccessAction({ type: "submit", token: Date.now() });
            }
        } finally {
            setIsRecordingActionPending(false);
        }
    };

    const observerDisplayName = localStorage.getItem("custom_username") || localStorage.getItem("username") || "Unknown User";
    const activeObservationView = observingTeacher ? "teacher" : "student";
    const isTeacherTabLocked = isRecordingStudentObs;
    const isStudentTabLocked = isRecordingTeacherObs;
    const canSubmitCurrentObservation = observingTeacher ? hasTeacherObservationContent() : hasStudentObservationContent();
    const studentIdPlaceholder = studentIdNumericOnly ? "Optional numeric student IDs" : "Optional student identifiers";
    const studentIdInfoText = studentIdNumericOnly
        ? "Optional. Enter numeric student IDs only. Separate multiple IDs with commas."
        : "Optional. Use this if you want to note which student or students this observation is about.";

    const renderTeacherView = () => {
        return (
            <div className="observation-section-stack">
                <div className="observation-surface-card">
                    <div className="observation-metadata-row observation-metadata-row--teacher">
                        <div className="observation-inline-panel">
                            <ObservationTextField
                                label="Student ID(s)"
                                value={teacherObsStudentId}
                                onChange={(event) => setTeacherObsStudentId(sanitizeStudentIdInput(event.target.value, studentIdNumericOnly))}
                                placeholder={studentIdPlaceholder}
                                infoText={studentIdInfoText}
                                className="observation-field--compact-inline"
                            />
                        </div>

                        <div className="observation-inline-panel observation-inline-panel--selector">
                            <div className="observation-inline-selector">
                                <div className="observation-inline-selector-header">
                                    <div>
                                        <div className="observation-label-with-info">
                                            <p className="observation-field-label">Teacher Position</p>
                                            <ObservationInfoButton
                                                content="Where the teacher is positioned during this observation."
                                                label="About Teacher Position"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="observation-chip-wrap observation-chip-wrap--compact">
                                    {teacherPositionTags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={behaviorClass === tag ? "observation-chip observation-chip--active" : "observation-chip"}
                                            onClick={() => handleTeacherPositionTagClick(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {teacherSections.map((section) => {
                    const customTagKey = buildCustomTagKey(true, section.section_name);
                    const sectionCustomTags = getCustomTagsForSection(true, section.section_name);
                    const sectionTags = [...section.tags, ...sectionCustomTags];

                    return (
                        <ObservationSelectableTagSection
                            key={section.section_id}
                            title={section.section_name}
                            subtitle={getObservationSessionSectionSubtitle(section.section_name, "Teacher")}
                            tags={sectionTags}
                            isActive={(tag) => isTeacherTagSelected(section.section_name, tag)}
                            onToggle={(tag) => toggleTeacherTag(section.section_name, tag)}
                            onAdd={() => setAddTagModalString(customTagKey)}
                            collapsible
                            defaultOpen
                        />
                    );
                })}

                <div className="observation-surface-card observation-notes">
                    <ObservationTextField
                        label="Extra Notes"
                        value={extraTeacherNote}
                        onChange={(event) => setExtraTeacherNote(event.target.value)}
                        placeholder="Add any context you want attached to this observation."
                        infoText="Add any extra context you want saved with this observation."
                        multiline
                    />
                </div>
            </div>
        );
    };

    const renderStudentView = () => {
        return (
            <div className="observation-section-stack">
                <div className="observation-surface-card">
                    <div className="observation-metadata-row observation-metadata-row--student">
                        <div className="observation-inline-panel">
                            <ObservationTextField
                                label="Student ID(s)"
                                value={studentObsStudentId}
                                onChange={(event) => setStudentObsStudentId(sanitizeStudentIdInput(event.target.value, studentIdNumericOnly))}
                                placeholder={studentIdPlaceholder}
                                infoText={studentIdInfoText}
                                className="observation-field--compact-inline"
                            />
                        </div>

                        <div className="observation-inline-panel observation-inline-panel--selector observation-toggle-field">
                            <div className="observation-toggle-field-header">
                                <div className="observation-label-with-info">
                                    <p className="observation-field-label">On-task Status</p>
                                    <ObservationInfoButton
                                        content="Mark whether the student was on task at the moment this observation was recorded."
                                        label="About On-task Status"
                                    />
                                </div>
                            </div>

                            <div className="observation-toggle-pill">
                                <button
                                    type="button"
                                    className={isStudentOnTask ? "observation-toggle-pill-button--active" : ""}
                                    onClick={() => setIsStudentOnTask(true)}
                                >
                                    On task
                                </button>
                                <button
                                    type="button"
                                    className={!isStudentOnTask ? "observation-toggle-pill-button--active" : ""}
                                    onClick={() => setIsStudentOnTask(false)}
                                >
                                    Off task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {studentSections.map((section) => {
                    const customTagKey = buildCustomTagKey(false, section.section_name);
                    const sectionCustomTags = getCustomTagsForSection(false, section.section_name);
                    const sectionTags = [...section.tags, ...sectionCustomTags];

                    return (
                        <ObservationSelectableTagSection
                            key={section.section_id}
                            title={section.section_name}
                            subtitle={getObservationSessionSectionSubtitle(section.section_name, "Student")}
                            tags={sectionTags}
                            activeTone="student"
                            isActive={(tag) => isStudentTagSelected(section.section_name, tag)}
                            onToggle={(tag) => toggleStudentTag(section.section_name, tag)}
                            onAdd={() => setAddTagModalString(customTagKey)}
                            collapsible
                            defaultOpen
                        />
                    );
                })}

                <ObservationSelectableTagSection
                    title="Affect"
                    subtitle="Capture the student affect visible in the moment."
                    tags={studentAffects}
                    activeTone="student"
                    isActive={(tag) => selectedAffectTags.includes(tag)}
                    onToggle={(tag) => {
                        setSelectedAffectTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));
                    }}
                    renderTagContent={(tag, index) => (
                        <>
                            <img src={studentAffectIcons[index]} alt="" className="h-5 w-5" />
                            <span>{tag}</span>
                        </>
                    )}
                    collapsible
                    defaultOpen
                />

                <div className="observation-surface-card observation-notes">
                    <ObservationTextField
                        label="Extra Notes"
                        value={extraStudentNote}
                        onChange={(event) => setExtraStudentNote(event.target.value)}
                        placeholder="Add any context you want attached to this observation."
                        infoText="Add any extra context you want saved with this observation."
                        multiline
                    />
                </div>
            </div>
        );
    };

    const renderAddTagModal = () => {
        if (!AddTagModalString) {
            return null;
        }

        return (
            <AddTagModal
                modalHeader={`Add ${AddTagModalString.includes(":") ? AddTagModalString.split(":")[1] : AddTagModalString} Tag`}
                tagSection={AddTagModalString}
                onAddTag={addCustomTag}
                onClose={() => setAddTagModalString("")}
            />
        );
    };

    const renderHeaderActions = () => {
        const showRecordSuccess = recentSuccessAction?.type === "record" && !isRecordingTeacherObs && !isRecordingStudentObs;
        const showSubmitSuccess = recentSuccessAction?.type === "submit" && !isRecordingTeacherObs && !isRecordingStudentObs;

        return (
            <div className="observation-header-actions">
                <div className="observation-toolbar-actions">
                    {!isRecordingTeacherObs && !isRecordingStudentObs ? (
                        <>
                            <button
                                type="button"
                                className={`observation-icon-button${showRecordSuccess ? " observation-icon-button--success" : ""}${isRecordingActionPending ? " observation-icon-button--disabled" : ""}`}
                                onClick={handleStartRecordingObservation}
                                aria-label="Start recording observation"
                                disabled={isRecordingActionPending}
                            >
                                {showRecordSuccess ? (
                                    <CircleCheckBig className="observation-success-icon" />
                                ) : (
                                    <img src={startRecordPng} alt="" className="h-9 w-9" />
                                )}
                            </button>
                            <button
                            type="button"
                            className={`observation-icon-button${showSubmitSuccess ? " observation-icon-button--success" : ""}${isRecordingActionPending || !canSubmitCurrentObservation ? " observation-icon-button--disabled" : ""}`}
                            onClick={handleSubmitObservation}
                            aria-label="Submit observation"
                            disabled={isRecordingActionPending || !canSubmitCurrentObservation}
                        >
                            {showSubmitSuccess ? (
                                <CircleCheckBig className="observation-success-icon" />
                            ) : (
                                <img src={studentSendFormSvg} alt="" className="h-9 w-9" />
                            )}
                        </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className={`observation-icon-button${isRecordingActionPending ? " observation-icon-button--disabled" : ""}`}
                                onClick={handleCancelRecording}
                                aria-label="Cancel recording"
                                disabled={isRecordingActionPending}
                            >
                                <img src={deleteRecordingSvg} alt="" className="h-9 w-9" />
                            </button>
                            <button
                                type="button"
                                className={`observation-icon-button${isRecordingActionPending ? " observation-icon-button--disabled" : ""}`}
                                onClick={handleStopRecordingObservation}
                                aria-label="Stop recording observation"
                                disabled={isRecordingActionPending}
                            >
                                <img src={stopRecordSvg} alt="" className="h-9 w-9" />
                            </button>
                            <button
                                type="button"
                                className="observation-icon-button observation-icon-button--disabled"
                                aria-label="Submit observation unavailable during recording"
                                disabled
                            >
                                <img src={invalidSendFormSvg} alt="" className="h-9 w-9" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <OfflineIndicator />
            <div className="login-page observation-page">
                <div className="observation-workspace observation-workspace--live">
                    <header className="observation-workspace-header">
                        <div className="observation-workspace-top">
                            <button type="button" className="observation-back-button" onClick={handleExitObservation} aria-label="Exit observation">
                                <ArrowLeft className="h-5 w-5" />
                            </button>

                            <div className="observation-workspace-title-group">
                                <p className="observation-workspace-heading">{OBSERVATION_PAGE_TITLE}</p>
                            </div>

                            {renderHeaderActions()}
                        </div>

                        <div className="observation-workspace-meta">
                            <span className="observation-meta-pill">{`Observer: ${observerDisplayName}`}</span>
                            <span className="observation-meta-pill">{`Joined: ${formatToMonthDayHourMinute(joinedAt)}`}</span>
                            {sessionInfo?.session_name && (
                                <span className="observation-meta-pill">{`Session: ${sessionInfo.session_name}`}</span>
                            )}
                        </div>

                        <ObservationSegmentedTabs
                            tabs={[
                                {
                                    key: "teacher",
                                    label: "Teacher",
                                    disabled: isTeacherTabLocked,
                                },
                                {
                                    key: "student",
                                    label: "Student",
                                    disabled: isStudentTabLocked,
                                },
                            ]}
                            value={activeObservationView}
                            onChange={(value) => setObservingTeacher(value === "teacher")}
                        />
                    </header>

                    <div className="observation-workspace-body observation-workspace-body--live">
                        <div className="observation-workspace-stack observation-workspace-stack--live">
                            {observingTeacher ? renderTeacherView() : renderStudentView()}
                            {renderAddTagModal()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

