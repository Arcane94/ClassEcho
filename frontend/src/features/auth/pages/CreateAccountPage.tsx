import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/features/auth/components/AuthShell";
import { createAccountOnBackend } from "@/services/createAccountOnBackend";

export default function CreateAccountPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdAccount, setCreatedAccount] = useState<{ username: string; email: string } | null>(null);
    const navigate = useNavigate();

    const validateForm = () => {
        if (username.trim().length < 3) {
            return "Username must be at least 3 characters long.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return "Enter a valid email address.";
        }

        if (password.length < 8) {
            return "Password must be at least 8 characters long.";
        }

        return "";
    };

    const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const response = await createAccountOnBackend(username.trim(), email.trim(), password);

            if (response.success) {
                setCreatedAccount({
                    username: username.trim(),
                    email: email.trim(),
                });
                return;
            }

            setErrorMsg(response.error || "Account creation failed. Please try again.");
        } catch (error) {
            console.error("Error during account creation:", error);
            setErrorMsg("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthShell
            panelKicker="Create Account"
            panelTitle={createdAccount ? "Account created" : "Join ClassEcho"}
            panelDescription={
                createdAccount
                    ? "Your account is ready. Return to the login page and sign in with your new credentials."
                    : "Use your institutional email or preferred login details to create your workspace account."
            }
            footer={(
                <p className="login-footer">
                    Already have an account? <Link to="/" className="login-link">Log in</Link>
                </p>
            )}
        >
            {createdAccount ? (
                <div className="auth-success" role="status" aria-live="polite">
                    <div className="auth-success-card">
                        <h3 className="auth-success-title">Account created successfully</h3>
                        <p className="auth-success-copy">
                            Username: <strong>{createdAccount.username}</strong>
                        </p>
                        <p className="auth-success-copy">
                            Email: <strong>{createdAccount.email}</strong>
                        </p>
                        <button
                            type="button"
                            className="login-submit"
                            onClick={() => navigate("/")}
                        >
                            Go To Login
                        </button>
                    </div>
                </div>
            ) : (
                <form className="auth-form" onSubmit={handleCreateAccount}>
                    <div className="login-field">
                        <label className="login-label" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(event) => {
                                setUsername(event.target.value);
                                if (errorMsg) {
                                    setErrorMsg("");
                                }
                            }}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                if (errorMsg) {
                                    setErrorMsg("");
                                }
                            }}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Choose a password"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
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
                        {isSubmitting ? "Creating account..." : "Create Account"}
                    </button>
                </form>
            )}
        </AuthShell>
    );
}
