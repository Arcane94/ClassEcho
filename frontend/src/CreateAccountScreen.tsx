//Package Imports
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

//File Imports
import { createAccountOnBackend } from "./services/createAccountOnBackend";
import LargeTextForm from "./components/Form/LargeTextForm";

export default function CreateAccountScreen() {
    //State to hold username, email, password, and errorMsg inputs
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    //Set up navigator
    const navigate = useNavigate();

    // Function to handle account creation form submission
    const handleCreateAccount = async () => {
        try {
            const response = await createAccountOnBackend(username, email, password);

            if (response.success) {
                console.log("Account created successfully!");
                navigate("/");
            } else {
                console.log("Account creation failed:", response.error);
                setErrorMsg(response.error || "Account creation failed. Please try again.");
            }
        } catch (error) {
            console.error("Error during account creation:", error);
            setErrorMsg("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
            <div className="w-4/5 max-w-lg py-12 px-5 lg:px-12 bg-white shadow-lg">
                <h1 className="mt-4 mb-5 text-2xl lg:text-3xl mb-1 text-center">Create your ClassEcho account!</h1>
                <LargeTextForm label="Username" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} className="mb-6 placeholder:text-[18px] lg:placeholder:text-base " />
                <LargeTextForm label="Email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-6 placeholder:text-[18px] lg:placeholder:text-base " />
                <LargeTextForm label="Password" placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4 placeholder:text-[18px] lg:placeholder:text-base" />
                {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

                <button onClick={handleCreateAccount} className="mt-6 w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer">Sign Up</button>
                <p className="text-md text-center text-[var(--grey-accent-medium)] mt-6 mb-6">
                    Already have an account? <Link to="/" className="text-[var(--accent-color)]">Log in!</Link>
                </p>
            </div>
        </div>
    );
}
