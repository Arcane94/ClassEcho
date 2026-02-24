//Package Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

//File Imports
import LargeTextForm from "./components/LargeTextForm";
import { getUserIDFromUsername } from "./utils/getUserIDFromUsername";

export default function ForgotPasswordScreen() {
    //State to hold username/email input
    const [usernameOrEmail, setUsernameOrEmail] = useState("");

    //Set up navigator
    const navigate = useNavigate();

    //Use util to retrieve the user id associated with the provided login, then proceed into password reset
    const handleContinue = async () => {
        const result = await getUserIDFromUsername(usernameOrEmail);
        if (result.success) {
            console.log(`[${new Date().toISOString()}] Retrieved user ID for username/email: ${usernameOrEmail}`);
            navigate("/reset-password", { state: { user_id: result.user_id } });
        } else {
            alert("Failed to find user. Please try again.");
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)] p-4">
            <div className="relative w-4/5 max-w-lg max-h-[85vh] overflow-y-auto py-12 px-5 lg:px-12 bg-white shadow-lg">
                <ArrowLeft className="absolute top-4 left-4 w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />
                <h1 className="mt-4 text-2xl lg:text-3xl mb-1 text-center">Forgot Password</h1>
                <p className="text-md lg:text-lg mb-8 text-center text-[var(--grey-accent-medium)]">Enter your username or email to continue.</p>

                <LargeTextForm
                    label="Username/Email"
                    placeholder="Enter your username or email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="mb-4 placeholder:text-[18px] lg:placeholder:text-base"
                />

                <button onClick={handleContinue} className="mt-6 w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer">Continue</button>
            </div>
        </div>
    );
}
