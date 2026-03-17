//Package Imports
import { useState } from "react";

//File Imports
import LargeTextForm from "./components/LargeTextForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CreateNewSessionScreen() {
    //Set up navigator
    const navigate = useNavigate();
    
    const [name, setName] = useState("");
    const [teacherName, setTeacherName] = useState("");
    const [sessionName, setSessionName] = useState("");
    const [lessonDescription, setLessonDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isDefaultTags, setIsDefaultTags] = useState(false);

    const generateJoinCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i += 1) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setJoinCode(code);
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)] overflow-hidden py-4">
            <div className="relative w-4/5 max-w-lg py-12 px-5 lg:px-12 bg-white shadow-lg max-h-[calc(100vh-2rem)] overflow-y-auto">
                <ArrowLeft className="absolute top-4 left-4 w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />
                <h1 className="mt-4 text-2xl lg:text-3xl mb-1 text-center">Create a New Session</h1>
                <p className="text-md lg:text-lg mb-8 text-center text-[var(--grey-accent-medium)]">Enter your session details below.</p>

                <LargeTextForm
                    label="Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mb-6 placeholder:text-[18px] lg:placeholder:text-base"
                />

                <LargeTextForm
                    label="Teacher Name"
                    placeholder="Enter teacher name"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="mb-6 placeholder:text-[18px] lg:placeholder:text-base"
                />

                <LargeTextForm
                    label="Session Name"
                    placeholder="Enter session name"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="mb-6 placeholder:text-[18px] lg:placeholder:text-base"
                />

                <div className="flex flex-col mb-6">
                    <label className="text-md lg:text-lg font-medium">Lesson Description</label>
                    <textarea
                        value={lessonDescription}
                        onChange={(e) => setLessonDescription(e.target.value)}
                        placeholder="Enter lesson description"
                        className="mt-1 pl-5 py-3 border rounded-lg focus:outline-none text-sm lg:text-base h-24 placeholder:text-[18px] lg:placeholder:text-base resize-none"
                        style={{ borderColor: "black" }}
                    />
                </div>

                <div className="flex flex-col mb-6">
                    <label className="text-md lg:text-lg font-medium">Join Code</label>
                    <div className="mt-1 flex gap-3">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Enter join code"
                            className="pl-5 py-3 border rounded-lg focus:outline-none text-md lg:text-lg flex-1 placeholder:text-[18px] lg:placeholder:text-base"
                            style={{ borderColor: "black" }}
                        />
                        <button
                            type="button"
                            onClick={generateJoinCode}
                            className="bg-[var(--green-accent)] text-white text-md lg:text-lg px-4 py-3 rounded-sm cursor-pointer"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 mb-6">
                    <div className={`flex flex-col text-white text-md lg:text-lg py-4 px-3 rounded-sm cursor-pointer ${!isDefaultTags ? "bg-[var(--medium-blue-accent)]" : "bg-[var(--grey-accent)]"}`} onClick={() => setIsDefaultTags(false)}>
                        <p className={`text-center mb-2 ${!isDefaultTags ? "text-white" : "text-black"}`}>Custom Tags</p>
                        <p className="text-xs text-center lg:text-sm text-[var(--grey-accent-medium)]">Fully customize your tags for this observation session</p> 
                    </div>
                    <div className={`flex flex-col text-white text-md lg:text-lg py-4 px-3 rounded-sm cursor-pointer ${isDefaultTags ? "bg-[var(--medium-blue-accent)]" : "bg-[var(--grey-accent)]"}`} onClick={() => setIsDefaultTags(true)}>
                        <p className={`text-center mb-2 ${isDefaultTags ? "text-white" : "text-black"}`}>Default Tags</p>
                        <p className="text-xs text-center lg:text-sm text-[var(--grey-accent-medium)]">Start this session with the default tags already added</p> 
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/customize-session', { 
                        state: { name, teacherName, sessionName, lessonDescription, joinCode, isDefaultTags } 
                    })}
                    className="mt-2 w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
