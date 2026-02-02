//Package Imports
import { useNavigate } from "react-router-dom";
import { PlusCircle, Layers, ArrowLeft } from "lucide-react";


export default function SessionOptionsScreen() {
    //Set up navigator
    const navigate = useNavigate();

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
            <div className="relative w-4/5 max-w-lg py-12 px-5 lg:px-12 bg-white shadow-lg">
                <ArrowLeft className="absolute top-4 left-4 w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />
                <h1 className="mt-4 text-2xl lg:text-3xl mb-1 text-center">Welcome to ClassEcho!</h1>
                <p className="text-md lg:text-lg mb-8 text-center text-[var(--grey-accent-medium)]">How would you like to proceed</p>

                <div className="flex items-center justify-center border border-[var(--grey-accent-medium)] shadow-lg rounded-lg py-2 px-2 gap-4" onClick={() => navigate("/join-existing")}>
                    {/* Icon Div */}
                    <div className="rounded-lg bg-[var(--accent-color)] p-2">
                        <PlusCircle style={{ color: 'black'}} size={30} />
                    </div>
                    {/* Text div */}
                    <div>
                        <p className="font-semibold text-md mb-1">Create New Session</p>
                        <p className="text-[var(--grey-accent-medium)] text-xs">Create your own observation session that other users may join</p>
                    </div>
                </div>

                <div className="flex items-center mt-6 justify-center border border-[var(--grey-accent-medium)] shadow-lg rounded-lg py-2 px-2 gap-4" onClick={() => navigate("/create-new")}>
                    {/* Icon Div */}
                    <div className="rounded-lg bg-[var(--green-accent)] p-2">
                        <Layers style={{ color: 'black'}} size={30} />
                    </div>
                    {/* Text div */}
                    <div>
                        <p className="font-semibold text-md mb-1">Join Existing Session</p>
                        <p className="text-[var(--grey-accent-medium)] text-xs">Enter a join code to participate in an existing observation session</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
