//File Imports
import "./components/SmallTextForm"
import './components/DateForm'

//Package Imports
import { useState, useEffect} from "react";
import SmallTextForm from "./components/SmallTextForm";
import DateForm from "./components/DateForm";
import ChangeTimeModal from "./components/ChangeTimeModal";
import { ArrowRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function StartForm() {
    //Navigation
    const navigate = useNavigate();

    //Holds current time in format '[HOUR]:[MINUTES] [AM/PM]'
    const [currentTime, setCurrentTime] = useState('');
    //State to hold date
    const [date, setDate] = useState<Date | null>(new Date());
    //Determines if change time modal is displayed
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    //Holds user name for text input form and potential error message
    const [username, setUsername] = useState('');
    const [usernameErrorMsg, setUsernameErrorMsg] = useState('');
    //Holds teacher name for text input form and potential error message
    const [teacherName, setTeacherName] = useState('');
    const [teacherNameErrorMsg, setTeacherNameErrorMsg] = useState('');
    //Holds lesson title for text input form and potential error message
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonTitleErrorMsg, setLessonTitleErrorMsg] = useState('');
    //Holds lesson description for text input form and potential error message
    const [lessonDescription, setLessonDescription] = useState('');
    const [lessonDescriptionErrorMsg, setLessonDescriptionErrorMsg] = useState('');
    

    //Function to pull current time from browser
    const retrieveBrowserTime = () => {
        //pull datetime
        const now = new Date();
        //get hours and minutes
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, "0"); //pad minutes so single digits will display like '05' instead of '5'
        //Determine AM or PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
        //Convert hours out of military time
        hours = hours % 12 || 12;

        return `${hours}:${minutes} ${ampm}`;
    }

    //UseEffect statement to set current time to browser time when component mounts and track time
    useEffect(() => {
        setCurrentTime(retrieveBrowserTime());

        
    }, []);

    return (
        <>
            <header className="h-[70px] flex items-center justify-start md:justify-center bg-[var(--accent-color)] p-[24px]">
                <h1 className="text-[24px] text-white">Observation Setup</h1>
            </header>
            
            <div className="w-full max-w-md mx-auto">
                <div className="ml-[24px] mr-[24px] mt-4">
                    <SmallTextForm 
                        label="Your Name"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => {
                            if (!username) setUsernameErrorMsg("Name is required.");
                            //Additional Error Messages
                            else setUsernameErrorMsg('');
                        }}
                        placeholder=""
                        className=""
                    />
                    {/* Display error message for username if it exists */}
                    {usernameErrorMsg && (
                        <p className="text-red-500 text-xs mt-1">{usernameErrorMsg}</p>
                    )}
                </div>

                <div className="mt-8 w-full">
                    {/* Date and Time Header */}
                    <p className="text-[16px] font-medium ml-[24px] mr-[24px] ">Date & Time</p>
                    <button className="text-[36px] font-light ml-[24px] mr-[24px] " onClick={() => setTimeModalOpen(true)}>
                        {currentTime}
                    </button>
                    {/* Show Modal only if timeModalOpen is true */}
                    { timeModalOpen && (
                        <ChangeTimeModal onClose={() => setTimeModalOpen(false)} currentTime={currentTime} onTimeUpdate={(newTime) => setCurrentTime(newTime)}/>
                    )}
                    <DateForm
                        label="Select a date"
                        value={date}
                        onChange={(date) => setDate(date)}
                    />
                </div>

                <div className="ml-[24px] mr-[24px] mt-4">
                    <SmallTextForm 
                        label="Teacher Name"
                        id="teacherName"
                        name="teacherName"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        onBlur={() => {
                            if (!teacherName) setTeacherNameErrorMsg("Name is required.");
                            //Additional Error Messages
                            else setTeacherNameErrorMsg('');
                        }}
                        placeholder=""
                        className=""
                    />
                    {/* Display error message for teacher name if it exists */}
                    {teacherNameErrorMsg && (
                        <p className="text-red-500 text-xs mt-1">{teacherNameErrorMsg}</p>
                    )}
                </div>

                <div className="ml-[24px] mr-[24px] mt-4">
                    <SmallTextForm 
                        label="Lesson Title"
                        id="lessonTitle"
                        name="lessonTitle"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        onBlur={() => {
                            if (!lessonTitle) setLessonTitleErrorMsg("Name is required.");
                            //Additional Error Messages
                            else setLessonTitleErrorMsg('');
                        }}
                        placeholder=""
                        className=""
                    />
                    {/* Display error message for teacher name if it exists */}
                    {lessonTitleErrorMsg && (
                        <p className="text-red-500 text-xs mt-1">{lessonTitleErrorMsg}</p>
                    )}
                </div>

                <div className="ml-[24px] mr-[24px] mt-4">
                    <SmallTextForm 
                        label="Short Lesson Description"
                        id="lessonDescription"
                        name="lessonDescription"
                        value={lessonDescription}
                        onChange={(e) => setLessonDescription(e.target.value)}
                        onBlur={() => {
                            if (!lessonDescription) setLessonDescriptionErrorMsg("Name is required.");
                            //Additional Error Messages
                            else setLessonDescriptionErrorMsg('');
                        }}
                        placeholder=""
                        className="h-[98px]"
                    />
                    {/* Display error message for teacher name if it exists */}
                    {lessonDescriptionErrorMsg && (
                        <p className="text-red-500 text-xs mt-1">{lessonDescriptionErrorMsg}</p>
                    )}
                </div>
                {/*Button to Submit From when Width exceeds 762px for more centeralized design */}
                <button className="hidden md:block mx-auto text-white my-4 px-4 py-2 rounded bg-[var(--accent-color)] text-white" onClick={() => navigate('/observation')}>Start Observation</button>
            </div>

            <footer className="fixed bottom-0 left-0 w-screen flex items-center justify-end bg-[var(--grey-accent)] pr-[24px] py-2.5 md:hidden">
                <button className="mr-[10px] t-[16px]" onClick={() => navigate('/observation')}>Start Observation</button>
                <ArrowRight className="w-[24px] h-[24px] flex-shrink-0"/>
            </footer>
        </>
    )
}
