import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/features/auth/components/AuthShell";
import { requestPasswordResetCode } from "@/services/requestPasswordResetCode";

export default function ForgotPasswordPage() {
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!usernameOrEmail.trim()) {
            setErrorMsg("Please enter your username or email.");
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const result = await requestPasswordResetCode(usernameOrEmail.trim());

            if (result.success) {
                navigate("/reset-password", { state: { identifier: usernameOrEmail.trim() } });
                return;
            }

            setErrorMsg(result.error || "Failed to send reset code. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthShell
            panelKicker="Forgot Password"
            panelTitle="Request a reset code"
            panelDescription="We'll send a verification code to your account so you can securely reset your password."
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
                    Remembered it? <Link to="/" className="login-link">Back to login</Link>
                </p>
            )}
        >
            <form className="auth-form" onSubmit={handleContinue}>
                <div className="login-field">
                    <label className="login-label" htmlFor="identifier">
                        Username or email
                    </label>
                    <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your username or email"
                        value={usernameOrEmail}
                        onChange={(event) => {
                            setUsernameOrEmail(event.target.value);
                            if (errorMsg) {
                                setErrorMsg("");
                            }
                        }}
                        className="login-input"
                        required
                    />
                </div>

                {errorMsg ? (
                    <p className="login-error" role="alert" aria-live="polite">
                        {errorMsg}
                    </p>
                ) : null}

                <button type="submit" className="login-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending code..." : "Continue"}
                </button>
            </form>
        </AuthShell>
    );
}
