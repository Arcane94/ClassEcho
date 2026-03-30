//File Imports
import "./components/Form/SmallTextForm"
import './components/Form/DateForm'

//Package Imports
import { useState, useEffect} from "react";
import SmallTextForm from "./components/Form/SmallTextForm";
import DateForm from "./components/Form/DateForm";
//import ChangeTimeModal from "./components/Modal/ChangeTimeModal";
import { ArrowRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

export default function StartForm() {
    //Navigation
    const navigate = useNavigate();

    //Holds current time in format '[HOUR]:[MINUTES] [AM/PM]'
    const [currentTime, setCurrentTime] = useState('');
    //State to hold date
    const [date, setDate] = useState<Date | null>(new Date());
    //Determines if change time modal is displayed
    //const [timeModalOpen, setTimeModalOpen] = useState(false);
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

    

    //Async function to handle submission of form 
    const handleFormSubmission = async () => {
        //Save browser date
        const local_time = new Date();
        //Prepare data to send to server
        const payload = {
            observer_name: username,
            teacher_name: teacherName,
            session_name: lessonTitle,
            lesson_description: lessonDescription,
            local_time,
        };

        try {
            //Send Post call to backend with form data
            const res = await fetch(`${API_BASE_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });
            console.log('Request Sent');
            //Check Response
            if (!res.ok) {
                throw new Error("Failed to create session in DB");
            }

            //Get Data back from response
            const data = await res.json();
            console.log('Data', data.session_id);
            //Use sessionId from response to navigate to observation page with the new session id embedded in the url
            if (data.session_id) {
                navigate(`/observation?sessionId=${data.session_id}`);
            } else {
                //Otherwise throw an error
                throw new Error("Session ID missing in response");
            }
        } catch (error) {
            console.error("Error submitting session form:", error);
        }


    }

    //useEffect statement to continously update time shown in form so that it always matches current browser time
    useEffect(() => {
        const updateTime = () => {
          const now = new Date();
          let hours = now.getHours();
          const minutes = now.getMinutes().toString().padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12 || 12;
          setCurrentTime(`${hours}:${minutes} ${ampm}`);
        };
      
        // Update immediately
        updateTime();
      
        // Update every second
        const intervalId = setInterval(updateTime, 1000);
      
        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
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
                            if (username.length > 100) setUsernameErrorMsg("Name cannot be longer than 100 characters.")
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
                    <button className="text-[36px] font-light ml-[24px] mr-[24px] ">
                        {currentTime}
                    </button>
                    {/* Show Modal only if timeModalOpen is true */}
                    {/* { timeModalOpen && (
                        <ChangeTimeModal onClose={() => setTimeModalOpen(false)} currentTime={currentTime} onTimeUpdate={(newTime) => setCurrentTime(newTime)}/>
                    )} */}
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
                            if (!teacherName) setTeacherNameErrorMsg("Teacher Name is required.");
                            if (teacherName.length > 100) setTeacherNameErrorMsg("Teacher Name cannot be longer than 100 characters.");
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
                            if (!lessonTitle) setLessonTitleErrorMsg("Lesson Title is required.");
                            if (lessonTitle.length > 100) setLessonTitleErrorMsg("Lesson Title cannot be longer than 200 characters.");

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
                        placeholder=""
                        className="h-[98px]"
                    />
                </div>
                {/*Button to Submit From when Width exceeds 762px for more centeralized design */}
                <button className="hidden md:block mx-auto text-white my-4 px-4 py-2 rounded bg-[var(--accent-color)]" style={{ cursor: 'pointer' }} onClick={() => handleFormSubmission()}>Start Observation</button>
            </div>

            <footer className="fixed bottom-0 left-0 w-screen flex items-center justify-end bg-[var(--grey-accent)] pr-[24px] py-2.5 md:hidden">
                <div className="flex" style={{ cursor: 'pointer' }} onClick={() => handleFormSubmission()}>
                    <button className="mr-[10px] t-[16px]" style={{ cursor: 'pointer' }}>Start Observation</button>
                    <ArrowRight className="w-[24px] h-[24px] flex-shrink-0" style={{ cursor: 'pointer' }}/>
                </div>
            </footer>
        </>
    )
}
