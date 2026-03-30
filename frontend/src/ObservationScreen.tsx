import {ArrowLeft} from "lucide-react";
import { useState, useEffect } from "react";
import SmallTextForm from "./components/Form/SmallTextForm";
import studentSendFormSvg from "./assets/images/student_send_form.svg";
import teacherSendFormSvg from "./assets/images/teacher_send_form.svg";
import invalidSendFormSvg from "./assets/images/invalid_send_form.svg";
import deleteRecordingSvg from "./assets/images/delete_recording.svg";
import startRecordPng from "./assets/images/start_recording.png";
import stopRecordSvg from "./assets/images/stop_recording.svg";
import { useNavigate } from "react-router-dom";
import { getCurrentTimeFormatted } from "./utils/getCurrentTimeFormatted";
import AddTagModal from "./components/Modal/AddTagModal";
import FadeOutText from "./components/Display/FadeOutText";
import { useSearchParams } from "react-router-dom";
import { fetchSessionById } from "./services/fetchSessionById";
import { formatToMonthDayHourMinute } from "./utils/formatToMonthDayHourMinute";
import { createTeacherObservation } from "./services/createTeacherObservation";
import { createStudentObservation } from "./services/createStudentObservation";
import { deleteStudentObservations } from "./services/deleteStudentObservations";
import { deleteTeacherObservations } from "./services/deleteTeacherObservations";
import type { SessionData } from './services/fetchSessionById';
import OfflineIndicator from "./components/Status/OfflineIndicator";


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

import { storeObservationLocally, offlineLogging } from "./services/offlineQueue";

