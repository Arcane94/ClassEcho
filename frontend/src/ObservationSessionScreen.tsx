//First pull all session info using the join code
import {ArrowLeft} from "lucide-react";
import { useState, useEffect } from "react";
import SmallTextForm from "./components/SmallTextForm";
import studentSendFormSvg from "./assets/images/student_send_form.svg";
import teacherSendFormSvg from "./assets/images/teacher_send_form.svg";
import invalidSendFormSvg from "./assets/images/invalid_send_form.svg";
import deleteRecordingSvg from "./assets/images/delete_recording.svg";
import startRecordPng from "./assets/images/start_recording.png";
import stopRecordSvg from "./assets/images/stop_recording.svg";
import { useNavigate } from "react-router-dom";
import { getCurrentTimeFormatted } from "./utils/getCurrentTimeFormatted";
import AddTagModal from "./components/AddTagModal";
import FadeOutText from "./components/FadeOutText";
import { formatToMonthDayHourMinute } from "./utils/formatToMonthDayHourMinute";
import { createTeacherObservation } from "./utils/createTeacherObservation";
import { createStudentObservation } from "./utils/createStudentObservation";
import { deleteStudentObservations } from "./utils/deleteStudentObservations";
import { deleteTeacherObservations } from "./utils/deleteTeacherObservations";
import type { SessionSectionInfo } from "./utils/getSessionSectionInfo";
import type { SessionInfo } from "./utils/getSessionByJoinCode";
import OfflineIndicator from "./components/OfflineIndicator";
import { getSessionSectionInfo } from "./utils/getSessionSectionInfo";


//Affect Icon Svg Imports 
import angryAffectIcon from "./assets/images/angry_affect.svg";
import boredAffectIcon from "./assets/images/bored_affect.svg";
import confusedAffectIcon from "./assets/images/confused_affect.svg";
import excitedAffectIcon from "./assets/images/excited_affect.svg";
import frustratedAffectIcon from "./assets/images/frustrated_affect.svg";
import happyAffectIcon from "./assets/images/happy_affect.svg";
import relaxedAffectIcon from "./assets/images/relaxed_affect.svg";
import tiredAffectIcon from "./assets/images/tired_affect.svg";
import sadAffectIcon from "./assets/images/sad_affect.svg";

import { storeObservationLocally, offlineLogging } from "./utils/offlineQueue";
import { updateSessionObservers } from "./utils/updateSessionObservers";
import { updateUserSessions } from "./utils/updateUserSessions";
import { exportStudentObservationsToCSV } from "./utils/exportStudentObservationsToCSV";
import { exportTeacherObservationsToCSV } from "./utils/exportTeacherObservationsToCSV";

