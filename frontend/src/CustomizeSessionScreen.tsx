//Package Imports
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";

//File Imports
import AddTagModal from "./components/AddTagModal";
import { createSession } from "./utils/createSession";
import { updateUserSessions } from "./utils/updateUserSessions";
import { updateUserEditSessions } from "./utils/updateUserEditSessions";

export default function CustomizeSessionScreen() {
    // Constant Tags for default tags
    //List of Student Tags for Student Observation
    const consStudentBehaviorTags = ["Coding", "Collaborating", "Logging In", "Planning", "Reading Code", "Reading Instructions", "Talking w/ teacher", "Waiting for help", "Debugging", "On Unrelated Tab", "Requesting Help", "Running Code", "Talking w/ peer"];
    const consTeacherBehaviorTags = ["Open-ended questions", "Direct to tasks", "Directs to resources", "Models struggle", "Teaches CT concept", "Manages behavior", "Stretch goals", "Reminds to save code", "Encourages collaboration", "Encourages participation", "Organizes peer tutors", "Organizes paired programming", "Encourages help-seeking", "Teaches collaboration", "Normalizes mistakes", "Connects to student interest"];
    let consFunctionTags = ["Comp Thinking Skills", "Culture", "Independence", "Motivate", "Manage Environment"];
    let consStructureTags = ["Activity", "Help-seeking queue", "LMS", "Rules and Norms", "Snap!"];

    //Navigator
    const navigate = useNavigate();
    const location = useLocation();

    //Get session data passed from previous screen
    const sessionData = location.state || {};

    //State to store the category for which the add tag modal is opened
    const [addTagModalString, setAddTagModalString] = useState('');
    
    //State to store if user is viewing teacher or student customization
    const [viewingTeacher, setViewingTeacher] = useState(true);

    //State to store custom tags for teacher categories
    const [teacherBehaviorTags, setTeacherBehaviorTags] = useState<string[]>([]);
    const [functionTags, setFunctionTags] = useState<string[]>([]);
    const [structureTags, setStructureTags] = useState<string[]>([]);

    //State to store custom tags for student categories
    const [studentTags, setStudentTags] = useState<string[]>([]);

    //UseEffect to prefill tags with default tags if sessionData.defaultTags is true
    useEffect(() => {
        if (sessionData.isDefaultTags) {
            setTeacherBehaviorTags([...consTeacherBehaviorTags]);
            setFunctionTags([...consFunctionTags]);
            setStructureTags([...consStructureTags]);
            setStudentTags([...consStudentBehaviorTags]);
        }
    }, [sessionData.isDefaultTags]);

    //Helper function to add a tag to a specific category
    const addTag = (category: string, value: string) => {
        switch (category) {
            case 'behavior_tags':
                setTeacherBehaviorTags(prev => [...prev, value]);
                break;
            case 'function_tags':
                setFunctionTags(prev => [...prev, value]);
                break;
            case 'structure_tags':
                setStructureTags(prev => [...prev, value]);
                break;
            case 'student_tags':
                setStudentTags(prev => [...prev, value]);
                break;
        }
    };

    //Helper function to remove a tag from a specific category
    const removeTag = (category: string, tagToRemove: string) => {
        switch (category) {
            case 'teacher_behavior':
                setTeacherBehaviorTags(prev => prev.filter(tag => tag !== tagToRemove));
                break;
            case 'function':
                setFunctionTags(prev => prev.filter(tag => tag !== tagToRemove));
                break;
            case 'structure':
                setStructureTags(prev => prev.filter(tag => tag !== tagToRemove));
                break;
            case 'student':
                setStudentTags(prev => prev.filter(tag => tag !== tagToRemove));
                break;
        }
    };

    //Handle creating the session with custom tags
    const handleCreateSession = async () => {
        const userIdRaw = localStorage.getItem("user_id");
        const userId = userIdRaw ? Number(userIdRaw) : undefined;

        const sections = [
            {
                session_segtor: "Teacher",
                section_name: "Behavior",
                tags: teacherBehaviorTags.map(tag_name => ({ tag_name }))
            },
            {
                session_segtor: "Teacher",
                section_name: "Function",
                tags: functionTags.map(tag_name => ({ tag_name }))
            },
            {
                session_segtor: "Teacher",
                section_name: "Structure",
                tags: structureTags.map(tag_name => ({ tag_name }))
            },
            {
                session_segtor: "Student",
                section_name: "Behaviors",
                tags: studentTags.map(tag_name => ({ tag_name }))
            },
        ];

        try {
            const { session_id } = await createSession({
                local_time: new Date().toISOString(),
                observer_name: sessionData.name,
                teacher_name: sessionData.teacherName,
                session_name: sessionData.sessionName,
                lesson_description: sessionData.lessonDescription,
                join_code: sessionData.joinCode,
                observers: userId ? [userId] : undefined,
                editors: userId ? [userId] : undefined,
                sections,
            });

            console.log('Created session id:', session_id);

            //Update user's sessions and edit_sessions arrays in the backend
            await updateUserSessions(userId, session_id);
            await updateUserEditSessions(userId, session_id);

            navigate('/session-options');
        } catch (error) {
            console.error('Failed to create session', error);
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 w-full max-w-[800px] mx-auto h-[51px] bg-[var(--grey-accent)] grid grid-cols-12 items-center">
                <ArrowLeft 
                    className="ml-3 col-span-1 w-[24px] h-[24px] cursor-pointer" 
                    onClick={() => navigate(-1)} 
                />
                <p className="text-center col-span-10 text-base">Customize Session Tags</p>
            </header>

            <div className="w-full flex justify-center items-start min-h-[calc(100vh-51px)] overflow-hidden">
                <div className="max-w-[800px] w-full">
                    <div className="mt-[51px] w-full flex items-center">
                        <button 
                            onClick={() => setViewingTeacher(true)} 
                            className={`text-xl w-1/2 py-3 cursor-pointer ${viewingTeacher ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--light-blue-accent)] text-black'}`}
                        >
                            Teacher
                        </button>
                        <button 
                            onClick={() => setViewingTeacher(false)} 
                            className={`text-xl w-1/2 py-3 cursor-pointer ${!viewingTeacher ? 'bg-[var(--green-accent)] text-white' : 'bg-[var(--light-green-accent)] text-black'}`}
                        >
                            Student
                        </button>
                    </div>

                    {/* Content Switch between teacher and student customization */}
                    {viewingTeacher ? (
                        <>
                            <h2 className="text-xl ml-[24px] mt-4">Behavior (What?)</h2>
                            {/* Behavior Tag Display */}
                            <div className="mt-2">
                                <div className="py-3 px-[24px] w-full">
                                    <div className="flex gap-2 flex-wrap items-center">
                                        {teacherBehaviorTags.map((tag, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                                            >
                                                {tag}
                                                <X 
                                                    className="w-4 h-4 cursor-pointer hover:text-red-500" 
                                                    onClick={() => removeTag('teacher_behavior', tag)}
                                                />
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => setAddTagModalString('behavior')} 
                                            className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer'
                                        >
                                            +
                                        </button>
                                        {addTagModalString === 'behavior' && (
                                            <AddTagModal 
                                                modalHeader={"Add Behavior Tag"} 
                                                tagSection={'behavior_tags'} 
                                                onAddTag={addTag} 
                                                onClose={() => setAddTagModalString('')}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl ml-[24px] mt-4">Function (Why?)</h3>
                            {/* Function Tag Options */}
                            <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                                {functionTags.map((tag, index) => (
                                    <div 
                                        key={index} 
                                        className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                                    >
                                        {tag}
                                        <X 
                                            className="w-4 h-4 cursor-pointer hover:text-red-500" 
                                            onClick={() => removeTag('function', tag)}
                                        />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setAddTagModalString('function')} 
                                    className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer'
                                >
                                    +
                                </button>
                                {addTagModalString === 'function' && (
                                    <AddTagModal 
                                        modalHeader={"Add Function Tag"} 
                                        tagSection={'function_tags'} 
                                        onAddTag={addTag} 
                                        onClose={() => setAddTagModalString('')}
                                    />
                                )}
                            </div>

                            <h4 className="text-xl ml-[24px] mt-4">Structure (With what?)</h4>
                            {/* Structure Tag Options */}
                            <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                                {structureTags.map((tag, index) => (
                                    <div 
                                        key={index} 
                                        className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                                    >
                                        {tag}
                                        <X 
                                            className="w-4 h-4 cursor-pointer hover:text-red-500" 
                                            onClick={() => removeTag('structure', tag)}
                                        />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setAddTagModalString('structure')} 
                                    className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer'
                                >
                                    +
                                </button>
                                {addTagModalString === 'structure' && (
                                    <AddTagModal 
                                        modalHeader={"Add Structure Tag"} 
                                        tagSection={'structure_tags'} 
                                        onAddTag={addTag} 
                                        onClose={() => setAddTagModalString('')}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Student Tags Section */}
                            <h2 className="text-xl ml-[24px] mt-4">Student Behaviors</h2>
                            <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center bg-[var(--light-green-accent)] mt-4">
                                {studentTags.map((tag, index) => (
                                    <div 
                                        key={index} 
                                        className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                                    >
                                        {tag}
                                        <X 
                                            className="w-4 h-4 cursor-pointer hover:text-red-500" 
                                            onClick={() => removeTag('student', tag)}
                                        />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setAddTagModalString('student')} 
                                    className='text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer'
                                >
                                    +
                                </button>
                                {addTagModalString === 'student' && (
                                    <AddTagModal 
                                        modalHeader={"Add Student Tag"} 
                                        tagSection={'student_tags'} 
                                        onAddTag={addTag} 
                                        onClose={() => setAddTagModalString('')}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {/* Create Session Button */}
                    <div className="mx-[24px] mt-6 mb-6">
                        <button 
                            onClick={handleCreateSession}
                            className="w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer"
                        >
                            Create Session
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
