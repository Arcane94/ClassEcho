//Package Imports
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { resetUserPassword } from "./services/resetUserPassword";
import { verifyPasswordResetCode } from "./services/verifyPasswordResetCode";

export default function ResetPasswordScreen() {
    //State to hold new password values
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    //Set up navigator
    const navigate = useNavigate();

    //Location state to pull identifier
    const location = useLocation();
    const identifier = location.state?.identifier;

    //Calls util function to reset the uesr's password to the new value and navigates back to login
    const handleResetPassword = async () => {
        if (!identifier) {
            setErrorMsg("Missing username/email. Please restart password reset.");
            return;
        }

        if (!resetCode.trim()) {
            setErrorMsg("Please enter the reset code from your email.");
            return;
        }

        if (!newPassword || !confirmPassword) {
            setErrorMsg("Please fill out both password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            return;
        }

        const verifyResult = await verifyPasswordResetCode(identifier, resetCode.trim());
        if (!verifyResult.success) {
            setErrorMsg(verifyResult.error || "Invalid reset code.");
            return;
        }

        const resetResult = await resetUserPassword(identifier, resetCode.trim(), newPassword);
        if (!resetResult.success) {
            setErrorMsg(resetResult.error || "Failed to reset password.");
            return;
        }
        setErrorMsg("");
        console.log(`[${new Date().toISOString()}] Password reset successful for identifier: ${identifier}`);
        navigate("/");
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)] p-4">
            <div className="relative w-4/5 max-w-lg max-h-[85vh] overflow-y-auto py-12 px-5 lg:px-12 bg-white shadow-lg">
                <ArrowLeft className="absolute top-4 left-4 w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />
                <h1 className="mt-4 text-2xl lg:text-3xl mb-1 text-center">Reset Password</h1>
                <p className="text-md lg:text-lg mb-8 text-center text-[var(--grey-accent-medium)]">Enter the code from your email, then set a new password.</p>

                <div className="flex flex-col mb-6">
                    <label className="text-md lg:text-lg font-medium">Verification Code</label>
                    <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="mt-1 pl-5 pr-5 py-3 border rounded-lg focus:outline-none text-md lg:text-lg"
                        style={{ borderColor: "black" }}
                    />
                </div>

                <div className="flex flex-col mb-6">
                    <label className="text-md lg:text-lg font-medium">New Password</label>
                    <div className="relative mt-1">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full pl-5 pr-12 py-3 border rounded-lg focus:outline-none text-md lg:text-lg"
                            style={{ borderColor: "black" }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--grey-accent-medium)]"
                        >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col mb-4">
                    <label className="text-md lg:text-lg font-medium">Confirm Password</label>
                    <div className="relative mt-1">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full pl-5 pr-12 py-3 border rounded-lg focus:outline-none text-md lg:text-lg"
                            style={{ borderColor: "black" }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--grey-accent-medium)]"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

                <button onClick={handleResetPassword} className="mt-6 w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer">Reset Password</button>
            </div>
        </div>
    );
}