//Defines the behavior and design of the screen allowing users to make observations on both teachers an students
export default function ObservationSessionScreen() {

    //Navigator
    const navigator = useNavigate();

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

    //State to store last time an observation was submitted (starts empty)
    const [observationTime, setObservationTime] = useState('');

    //State to store potential extra notes from teacherObsrvation
    const [extraTeacherNote, setExtraTeacherNote] = useState("");

     //State to store potential extra notes from studentObsrvation
     const [extraStudentNote, setExtraStudentNote] = useState("");

    //State to store selected behavior tag class
    const [behaviorClass, setBehaviorClass] = useState('By Student');

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

    //Tick counter that allows observation time to have a new key when updated
    const [observationTick, setObservationTick] = useState(0);

    //An array of single-click student observation ids that are saved when a user is recording, exists so these can be removed from database if record is cancelled
    const [recordingStudentIdBackup, setRecordingStudentIdBackup] = useState<number[]>([]);

    //An array of single-click teacher observation ids that are saved when a user is recording, exists so these can be removed from database if record is cancelled
    const [recordingTeacherIdBackup, setRecordingTeacherIdBackup] = useState<number[]>([]);

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
    }, [sessionId]);
                    
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
                        //Otherwise delegate to the seperator function to split the sections and set state
                        seperateSectionBySegtor(sections);
                    }
                } catch (error) {
                    console.error("Error fetching session sections:", error);
                }
            };
            fetchSessionSections();
        }
    }, [sessionInfo]);

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
    })

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

    //Helper function that takes all of the session section info and splits into two seperate use State values depending on whether the session_segtor is Teacher or Student
    const seperateSectionBySegtor = (sectionInfo: SessionSectionInfo[]) => {
        //Filter out all teacherSections and set the teacherSections state to this array
        const teacherSections = sectionInfo.filter(section => section.session_segtor === 'Teacher');
        setTeacherSections(teacherSections);
        //Filter out all studentSections and set the studentSections state to this array
        const studentSections = sectionInfo.filter(section => section.session_segtor === 'Student');
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

    //Helper function to clear all user selections when a observation is submitted
    const clearUserSelections = () => {
        if (observingTeacher) {
            setExtraTeacherNote('');
            setBehaviorClass('By Student');
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

    //Helper function
    //Helper function to send teacher observation info to server when the form is officially submitted
    const handleTeacherObservationSubmit = async (recording?: boolean) => {
        if (!sessionInfo?.session_id || sessionInfo.session_id === 0) {
            console.error("Cannot submit teacher observation: invalid session_id", sessionInfo);
            return;
        }
        //Built data to send to util function
        const teacherObsData: any = {
            session_id: sessionInfo?.session_id,
            //Ensure difference between teacher and student form ids
            student_id: teacherObsStudentId,
            teacher_position: behaviorClass,
            selected_tags: selectedTeacherTags,
            submitted_by_user: true,
            note: extraTeacherNote,
            //New tag sent only to controller in server to loosen error-checking for single click observations
            single_click: false,
            recording: null,
        };

        //Include recording flag if true
        if (recording) {
            teacherObsData.recording = true;
        } else if (recording === false) {
            teacherObsData.recording = false;
        }
        try {
            //Call util function with formatted data
            await createTeacherObservation(teacherObsData);
            //Clear selected forms
            clearUserSelections();
        } catch (error) {
            console.error('Failed to submit teacher observation', error);
            console.log('Adding Teacher Observation to waiting logs.');
            storeObservationLocally(teacherObsData);
            //ensure user selections are still cleared
            clearUserSelections();
        }
    }

    //Helper function to send teacher observation info to server when a single new tag is clicked
    const handleTeacherObservationSingleSubmit = async (tagCategory: string, tagText: string) => {
        //add tag text to array to meet server standards 
        const singleTagArray = [tagText];

        //Built data to send to util function
        const teacherObsData: any = {
            session_id: sessionInfo?.session_id,
            //Ensure difference between teacher and student form ids
            student_id: teacherObsStudentId,
            [tagCategory]: singleTagArray,
            submitted_by_user: false,
            single_click: true,
            recording: null,
        };
        try {
            //Call util function with formatted data
            const response = await createTeacherObservation(teacherObsData);
            if (isRecordingTeacherObs) {
                //if the user is recording, save the id from this log to the recording backup
                setRecordingTeacherIdBackup(prev => [...prev, response]);
            }
        } catch (error) {
            console.error('Failed to submit teacher observation', error);
            console.log('Adding Teacher Single Submit Observation to waiting logs.')
            storeObservationLocally(teacherObsData);
        }
    }

    //Helper function to send student observation info to server when the form is officially submitted
    const handleStudentObservationSubmit = async (recording?: boolean) => {
        //Built data to send to util function
        const studentObsData: any = {
            session_id: sessionInfo?.session_id,
            //Ensure difference between teacher and student form ids
            student_id: studentObsStudentId,
            selected_tags: selectedStudentTags,
            affect: selectedAffectTags,
            submitted_by_user: true,
            note: extraStudentNote,
            //New tag sent only to controller in server to loosen error-checking for single click observations
            single_click: true,
            recording: null,
            on_task: isStudentOnTask,
        };

        //Add recording tag if it is true
        if (recording) {
            studentObsData.recording = true;
        } else if (recording === false) {
            studentObsData.recording = false;
        }
        try {
            //Call util function with formatted data
            await createStudentObservation(studentObsData);
            //Clear selected forms
            clearUserSelections();
        } catch (error) {
            console.error('Failed to submit student observation', error);
            console.log('Adding Student Observation to waiting logs.')
            storeObservationLocally(studentObsData);
            clearUserSelections();
        }
    }

    //Helper function to send student observation info to server when a single new tag is clicked
    const handleStudentObservationSingleSubmit = async (tagCategory: string, tagText: string) => {
        //add tag text to array to meet server standards 
        const singleTagArray = [tagText];

        //Built data to send to util function
        const studentObsData: any = {
            session_id: sessionInfo?.session_id,
            //Ensure difference between teacher and student form ids
            student_id: studentObsStudentId,
            [tagCategory]: singleTagArray,
            submitted_by_user: false,
            single_click: true,
            recording: null,
            on_task: isStudentOnTask,
        };
        try {
            //Call util function with formatted data
            const response = await createStudentObservation(studentObsData);
            if (isRecordingStudentObs) {
                //if the user is recording, save the id from this log to the recording backup
                setRecordingStudentIdBackup(prev => [...prev, response]);
            }
        } catch (error) {
            console.error('Failed to submit student observation', error);
            console.log('Adding Student Single Submit Observation to waiting logs.')
            storeObservationLocally(studentObsData);
        }
    }

    //Helper function to handle calling correct utils and making correct data entry when user begins recording an observation
    const handleStartRecordingObservation = async () => {
        //Set which entity is being recorded
        if (observingTeacher) {
            setIsRecordingTeacherObs(true);
          } else {
            setIsRecordingStudentObs(true);
        }

        try {
            //Small data object to send to server for both teacher and student obsrvations
            const observationData = {
                session_id: Number(sessionId),
                recording: true,
                single_click: true,
            }
            //Send observation to either student or teacher data tables, depending on which is currently being recorded
            if (observingTeacher) {
                await createTeacherObservation(observationData);
            } else {
                await createStudentObservation(observationData);
            }        
        } catch (error) {
            console.error('Failed to submit observation', error);
        }
    }

    //Helper function to handle calling correct utils and making correct data entry when user stops recording an observation
    const handleStopRecordingObservation = async () => {
        //Set both flags to stop recording for safety 
        setIsRecordingTeacherObs(false);
        setIsRecordingStudentObs(false);

        try {
            //Send observation to either student or teacher data tables, depending on which has just stopped being recording
            //Delegate to the function in place for form submission for both sides
            if (observingTeacher) {
                await handleTeacherObservationSubmit(false);
            } else {
                await handleStudentObservationSubmit(false);
            }
            setObservationTime(getCurrentTimeFormatted());
            setObservationTick(prev => prev + 1);        
        } catch (error) {
            console.error('Failed to submit observation', error);
        }
    }

    //Helper function to handle when a recording is cancelled while in progress
    const handleCancelRecording = async () => {
        //Clear the user's selections
        clearUserSelections();
        //Delete correct tags
        if (isRecordingStudentObs) {
            await deleteStudentObservations(recordingStudentIdBackup);
            //Clear the backup
            setRecordingStudentIdBackup([]);
            //Build a minimal objext to send as an observation to represent recording stop
            const studentObsData: any = {
                session_id: Number(sessionId),
                //Ensure difference between teacher and student form ids
                submitted_by_user: false,
                single_click: true,
                recording: false,
            };
            try {
                //Call util function with formatted data
                await createStudentObservation(studentObsData);
            } catch (error) {
                console.error('Failed to submit student observation', error);
                console.log('Adding Student Single Submit Observation to waiting logs.')
                storeObservationLocally(studentObsData);
            }
        } else {
            await deleteTeacherObservations(recordingTeacherIdBackup);
            //Clear the backup
            setRecordingTeacherIdBackup([]);
            //Build a minimal objext to send as an observation to represent recording stop
            const teacherObsData: any = {
                session_id: Number(sessionId),
                //Ensure difference between teacher and student form ids
                submitted_by_user: false,
                single_click: true,
                recording: false,
            };
            try {
                //Call util function with formatted data
                await createTeacherObservation(teacherObsData);
            } catch (error) {
                console.error('Failed to submit teacher observation', error);
                console.log('Adding Teacher Single Submit Observation to waiting logs.')
                storeObservationLocally(teacherObsData);
            }
        }
        //Set the proper isRecording tag to false
        setIsRecordingStudentObs(false);
        setIsRecordingTeacherObs(false);
    }

    return (
        <>
            {/* Offline indicator that is loaded when user is offline */}
            <OfflineIndicator/>
            <header className="fixed top-0 left-0 right-0 w-full max-w-[800px] mx-auto h-[51px] bg-[var(--grey-accent)] grid grid-cols-12 items-center">
                <ArrowLeft className="ml-3 col-span-1 w-[24px] h-[24px]" style={{cursor: 'pointer' }} onClick={() => navigator(-1)}  />
                <p className="text-center col-span-4 text-base">{`Observer: ${sessionInfo?.observer_name}`}</p>
                <p className="col-span-7 text-center text-base">{`Start: ${sessionInfo?.local_time ? formatToMonthDayHourMinute(sessionInfo.local_time) : 'No time available'}`}</p>
            </header>

            <div className="w-full flex justify-center items-start min-h-[calc(100vh-51px)] overflow-hidden">
                <div className="max-w-[800px] w-full">
                    <div className="mt-[51px] w-full flex items-center">
                        <button onClick={() => !isRecordingStudentObs ? setObservingTeacher(true) : null} className={`text-xl w-1/2 py-3  ${isRecordingStudentObs ? 'bg-gray-300 text-black' : observingTeacher ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--light-blue-accent)] text-black'}`} style={{ cursor: isRecordingStudentObs ? 'not-allowed' : 'pointer'}}>Teacher</button>
                        <button onClick={() => !isRecordingTeacherObs ? setObservingTeacher(false) : null} className={`text-xl w-1/2 py-3  ${isRecordingTeacherObs ? 'bg-gray-300 text-black' : !observingTeacher ? 'bg-[var(--green-accent)] text-white' : 'bg-[var(--light-green-accent)] text-black'}`} style={{ cursor: isRecordingTeacherObs ? 'not-allowed' : 'pointer'}}>Student</button>
                    </div>

                    {/*Content Switch between teacher and student observation screens */}
                    {observingTeacher ? 
                        (
                        <>
                        {/*Student ID Button */}
                        <div className="flex mt-4 ml-[24px] items-center">
                            <label htmlFor="studentID" className="text-sm">Student ID </label>
                            <input id="studentID" style={{cursor: 'text'}} type="text" value={teacherObsStudentId} onChange={(e) => setTeacherObsStudentId(e.target.value)} placeholder="" className="ml-2 bg-white border border-gray-300 rounded px-1 py-0 focus:outline-none w-1/4"/>
                        </div>

                        <h1 className="text-xl ml-[24px] mt-4">{`Teacher Position`}</h1>
                        {/* Behavior Tag Options */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {teacherPositionTags.map((tag, index) => (
                                <button key={index} style={{cursor: 'pointer'}} onClick={() => handleTeacherPositionTagClick(tag)} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${behaviorClass === tag ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                        </div>

                        {teacherSections.map((section) => {
                            const customTagKey = buildCustomTagKey(true, section.section_name);
                            const sectionCustomTags = getCustomTagsForSection(true, section.section_name);
                            return (
                                <div key={section.section_id}>
                                    <h2 className="text-xl ml-[24px] mt-4">{section.section_name}</h2>
                                    <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                                        {section.tags.map((tag, index) => (
                                            <button
                                                key={`${section.section_id}-${index}`}
                                                style={{cursor: 'pointer'}}
                                                onClick={() => { toggleTeacherTag(section.section_name, tag); !isTeacherTagSelected(section.section_name, tag) ? handleTeacherObservationSingleSubmit('selected_tags', tag) : null}}
                                                className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${isTeacherTagSelected(section.section_name, tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                        {sectionCustomTags.map((tag, index) => (
                                            <button
                                                key={`${customTagKey}-${index}`}
                                                style={{cursor: 'pointer'}}
                                                onClick={() => {
                                                    toggleTeacherTag(section.section_name, tag);
                                                    !isTeacherTagSelected(section.section_name, tag)
                                                        ? handleTeacherObservationSingleSubmit('selected_tags', tag)
                                                        : null;
                                                }}
                                                className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${isTeacherTagSelected(section.section_name, tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setAddTagModalString(customTagKey)}
                                            style={{cursor: 'pointer'}}
                                            className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'
                                        >
                                            +
                                        </button>
                                        {AddTagModalString === customTagKey && (
                                            <AddTagModal
                                                modalHeader={`Add ${section.section_name} Tag`}
                                                tagSection={customTagKey}
                                                onAddTag={addCustomTag}
                                                onClose={() => setAddTagModalString('')}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Add Note Text Input */}
                        <div className={`mx-[24px] mt-3`}>
                            <SmallTextForm 
                                label="Extra Notes"
                                id="extraTeacherNotes"
                                name="extraTeacherNotes"
                                onChange={(e) => setExtraTeacherNote(e.target.value)}
                                value={extraTeacherNote}
                                placeholder=""
                                className="h-[98px]"
                            />
                        </div>
                    </>
                    ) : (
                        <>
                        {/* Request and Store Student ID(s) */}
                        <div className="flex mx-[24px] items-center justify-start gap-2 my-4">
                            <label className="text-sm">Student ID(s)</label>
                            <input id="studentID" type="text" value={studentObsStudentId} style={{cursor: 'text'}} onChange={(e) => setStudentObsStudentId(e.target.value)} placeholder="" className="ml-2 bg-white border border-gray-300 rounded px-1 py-0 focus:outline-none w-1/2"/> 
                        </div>

                        {/* On Task/Off Task Toggle */}
                        <div className="bg-[#129F27] rounded-[30px] p-1 inline-flex mx-[24px]">
                            <button onClick={() => setIsStudentOnTask(true)} style={{cursor: 'pointer'}} className={`rounded-[30px] p-3 ${isStudentOnTask ? 'bg-white text-black' : 'bg-[#129F27] text-white'}`}>On task</button>
                            <button onClick={() => setIsStudentOnTask(false)} style={{cursor: 'pointer'}} className={`rounded-[30px] p-3 ${!isStudentOnTask ? 'bg-white text-black' : 'bg-[#129F27] text-white'}`}>Off task</button>
                        </div>

                        {/* Student Tags Section */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center bg-[var(--light-green-accent)] mt-4">
                        {studentSections.map((section) => {
                            const customTagKey = buildCustomTagKey(false, section.section_name);
                            const sectionCustomTags = getCustomTagsForSection(false, section.section_name);
                            return (
                                <div key={section.section_id}>
                                    <h2 className="text-xl ml-[24px] mt-4">{section.section_name}</h2>
                                    <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                                        {section.tags.map((tag, index) => (
                                            <button
                                                key={`${section.section_id}-${index}`}
                                                style={{cursor: 'pointer'}}
                                                onClick={() => { toggleStudentTag(section.section_name, tag); !isStudentTagSelected(section.section_name, tag) ? handleStudentObservationSingleSubmit('selected_tags', tag) : null}}
                                                className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${isStudentTagSelected(section.section_name, tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                        {sectionCustomTags.map((tag, index) => (
                                            <button
                                                key={`${customTagKey}-${index}`}
                                                style={{cursor: 'pointer'}}
                                                onClick={() => {
                                                    toggleStudentTag(section.section_name, tag);
                                                    !isStudentTagSelected(section.section_name, tag)
                                                        ? handleStudentObservationSingleSubmit('selected_tags', tag)
                                                        : null;
                                                }}
                                                className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${isStudentTagSelected(section.section_name, tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setAddTagModalString(customTagKey)}
                                            style={{cursor: 'pointer'}}
                                            className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'
                                        >
                                            +
                                        </button>
                                        {AddTagModalString === customTagKey && (
                                            <AddTagModal
                                                modalHeader={`Add ${section.section_name} Tag`}
                                                tagSection={customTagKey}
                                                onAddTag={addCustomTag}
                                                onClose={() => setAddTagModalString('')}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        </div>

                        {/* Student Affect Section */}
                        <h1 className="text-xl ml-[24px] mt-6">Affect</h1>

                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {studentAffects.map((tag, index) => (
                                <button key={index} style={{cursor: 'pointer'}} onClick={() => { setSelectedAffectTags((prevTags: string[]) => toggleStringInArray(prevTags, tag)); !selectedAffectTags.includes(tag) ? handleStudentObservationSingleSubmit('affect', tag) : null; }} className={`flex justify-between items-center gap-1.5 text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedAffectTags.includes(tag) ? 'bg-[var(--green-accent)] text-white' : 'bg-white'}`}>
                                    <span><img src={studentAffectIcons[index]} alt="Emotion Icon" className="w-[24px] h-[24px]"/></span>
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Add Note Input for Student obsrevation side */}
                        <div className={`mx-[24px] mt-3`}>
                            <SmallTextForm 
                                label="Extra Notes"
                                id="extraStudentNotes"
                                name="extraStudentNotes"
                                onChange={(e) => setExtraStudentNote(e.target.value)}
                                value={extraStudentNote}
                                placeholder=""
                                className="h-[98px]"
                            />
                        </div>
                        </>
                    )
                }

                    {/*Send Observation/Record Button Section */}
                    <div className="mx-[24px] bg-[#F8F9FA] flex items-center gap-2 justify-between p-2 rounded-md mt-2 mb-6">
                        <div className="flex-1 max-w-[500px]">
                            {observationTime && 
                                <FadeOutText key={`${observationTick}`} delay={5000} text={`Observation recorded at ${observationTime}.`} className="text-[var(--green-accent)] text-sm" />
                            }
                            {observingTeacher && sessionInfo && (
                                <button 
                                    onClick={() => exportTeacherObservationsToCSV(sessionInfo.session_id)}
                                    className="bg-[var(--accent-color)] text-white px-3 py-1 rounded text-sm hover:opacity-90"
                                    style={{cursor: 'pointer'}}
                                >
                                    Export Teacher Data
                                </button>
                            )}
                            {!observingTeacher && sessionInfo && (
                                <button 
                                    onClick={() => exportStudentObservationsToCSV(sessionInfo.session_id)}
                                    className="bg-[var(--green-accent)] text-white px-3 py-1 rounded text-sm hover:opacity-90"
                                    style={{cursor: 'pointer'}}
                                >
                                    Export Student Data
                                </button>
                            )}
                        </div>
                        <div>
                            {(!isRecordingTeacherObs && !isRecordingStudentObs) ?
                                (   <div className="flex gap-2">
                                        <img src={startRecordPng} alt="Start Recording Button" className="w-[36px] h-[36px]" style={{cursor: 'pointer'}} onClick={handleStartRecordingObservation}/>
                                        <img src={observingTeacher ? teacherSendFormSvg : studentSendFormSvg} alt="Send Form Button" onClick={() => { observingTeacher ? handleTeacherObservationSubmit() : handleStudentObservationSubmit(); setObservationTick(prev => prev + 1); setObservationTime(getCurrentTimeFormatted())}} style={{cursor: 'pointer'}} className="w-[36px] h-[36px]"/>
    
                                    </div>
                                ) :  (
                                    <div className="flex gap-2">
                                        <img src={deleteRecordingSvg} alt="Delete Record Button" className="w-[36px] h-[36px]" style={{cursor: 'pointer'}} onClick={() => handleCancelRecording() }/>
                                        <img src={stopRecordSvg} alt="Stop Recording Button" className="w-[36px] h-[36px]" style={{cursor: 'pointer'}} onClick={handleStopRecordingObservation}/>
                                        <img src={invalidSendFormSvg} alt="Invalid Send Form Button" style={{cursor: 'not-allowed'}} className="w-[36px] h-[36px]"/>
                                    </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}