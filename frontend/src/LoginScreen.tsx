//Package Imports
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

//File Imports
import { loginToBackend } from "./services/loginToBackend";
import LargeTextForm from "./components/Form/LargeTextForm";

export default function LoginScreen() {

    //State to hold username, password, and errorMsg inputs
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    //Set up navigator
    const navigate = useNavigate();

    // Function to handle login form submission
    const handleLogin = async () => {
        try {
            //Use loginToBackend util to attempt login
            const response = await loginToBackend(username, password);

            //If login was successful, navigate to the session options screen
            if (response.success) {
                console.log("Login successful!");
                //Save user id and username in local storage for later use
                localStorage.setItem("user_id", response.result.user_id);
                localStorage.setItem("username", response.result.username);
                navigate("/session-options");
            } else {
                //If login failed, set the error message and remain on login screen
                console.log("Login failed:", response.error);
                setErrorMsg(response.error || "Login failed. Please try again.");
            }
        }
        catch (error) {
            console.error("Error during login:", error);
            setErrorMsg("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
            <div className="w-4/5 max-w-lg py-12 px-5 lg:px-12 bg-white shadow-lg">
                <h1 className="mt-4 text-2xl lg:text-3xl mb-1 text-center">Welcome to ClassEcho!</h1>
                <p className="text-md lg:text-lg mb-8 text-center text-[var(--grey-accent-medium)]">Please log in to your account.</p>

                <LargeTextForm label="Username/Email" placeholder="Enter your username or email" value={username} onChange={(e) => setUsername(e.target.value)} className="mb-6 placeholder:text-[18px] lg:placeholder:text-base" />
                <LargeTextForm label="Password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4 placeholder:text-[18px] lg:placeholder:text-base" />
                <div className="mb-4 text-right">
                    <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-sm text-[var(--accent-color)] cursor-pointer"
                    >
                        Forgot password?
                    </button>
                </div>
                {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

                <button onClick={handleLogin} className="mt-6 w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer">Log In</button>
                <p className="text-md text-center text-[var(--grey-accent-medium)] mt-6 mb-6">
                    Don't have an account? <Link to="/signup" className="text-[var(--accent-color)]">Sign up!</Link>
                </p>
            </div>
        </div>
    );
}
