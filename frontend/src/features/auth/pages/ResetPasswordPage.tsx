import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "@/features/auth/components/AuthShell";
import { resetUserPassword } from "@/services/resetUserPassword";
import { verifyPasswordResetCode } from "@/services/verifyPasswordResetCode";

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const identifier = location.state?.identifier;

    const validateForm = () => {
        if (!identifier) {
            return "Missing username/email. Please restart password reset.";
        }

        if (!/^\d{6}$/.test(resetCode.trim())) {
            return "Enter the 6-digit reset code from your email.";
        }

        if (newPassword.length < 8) {
            return "New password must be at least 8 characters long.";
        }

        if (newPassword !== confirmPassword) {
            return "Passwords do not match.";
        }

        return "";
    };

    const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
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

            navigate("/");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthShell
            panelKicker="Reset Password"
            panelTitle="Finish password recovery"
            panelDescription="Enter the code from your email, then choose a new password for your account."
            backAction={(
                <button
                    type="button"
                    className="auth-back-button"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
            )}
            footer={(
                <p className="login-footer">
                    Need another code? <Link to="/forgot-password" className="login-link">Start again</Link>
                </p>
            )}
        >
            <form className="auth-form" onSubmit={handleResetPassword}>
                {identifier ? (
                    <p className="auth-context-text">Resetting password for {identifier}</p>
                ) : null}

                <div className="login-field">
                    <label className="login-label" htmlFor="resetCode">
                        Verification code
                    </label>
                    <input
                        id="resetCode"
                        name="resetCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter the code from your email"
                        value={resetCode}
                        onChange={(event) => {
                            setResetCode(event.target.value);
                            if (errorMsg) {
                                setErrorMsg("");
                            }
                        }}
                        className="login-input"
                        required
                    />
                </div>

                <div className="login-field">
                    <label className="login-label" htmlFor="newPassword">
                        New password
                    </label>
                    <div className="auth-password-wrap">
                        <input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Enter your new password"
                            value={newPassword}
                            onChange={(event) => {
                                setNewPassword(event.target.value);
                                if (errorMsg) {
                                    setErrorMsg("");
                                }
                            }}
                            className="login-input auth-password-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword((value) => !value)}
                            className="auth-password-toggle"
                            aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                        >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="login-field">
                    <label className="login-label" htmlFor="confirmPassword">
                        Confirm password
                    </label>
                    <div className="auth-password-wrap">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                if (errorMsg) {
                                    setErrorMsg("");
                                }
                            }}
                            className="login-input auth-password-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            className="auth-password-toggle"
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {errorMsg ? (
                    <p className="login-error" role="alert" aria-live="polite">
                        {errorMsg}
                    </p>
                ) : null}

                <button type="submit" className="login-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Resetting password..." : "Reset Password"}
                </button>
            </form>
        </AuthShell>
    );
}
