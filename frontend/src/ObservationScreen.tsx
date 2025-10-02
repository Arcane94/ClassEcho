import {ArrowLeft} from "lucide-react";
import { useState } from "react";
import SmallTextForm from "./components/SmallTextForm";
import sendFormSvg from "./assets/images/send_form.svg";
import startRecordPng from "./assets/images/start_recording.png";
import stopRecordSvg from "./assets/images/stop_recording.svg";
import { useNavigate } from "react-router-dom";

//Affect Icons
import angryAffectIcon from "./assets/images/angry_affect.svg";
import boredAffectIcon from "./assets/images/bored_affect.svg";
import confusedAffectIcon from "./assets/images/confused_affect.svg";
import excitedAffectIcon from "./assets/images/excited_affect.svg";
import frustratedAffectIcon from "./assets/images/frustrated_affect.svg";
import happyAffectIcon from "./assets/images/happy_affect.svg";
import relaxedAffectIcon from "./assets/images/relaxed_affect.svg";
import tiredAffectIcon from "./assets/images/tired_affect.svg";
import sadAffectIcon from "./assets/images/sad_affect.svg";

export default function ObservationScreen() {

    //Navigator
    const navigator = useNavigate();

    //State to store if a student is on task (if false assume off task)
    const [isStudentOnTask, setIsStudentOnTask] = useState(true);

    //State to store if user is observing a teacher (serves as a way to switch between student and teacher screens)
    const [observingTeacher, setObservingTeacher] = useState(true);

    //State to store if the user is currently recording a task
    const [isRecording, setIsRecording] = useState(false);

    //State to store potential extra notes
    const [extraNote, setExtraNote] = useState("");

    //State to store selected behavior tag class
    const [behaviorClass, setBehaviorClass] = useState('By Student');

    //State to store if user is adding a note
    const [addNoteOpen, setAddNoteOpen] = useState(false);

    //State to store selected student tag
    const [selectedStudentTags, setSelectedStudentTags] = useState<string[]>([]);

    //State to store selected student affect tag
    const [selectedAffectTags, setSelectedAffectTags] = useState<string[]>([]);

    //State to store selected behavior tags
    const [selectedBehaviorTags, setSelectedBehaviorTags] = useState<string[]>([]);

    //State to store selected function tag
    const [selectedFunctionTags, setSelectedFunctionTags] = useState<string[]>([]);

    //State to store selected structure tag
    const [selectedStructureTags, setSelectedStructureTags] = useState<string[]>([]);

    //State to store student ID
    const [studentId, setStudentID] = useState('');

    //Constant List of Student Emotion Affects
    const studentAffects = ["Excited", "Suprised", "Happy", "Relaxed", "Tired", "Bored", "Sad", "Confused", "Frustrated", "Angry"];

    //Constant List of Student Emotion Affect Icons
    const studentAffectIcons = [excitedAffectIcon, excitedAffectIcon, happyAffectIcon, relaxedAffectIcon, tiredAffectIcon, boredAffectIcon, sadAffectIcon, confusedAffectIcon, frustratedAffectIcon, angryAffectIcon];

    //Constant List of Behavior Tag Classifications
    const behaviorTagClassifications = ["By Student", "At Front", "On LMS", "Walking"];

    //List of Behavior - By Student Tags that can be updated
    let behaviorByStudentTags = ["Directs to resources", "Directs to peer help", "Direct to tasks", "Manages behavior", "Mistakes are normal", "Open-ended questions", "Prompts for Debugging", "Stretch goals", "Teaches CT concept", "Technical support"];

    //List of Function Tags
    let functionTags = ["CT Skills", "Culture", "Independence", "Motivate", "Manage Environment"];

    //List of Structure Tags
    let structureTags = ["Activity", "Help-seeking queue", "LMS", "Rules and Norms", "Snap!"];

    //List of Student Tags for Student Observation
    let studentTags = ["Coding", "Collaborating", "Logging In", "Planning", "Reading Code", "Reading Instructions", "Talking w/ teacher", "Waiting for help", "Debugging", "On Unrelated Tab", "Requesting Help", "Running Code", "Talking w/ peer"];

    //Helper function that toggles a string in a useState array for selecting tags
    const toggleStringInArray = (array: string[], item: string): string[] => {
        if (array.includes(item)) {
          return array.filter(i => i !== item);
        } else {
          return [...array, item];
        }
      };

    //Function to Format the "Start: ..." time string in header
    const formatTimeString = () => {
        //Implement when API use is updated
        return "Start: 9/15, 11:30am";
    }

    //Function to Format the "Observer: ..." string in header
    const formatObserverString = () => {
        return "Observer: Ally";
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 w-full max-w-[800px] mx-auto h-[51px] bg-[var(--grey-accent)] grid grid-cols-12 items-center">
                <ArrowLeft className="ml-3 col-span-1 w-[24px] h-[24px]" onClick={() => navigator('/')} />
                <p className="text-center col-span-4 text-base">{formatObserverString()}</p>
                <p className="col-span-7 text-center text-base">{formatTimeString()}</p>
            </header>

            <div className="flex items-center justify-center w-full">
                <div className="max-w-[800px]">
                    <div className="mt-[51px] w-full flex items-center">
                        <button onClick={() => setObservingTeacher(true)} className={`text-xl w-1/2 py-3  ${observingTeacher ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--light-blue-accent)] text-black'}`}>Teacher</button>
                        <button onClick={() => setObservingTeacher(false)} className={`text-xl w-1/2 py-3  ${!observingTeacher ? 'bg-[var(--green-accent)] text-white' : 'bg-[var(--light-green-accent)] text-black'}`}>Student</button>
                    </div>

                    {/*Content Switch between teacher and student observation screens */}
                    {observingTeacher ? 
                        (
                        <>
                        <h1 className="text-xl ml-[24px] mt-4">Behavior</h1>

                        {/* Behavior Tag Options */}
                        <div className="ml-[24px] mr-[24px] mt-3 w-full flex gap-2 flex-wrap items-start">
                            {behaviorTagClassifications.map((tag, index) => (
                                <button key={index} onClick={() => setBehaviorClass(tag)} className={`text-l px-2 py-2 rounded-xl [@media(max-width:375px)]:text-xs [@media(max-width:450px)]:text-sm ${behaviorClass === tag ? 'bg-[var(--light-blue-accent)]' : 'bg-[var(--grey-accent)]'}`}>{tag}</button>
                            ))}
                        </div>

                        {/* Behavior Tag Display */}
                        <div className="relative -top-[8px]">
                            <div className="py-3 px-[24px] w-full bg-[var(--light-blue-accent)]">
                                <div className="flex gap-2 flex-wrap items-center">
                                    {behaviorByStudentTags.map((tag, index) => (
                                        <button key={index} onClick={() => setSelectedBehaviorTags((prevTags: string[]) => toggleStringInArray(prevTags, tag))} className={`text-sm px-2 py-2 rounded-xl ${selectedBehaviorTags.includes(tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                                    ))}
                                    {/* Add Tag Button */}
                                    <button className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center'>+</button>
                                </div>
                                {/*Student ID Button */}
                                <div className="flex mt-4 items-center">
                                    <label htmlFor="studentID" className="text-sm">Student ID </label>
                                    <input id="studentID" type="text" value={studentId} onChange={(e) => setStudentID(e.target.value)} placeholder="" className="ml-2 bg-white border border-gray-300 rounded px-1 py-0 focus:outline-none w-1/4"/>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl ml-[24px] mt-4">Function</h2>
                        
                        {/*Function Tag Options */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {functionTags.map((tag, index) => (
                                <button key={index} onClick={() => setSelectedFunctionTags((prevTags: string[]) => toggleStringInArray(prevTags, tag))} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedFunctionTags.includes(tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                            <button className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'>+</button>
                        </div>

                        <h3 className="text-xl ml-[24px] mt-4">Structure</h3>
                        
                        {/*Function Tag Options */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {structureTags.map((tag, index) => (
                                <button key={index} onClick={() => setSelectedStructureTags((prevTags: string[]) => toggleStringInArray(prevTags, tag))} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedStructureTags.includes(tag) ? 'bg-[var(--accent-color)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                            <button className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'>+</button>
                        </div>
                        {/*Add Note Header */}
                        {!addNoteOpen ? (
                            <button onClick={() => setAddNoteOpen(true)} className="mx-[24px] text-l text-gray-300 mt-3">+ Add Note</button>
                        ) : (
                            <button onClick={() => setAddNoteOpen(false)} className="mx-[24px] text-l text-gray-300 mt-3">- Cancel Note</button>
                        )
                        }

                        {/*Add Note Text Input if Selected */}
                        {addNoteOpen &&
                            <div className={`mx-[24px] mt-3`}>
                                <SmallTextForm 
                                    label="Extra Notes"
                                    id="extraNotes"
                                    name="extraNotes"
                                    onChange={(e) => setExtraNote(e.target.value)}
                                    value={extraNote}
                                    placeholder=""
                                    className="h-[98px]"
                                />
                            </div>
                        }
                    </>
                    ) : (
                        <>
                        {/* Request and Store Student ID(s) */}
                        <div className="flex mx-[24px] items-center justify-start gap-2 my-4">
                            <label className="text-sm">Student ID(s)</label>
                            <input id="studentID" type="text" value={studentId} onChange={(e) => setStudentID(e.target.value)} placeholder="" className="ml-2 bg-white border border-gray-300 rounded px-1 py-0 focus:outline-none w-1/2"/> 
                        </div>

                        {/* On Task/Off Task Toggle */}
                        <div className="bg-[#129F27] rounded-[30px] p-1 inline-flex mx-[24px]">
                            <button onClick={() => setIsStudentOnTask(true)} className={`rounded-[30px] p-3 ${isStudentOnTask ? 'bg-white text-black' : 'bg-[#129F27] text-white'}`}>On task</button>
                            <button onClick={() => setIsStudentOnTask(false)} className={`rounded-[30px] p-3 ${!isStudentOnTask ? 'bg-white text-black' : 'bg-[#129F27] text-white'}`}>Off task</button>
                        </div>

                        {/* Student Tags Section */}
                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center bg-[var(--light-green-accent)] mt-4">
                            {studentTags.map((tag, index) => (
                                <button key={index} onClick={() => setSelectedStudentTags((prevTags: string[]) => toggleStringInArray(prevTags, tag))} className={`text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedStudentTags.includes(tag) ? 'bg-[var(--green-accent)] text-white' : 'bg-white'}`}>{tag}</button>
                            ))}
                            <button className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300'>+</button>
                        </div>

                        {/* Student Affect Section */}
                        <h1 className="text-xl ml-[24px] mt-6">Affect</h1>

                        <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                            {studentAffects.map((tag, index) => (
                                <button key={index} onClick={() => setSelectedAffectTags((prevTags: string[]) => toggleStringInArray(prevTags, tag))} className={`flex justify-between items-center gap-1.5 text-sm border border-gray-300 py-2 px-2 rounded-xl ${selectedAffectTags.includes(tag) ? 'bg-[var(--green-accent)] text-white' : 'bg-white'}`}>
                                    <span><img src={studentAffectIcons[index]} alt="Emotion Icon" className="w-[24px] h-[24px]"/></span>
                                    {tag}
                                </button>
                            ))}
                        </div>
                        </>
                    )
                }

                    {/*Send Observation/Record Audio Section */}
                    <div className="mx-[24px] bg-[#F8F9FA] flex items-center gap-2 justify-between p-2 rounded-md mt-2 mb-6">
                        <div className="flex-1 max-w-[500px]">
                            <p>Observation Recorded at 11:45 PM</p>
                        </div>
                        <div className="flex gap-2">
                            {!isRecording ?
                                (
                                    <img src={startRecordPng} alt="Start Recording Button" className="w-[36px] h-[36px]" onClick={() => setIsRecording(true)}/>
                                ) :  (
                                    <img src={stopRecordSvg} alt="Stop Recording Button" className="w-[36px] h-[36px]" onClick={() => setIsRecording(false)}/>
                            )}
                            <img src={sendFormSvg} alt="Send Form Button" className="w-[36px] h-[36px]"/>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}