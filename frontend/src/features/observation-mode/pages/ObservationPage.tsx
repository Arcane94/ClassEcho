import { ArrowLeft, CircleCheckBig } from "lucide-react";
// Observation landing page that routes users into the start, join, or manage flows.
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
} from "@/features/observation-mode/config/observationCopy";
import { useSearchParams } from "react-router-dom";
import { fetchSessionById } from "@/services/fetchSessionById";
import { formatToMonthDayHourMinute } from "@/utils/formatToMonthDayHourMinute";
import { createTeacherObservation } from "@/services/createTeacherObservation";
import { createStudentObservation } from "@/services/createStudentObservation";
import type { SessionData } from '@/services/fetchSessionById';
import OfflineIndicator from "@/components/Status/OfflineIndicator";
import { buildObservationClientId, buildObservationWindow, getStoredObserverId } from "@/utils/observationLogging";
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

//Defines the behavior and design of the screen allowing users to make observations on both teachers an students
export default function ObservationPage() {

    //Navigator
    const navigator = useNavigate();

    //Pull search params to get session id
    const [searchParams] = useSearchParams();

    //State to store sessionData for this session, stored together as this should not change
    const [sessionData, setSessionData] = useState<SessionData | null>(null);

    //State to store the category, if any, that the add tag modal is opened for
    const [AddTagModalString, setAddTagModalString] = useState('');

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

    //State to store selected student tag
    const [selectedStudentTags, setSelectedStudentTags] = useState<string[]>([]);

    //State to store selected student affect tags
    const [selectedAffectTags, setSelectedAffectTags] = useState<string[]>([]);

    //State to store selected behavior tags
    const [selectedBehaviorTags, setSelectedBehaviorTags] = useState<string[]>([]);

    //State to store selected function tag
    const [selectedFunctionTags, setSelectedFunctionTags] = useState<string[]>([]);

    //State to store selected structure tag
    const [selectedStructureTags, setSelectedStructureTags] = useState<string[]>([]);

    //State to store a map of custom tags with the key being the section they belong and the value being the tag name
    const [customTags, setCustomTags] = useState<Map<string, string[]>>(new Map());

    //State to store selected student custom tags in "[TAG NAME] - [TAG CATEGORY]" format
    const [selectedStudentCustomTags, setSelectedStudentCustomTags] = useState<string[]>([]);

    //State to store selected teacher custom tags in "[TAG NAME] - [TAG CATEGORY]" format
    const [selectedTeacherCustomTags, setSelectedTeacherCustomTags] = useState<string[]>([]);

    //State to store student ID(s) from teacher side
    const [teacherObsStudentId, setTeacherObsStudentId] = useState('');

    //State to store student ID(s) from student side
    const [studentObsStudentId, setStudentObsStudentId] = useState('');

    //Constant List of Student Emotion Affects
    const studentAffects = ["Excited", "Suprised", "Happy", "Relaxed", "Tired", "Bored", "Sad", "Confused", "Frustrated", "Angry", "Focused", "Unfocused"];

    //Constant List of Student Emotion Affect Icons
    const studentAffectIcons = [excitedAffectIcon, excitedAffectIcon, happyAffectIcon, relaxedAffectIcon, tiredAffectIcon, boredAffectIcon, sadAffectIcon, confusedAffectIcon, frustratedAffectIcon, angryAffectIcon, happyAffectIcon, boredAffectIcon];

    //Constant List of Behavior Tag Classifications
    const behaviorTagClassifications = ["By Student", "At Front", "On LMS", "Walking"];

    //List of preset behavior tags
    const teacherBehaviorTags = ["Open-ended questions", "Direct to tasks", "Directs to resources", "Models struggle", "Teaches CT concept", "Manages behavior", "Stretch goals", "Reminds to save code", "Encourages collaboration", "Encourages participation", "Organizes peer tutors", "Organizes paired programming", "Encourages help-seeking", "Teaches collaboration", "Normalizes mistakes", "Connects to student interest"];

    //List of Function Tags
    let functionTags = ["Comp Thinking Skills", "Culture", "Independence", "Motivate", "Manage Environment"];

    //List of Structure Tags
    let structureTags = ["Activity", "Help-seeking queue", "LMS", "Rules and Norms", "Snap!"];

    //List of Student Tags for Student Observation
    let studentTags = ["Coding", "Collaborating", "Logging In", "Planning", "Reading Code", "Reading Instructions", "Talking w/ teacher", "Waiting for help", "Debugging", "On Unrelated Tab", "Requesting Help", "Running Code", "Talking w/ peer"];

    //Session id pulled from url (used for server call)
    const sessionId = searchParams.get('sessionId');

    //UseEffect statement to be triggered on component load that uses sessionId to pull additional session info from server
    useEffect(() => {
        if (sessionId) {
            fetchSessionById(sessionId).then(data => {
                if (data) {
                    setSessionData(data);
                }
            })
        }
    }, [sessionId]);

    const studentIdNumericOnly = Boolean(sessionData?.student_id_numeric_only);

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
    }, [])

    useEffect(() => {
        if (!recentSuccessAction) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setRecentSuccessAction(null);
        }, 2200);

        return () => window.clearTimeout(timeoutId);
    }, [recentSuccessAction]);

    //Helper function that toggles a string in a useState array for selecting tags
    const toggleStringInArray = (array: string[], item: string): string[] => {
        if (array.includes(item)) {
          return array.filter(i => i !== item);
        } else {
          return [...array, item];
        }
      };
  
    //Helper function to clear all user selections when a observation is submitted
    const clearUserSelections = () => {
        if (observingTeacher) {
            setExtraTeacherNote('');
            setBehaviorClass('');
            setSelectedBehaviorTags([]);
            setSelectedFunctionTags([]);
            setSelectedStructureTags([]);
            setSelectedTeacherCustomTags([]);
            setTeacherObsStudentId('');
        } else {
            setExtraStudentNote('');
            setSelectedStudentTags([]);
            setSelectedAffectTags([]);
            setIsStudentOnTask(true);
            setStudentObsStudentId('');
            setSelectedStudentCustomTags([]);
        }
    }
    //Helper function to toggle if a student custom tag is selected or not
    const toggleStudentCustomTag = (tag: string) => {
        setSelectedStudentCustomTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));
    }

    //Helper function to toggle if a teacher custom tag is selected or not
    const toggleTeacherCustomTag = (tag: string) => {
        setSelectedTeacherCustomTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));
    }

    //Helper function to handle when a teacher behavior tag is clicked
    const handleTeacherBehaviorTagClick = (tag: string) => {
        setSelectedBehaviorTags((prevTags: string[]) => {
            const updated = toggleStringInArray(prevTags, tag);
    
            if (!prevTags.includes(tag)) {
                console.log(`[${new Date().toISOString()}] Added ${tag} tag to selected behavior tags.\nBehavior tags is now: ${updated}`)
            } else {
                console.log(`[${new Date().toISOString()}] Removed ${tag} tag from selected behavior tags.\nBehavior tags is now: ${updated}`)

            }
    
            return updated;
        });
    };

    //Helper function to handle a teacher position tag click with some added logging
    const handleTeacherPositionTagClick = (tag: string) => {
        setBehaviorClass(tag);
        console.log(`[${new Date().toISOString()}] Setting teacher position to ${tag}`);
    };
    

    //Helper function to add a new entry in the customTags map
    const addCustomTag = (key: string, value: string) => {
        setCustomTags(prevTags => {
            const newCustomTags = new Map(prevTags);
            const existing = newCustomTags.get(key) || [];
            if (existing.includes(value)) {
                return prevTags;
            }

            newCustomTags.set(key, [...existing, value]);
            return newCustomTags;
        });
    }

    const dedupeTags = (tags: string[]): string[] => Array.from(new Set(tags));

    const getTeacherCustomTagsForSection = (section: "behavior" | "function" | "structure"): string[] => {
        const functionSuffix = " - Function";
        const structureSuffix = " - Structure";

        if (section === "behavior") {
            return selectedTeacherCustomTags.filter(
                (tag) => !tag.endsWith(functionSuffix) && !tag.endsWith(structureSuffix)
            );
        }

        const suffix = section === "function" ? functionSuffix : structureSuffix;
        return selectedTeacherCustomTags
            .filter((tag) => tag.endsWith(suffix))
            .map((tag) => tag.slice(0, -suffix.length));
    };

    const getStudentCustomBehaviorTags = (): string[] => {
        const behaviorSuffix = " - Behavior";
        return selectedStudentCustomTags.map((tag) =>
            tag.endsWith(behaviorSuffix) ? tag.slice(0, -behaviorSuffix.length) : tag
        );
    };

    const compactSelectedTagSections = (sections: Record<string, string[]>): Record<string, string[]> => {
        return Object.fromEntries(
            Object.entries(sections)
                .map(([sectionName, tags]) => [sectionName, dedupeTags(tags)] as const)
                .filter(([, tags]) => tags.length > 0)
        );
    };

    const buildTeacherSelectedTags = (): Record<string, string[]> => {
        return compactSelectedTagSections({
            Behavior: [...selectedBehaviorTags, ...getTeacherCustomTagsForSection("behavior")],
            Function: [...selectedFunctionTags, ...getTeacherCustomTagsForSection("function")],
            Structure: [...selectedStructureTags, ...getTeacherCustomTagsForSection("structure")],
        });
    };

    const buildStudentSelectedTags = (): Record<string, string[]> => {
        return compactSelectedTagSections({
            Behavior: [...selectedStudentTags, ...getStudentCustomBehaviorTags()],
        });
    };

    const hasTeacherObservationContent = (): boolean => {
        return Boolean(behaviorClass)
            || Object.keys(buildTeacherSelectedTags()).length > 0
            || extraTeacherNote.trim().length > 0;
    };

    const hasStudentObservationContent = (): boolean => {
        return Object.keys(buildStudentSelectedTags()).length > 0
            || selectedAffectTags.length > 0
            || extraStudentNote.trim().length > 0;
    };

    //Helper function to send teacher observation info to server when the form is officially submitted
    const handleTeacherObservationSubmit = async (sustained = false) => {
        if (!hasTeacherObservationContent()) {
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
            session_id: Number(sessionId),
            observer_id: observerId,
            client_observation_id: buildObservationClientId(),
            start_time: observationWindow.start_time,
            end_time: observationWindow.end_time,
            student_id: normalizedTeacherStudentId,
            teacher_position: behaviorClass,
            selected_tags: buildTeacherSelectedTags(),
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
            session_id: Number(sessionId),
            observer_id: observerId,
            client_observation_id: buildObservationClientId(),
            start_time: observationWindow.start_time,
            end_time: observationWindow.end_time,
            student_id: normalizedStudentStudentId,
            selected_tags: buildStudentSelectedTags(),
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
        const customTeacherPositionTags = customTags.get("teacher_position_tags") || [];
        const customBehaviorTags = customTags.get("behavior_tags") || [];
        const customFunctionTags = customTags.get("function_tags") || [];
        const customStructureTags = customTags.get("structure_tags") || [];
        const teacherPositionOptions = dedupeTags([...behaviorTagClassifications, ...customTeacherPositionTags]);

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

                                    <button
                                        type="button"
                                        className="observation-inline-button observation-inline-button--add"
                                        onClick={() => setAddTagModalString("teacher_position")}
                                    >
                                        Add position
                                    </button>
                                </div>

                                <div className="observation-chip-wrap observation-chip-wrap--compact">
                                    {teacherPositionOptions.map((tag) => (
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

                <ObservationSelectableTagSection
                    title="Behavior"
                    subtitle="Capture the teacher moves you see happening in the moment."
                    tags={dedupeTags([...teacherBehaviorTags, ...customBehaviorTags])}
                    isActive={(tag) => selectedBehaviorTags.includes(tag) || selectedTeacherCustomTags.includes(tag)}
                    onToggle={(tag) => {
                        if (teacherBehaviorTags.includes(tag)) {
                            handleTeacherBehaviorTagClick(tag);
                        } else {
                            toggleTeacherCustomTag(tag);
                        }
                    }}
                    onAdd={() => setAddTagModalString("behavior")}
                    addLabel="Add behavior"
                    collapsible
                    defaultOpen
                />

                <ObservationSelectableTagSection
                    title="Function"
                    subtitle="Why is the teacher making that move?"
                    tags={dedupeTags([...functionTags, ...customFunctionTags])}
                    isActive={(tag) => selectedFunctionTags.includes(tag) || selectedTeacherCustomTags.includes(`${tag} - Function`)}
                    onToggle={(tag) => {
                        if (functionTags.includes(tag)) {
                            setSelectedFunctionTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));
                        } else {
                            toggleTeacherCustomTag(`${tag} - Function`);
                        }
                    }}
                    onAdd={() => setAddTagModalString("function")}
                    addLabel="Add function"
                    collapsible
                    defaultOpen
                />

                <ObservationSelectableTagSection
                    title="Structure"
                    subtitle="What classroom structures or tools are part of this moment?"
                    tags={dedupeTags([...structureTags, ...customStructureTags])}
                    isActive={(tag) => selectedStructureTags.includes(tag) || selectedTeacherCustomTags.includes(`${tag} - Structure`)}
                    onToggle={(tag) => {
                        if (structureTags.includes(tag)) {
                            setSelectedStructureTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));
                        } else {
                            toggleTeacherCustomTag(`${tag} - Structure`);
                        }
                    }}
                    onAdd={() => setAddTagModalString("structure")}
                    addLabel="Add structure"
                    collapsible
                    defaultOpen
                />

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
        const customStudentTags = customTags.get("student_tags") || [];
        const customAffectTags = customTags.get("affect_tags") || [];

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

                <ObservationSelectableTagSection
                    title="Student Behaviors"
                    subtitle="Capture the student actions you see happening in the moment."
                    tags={dedupeTags([...studentTags, ...customStudentTags])}
                    activeTone="student"
                    isActive={(tag) => selectedStudentTags.includes(tag) || selectedStudentCustomTags.includes(`${tag} - Behavior`)}
                    onToggle={(tag) => {
                        if (studentTags.includes(tag)) {
                            setSelectedStudentTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));
                        } else {
                            toggleStudentCustomTag(`${tag} - Behavior`);
                        }
                    }}
                    onAdd={() => setAddTagModalString("student")}
                    addLabel="Add behavior"
                    collapsible
                    defaultOpen
                />

                <ObservationSelectableTagSection
                    title="Affect"
                    subtitle="Capture the student affect visible in the moment."
                    tags={dedupeTags([...studentAffects, ...customAffectTags])}
                    activeTone="student"
                    isActive={(tag) => selectedAffectTags.includes(tag)}
                    onToggle={(tag) => {
                        setSelectedAffectTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));
                    }}
                    onAdd={() => setAddTagModalString("affect")}
                    addLabel="Add affect"
                    renderTagContent={(tag, index) => (
                        <>
                            {studentAffectIcons[index] && <img src={studentAffectIcons[index]} alt="" className="h-5 w-5" />}
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

        const modalHeader = {
            teacher_position: "Add Teacher Position",
            behavior: "Add Behavior Tag",
            function: "Add Function Tag",
            structure: "Add Structure Tag",
            student: "Add Student Tag",
            affect: "Add Affect Tag",
        }[AddTagModalString] || "Add Tag";

        const tagSection = {
            teacher_position: "teacher_position_tags",
            behavior: "behavior_tags",
            function: "function_tags",
            structure: "structure_tags",
            student: "student_tags",
            affect: "affect_tags",
        }[AddTagModalString] || "behavior_tags";

        return (
            <AddTagModal
                modalHeader={modalHeader}
                tagSection={tagSection}
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
                            <button type="button" className="observation-back-button" onClick={() => navigator("/session-options")} aria-label="Exit observation">
                                <ArrowLeft className="h-5 w-5" />
                            </button>

                            <div className="observation-workspace-title-group">
                                <p className="observation-workspace-heading">{OBSERVATION_PAGE_TITLE}</p>
                            </div>

                            {renderHeaderActions()}
                        </div>

                        <div className="observation-workspace-meta">
                            <span className="observation-meta-pill">{`Observer: ${observerDisplayName}`}</span>
                            <span className="observation-meta-pill">
                                {`Start: ${sessionData?.local_time ? formatToMonthDayHourMinute(sessionData.local_time) : "No time available"}`}
                            </span>
                            {sessionData?.lesson_name && (
                                <span className="observation-meta-pill">{`Session: ${sessionData.lesson_name}`}</span>
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