//Defines the behavior and design of the screen allowing users to make observations on both teachers an students
export default function ObservationScreen() {

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

    //State to store last time an observation was submitted (starts empty)
    const [observationTime, setObservationTime] = useState('');

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

    //Tick counter that allows observation time to have a new key when updated
    const [observationTick, setObservationTick] = useState(0);

    //An array of single-click student observation ids that are saved when a user is recording, exists so these can be removed from database if record is cancelled
    const [recordingStudentIdBackup, setRecordingStudentIdBackup] = useState<number[]>([]);

    //An array of single-click teacher observation ids that are saved when a user is recording, exists so these can be removed from database if record is cancelled
    const [recordingTeacherIdBackup, setRecordingTeacherIdBackup] = useState<number[]>([]);


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
    //Helper function to toggle if a student custom tag is selected or not and handle backend operations
    const toggleStudentCustomTag = async (tag: string) => {
        //Toggle tag in array
        setSelectedStudentCustomTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));

        //Log press of tag in backend if tag is in custom tags list
        if (!selectedStudentCustomTags.includes(tag)) {
            await handleStudentObservationSingleSubmit("custom_tags", tag);
        }
    }

    //Helper function to toggle if a student custom tag is selected or not and handle backend operations
    const toggleTeacherCustomTag = async (tag: string) => {
        //Toggle tag in array
        setSelectedTeacherCustomTags((prevTags: string[]) => toggleStringInArray(prevTags, tag));

        //Log press of tag in backend if tag is in custom tags list
        if (!selectedTeacherCustomTags.includes(tag)) {
            await handleTeacherObservationSingleSubmit("custom_tags", tag);
        }
    }

    //Helper function to handle when a teacher behavior tag is clicked
    const handleTeacherBehaviorTagClick = (tag: string) => {
        setSelectedBehaviorTags((prevTags: string[]) => {
            const updated = toggleStringInArray(prevTags, tag);
    
            // submit observation if tag is being added
            if (!prevTags.includes(tag)) {
                console.log(`[${new Date().toISOString()}] Added ${tag} tag to selected behavior tags.\nBehavior tags is now: ${updated}`)
                handleTeacherObservationSingleSubmit("behavior_tags", tag);
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
            newCustomTags.set(key, [...existing, value]);
            return newCustomTags;
        });
    }

    //Helper function
    //Helper function to send teacher observation info to server when the form is officially submitted
    const handleTeacherObservationSubmit = async (recording?: boolean) => {
        //Built data to send to util function
        const teacherObsData: any = {
            session_id: Number(sessionId),
            //Ensure difference between teacher and student form ids
            student_id: teacherObsStudentId,
            teacher_position: behaviorClass,
            behavior_tags: selectedBehaviorTags,
            function_tags: selectedFunctionTags,
            structure_tags: selectedStructureTags,
            custom_tags: selectedTeacherCustomTags,
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
            session_id: Number(sessionId),
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
            session_id: Number(sessionId),
            //Ensure difference between teacher and student form ids
            student_id: studentObsStudentId,
            behavior_tags: selectedStudentTags,
            affect: selectedAffectTags,
            custom_tags: selectedStudentCustomTags,
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
            session_id: Number(sessionId),
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
            console.log('Adding Teacher Single Submit Observation to waiting logs.')
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
                <ArrowLeft className="ml-3 col-span-1 w-[24px] h-[24px]" style={{cursor: 'pointer' }} onClick={() => navigator('/')}  />
                <p className="text-center col-span-4 text-base">{`Observer: ${sessionData?.observer_name}`}</p>
                <p className="col-span-7 text-center text-base">{`Start: ${sessionData?.local_time ? formatToMonthDayHourMinute(sessionData.local_time) : 'No time available'}`}</p>
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
                        <h1 className="text-xl ml-[24px] mt-4">{`Teacher Position`}</h1>
                        {/* Behavior Tag Options */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {behaviorTagClassifications.map((tag, index) => (
                                <button key={index} style={{cursor: 'pointer'}} onClick={() => handleTeacherPositionTagClick(tag)} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${behaviorClass === tag ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                        </div>

                        {/*Student ID Button */}
                        <div className="flex mt-4 ml-[24px] items-center">
                            <label htmlFor="studentID" className="text-sm">Student ID </label>
                            <input id="studentID" style={{cursor: 'text'}} type="text" value={teacherObsStudentId} onChange={(e) => setTeacherObsStudentId(e.target.value)} placeholder="" className="ml-2 bg-white border border-gray-300 rounded px-1 py-0 focus:outline-none w-1/4"/>
                        </div>

                        <h2 className="text-xl ml-[24px] mt-4">{`Behavior (What?)`}</h2>


                        {/* Behavior Tag Display */}
                        <div className="mt-2">
                            <div className="py-3 px-[24px] w-full">
                                <div className="flex gap-2 flex-wrap items-center">
                                    {teacherBehaviorTags.map((tag, index) => (
                                        <button key={`built-in-${index}`} style={{cursor: 'pointer'}} onClick={() => handleTeacherBehaviorTagClick(tag)} className={`text-sm px-2 py-2 rounded-xl border border-gray-300 ${selectedBehaviorTags.includes(tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                                    ))}
                                    {/* Custom Behavior Tags */}
                                    {(customTags.get(`behavior_tags`) || []).map((tag, index) => (
                                        <button
                                        key={`custom-${index}`}
                                        onClick={() => toggleTeacherCustomTag(tag)}
                                        style={{cursor: 'pointer'}}
                                        className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedTeacherCustomTags.includes(tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white' }`}
                                        >
                                        {tag}
                                        </button>
                                    ))}
                                    <button onClick={() => setAddTagModalString('behavior')} style={{cursor: 'pointer'}} className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'>+</button>
                                    {/* Show Modal only if timeModalOpen is true */}
                                    { AddTagModalString == 'behavior' && (
                                        <AddTagModal modalHeader={"Add Behavior Tag"} tagSection={`behavior_tags`} onAddTag={addCustomTag} onClose={() => setAddTagModalString('')}/>
                                    )}
                                    
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl ml-[24px] mt-4">{`Function (Why?)`}</h3>
                        
                        {/*Function Tag Options */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {functionTags.map((tag, index) => (
                                <button key={`built-in-${index}`} style={{cursor: 'pointer'}} onClick={() => { setSelectedFunctionTags((prevTags: string[]) => toggleStringInArray(prevTags, tag)); !selectedFunctionTags.includes(tag) ? handleTeacherObservationSingleSubmit('function_tags', tag) : null; }} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedFunctionTags.includes(tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                            {/* Custom Function Tags */}
                            {(customTags.get('function_tags') || []).map((tag, index) => (
                                <button
                                key={`custom-${index}`}
                                style={{cursor: 'pointer'}}
                                onClick={() => toggleTeacherCustomTag(`${tag} - Function`)}
                                className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedTeacherCustomTags.includes(`${tag} - Function`) ? 'bg-[var(--accent-color)] text-white' : 'bg-white' }`}
                                >
                                {tag}
                                </button>
                            ))}
                            <button onClick={() => setAddTagModalString('function')} style={{cursor: 'pointer'}} className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'>+</button>
                            {/* Show Modal only if timeModalOpen is true */}
                            { AddTagModalString == 'function' && (
                                <AddTagModal modalHeader={"Add Function Tag"} tagSection={"function_tags"} onAddTag={addCustomTag} onClose={() => setAddTagModalString('')}/>
                            )}
                        </div>

                        <h4 className="text-xl ml-[24px] mt-4">{`Structure (With what?)`}</h4>
                        
                        {/*Structure Tag Options */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {structureTags.map((tag, index) => (
                                <button key={`built-in-${index}`} style={{cursor: 'pointer'}} onClick={() => { setSelectedStructureTags((prevTags: string[]) => toggleStringInArray(prevTags, tag)); !selectedStructureTags.includes(tag) ? handleTeacherObservationSingleSubmit('structure_tags', tag) : null; }} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedStructureTags.includes(tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                            {/* Custom Structure Tags */}
                            {(customTags.get('structure_tags') || []).map((tag, index) => (
                                <button
                                key={`custom-${index}`}
                                style={{cursor: 'pointer'}}
                                onClick={() => toggleTeacherCustomTag(`${tag} - Structure`)}
                                className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedTeacherCustomTags.includes(`${tag} - Structure`) ? 'bg-[var(--accent-color)] text-white' : 'bg-white' }`}
                                >
                                {tag}
                                </button>
                            ))}
                            <button onClick={() => setAddTagModalString('structure')} style={{cursor: 'pointer'}} className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'>+</button>
                            {/* Show Modal only if timeModalOpen is true */}
                            { AddTagModalString == 'structure' && (
                                <AddTagModal modalHeader={"Add Structure Tag"} tagSection={"structure_tags"} onAddTag={addCustomTag} onClose={() => setAddTagModalString('')}/>
                            )}
                        </div>
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
                            {studentTags.map((tag, index) => (
                                <button key={index} style={{cursor: 'pointer'}} onClick={() => { setSelectedStudentTags((prevTags: string[]) => toggleStringInArray(prevTags, tag)); !selectedStudentTags.includes(tag) ? handleStudentObservationSingleSubmit('behavior_tags', tag) : null; }} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedStudentTags.includes(tag) ? 'bg-[var(--green-accent)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                            {/* Custom Student Tags */}
                            {(customTags.get('student_tags') || []).map((tag, index) => (
                                <button
                                key={`custom-${index}`}
                                style={{cursor: 'pointer'}}
                                onClick={() => toggleStudentCustomTag(`${tag} - Behavior`)}
                                className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedStudentCustomTags.includes(`${tag} - Behavior`) ? 'bg-[var(--green-accent)] text-white' : 'bg-white' }`}
                                >
                                {tag}
                                </button>
                            ))}
                            <button onClick={() => setAddTagModalString('student')} style={{cursor: 'pointer'}} className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'>+</button>
                            {/* Show Modal only if timeModalOpen is true */}
                            { AddTagModalString == 'student' && (
                                <AddTagModal modalHeader={"Add Student Tag"} tagSection={"student_tags"} onAddTag={addCustomTag} onClose={() => setAddTagModalString('')}/>
                            )}
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