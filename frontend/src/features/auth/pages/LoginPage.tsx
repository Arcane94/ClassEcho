//Package Imports
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";

//File Imports
import { loginToBackend } from "@/services/loginToBackend";

export default function LoginPage() {

    //State to hold username, password, and errorMsg inputs
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    //Set up navigator
    const navigate = useNavigate();

    // Function to handle login form submission
    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!username.trim()) {
            setErrorMsg("Enter your username or email.");
            return;
        }

        if (!password) {
            setErrorMsg("Enter your password.");
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const response = await loginToBackend(username, password);

            if (response.success) {
                localStorage.setItem("user_id", String(response.result.user_id));
                localStorage.setItem("username", response.result.username);
                navigate("/apps");
                return;
            }

            setErrorMsg(response.error || "Login failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-shell">
                <section className="login-showcase">
                    <div className="login-intro">
                        <div className="login-brand">
                            <img
                                src="/logo/logo.png"
                                alt="ClassEcho"
                                className="login-brand-logo"
                            />
                        </div>
                        <p className="login-eyebrow">Classroom observation and visualization</p>
                        <h1 className="login-title">Turn classroom observation into actionable insight.</h1>
                        <p className="login-subtitle">
                            ClassEcho helps researchers capture student-teacher interactions, visualize patterns, and move from live observation to meaningful analysis faster.
                        </p>
                    </div>

                    <div className="login-feature-grid">
                        <article className="login-feature-card">
                            <span className="login-feature-label">Live Observation</span>
                            <h2 className="login-feature-title">Capture classroom activity with a clean interface.</h2>
                            <p className="login-feature-copy">
                                Start or join observation sessions quickly and document interactions as they happen with our intuitive interface.
                            </p>
                        </article>
                        <article className="login-feature-card">
                            <span className="login-feature-label">Visualization & Analysis</span>
                            <h2 className="login-feature-title">Replay observations and visualize interaction patterns.</h2>
                            <p className="login-feature-copy">
                                Review observation data through a cleaner interface built to support classroom research, reflection, and follow-up analysis.
                            </p>
                        </article>
                    </div>
                </section>

                <section className="login-panel">
                    <div className="login-panel-header">
                        <span className="login-panel-kicker">Welcome Back</span>
                        <h2 className="login-panel-title">Sign in to ClassEcho</h2>
                        <p className="login-panel-copy">
                            Use your credentials to login or create a new account.
                        </p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="login-field">
                            <label className="login-label" htmlFor="username">
                                Username or email
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                placeholder="Enter your username or email"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
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
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errorMsg) {
                                        setErrorMsg("");
                                    }
                                }}
                                className="login-input"
                                required
                            />
                        </div>

                        <div className="login-form-meta">
                            <Link to="/forgot-password" className="login-link">
                                Forgot password?
                            </Link>
                        </div>

                        {errorMsg && (
                            <p className="login-error" role="alert" aria-live="polite">
                                {errorMsg}
                            </p>
                        )}

                        <button type="submit" className="login-submit" disabled={isSubmitting}>
                            {isSubmitting ? "Signing in..." : "Log In"}
                        </button>
                    </form>

                    <p className="login-footer">
                        Don&apos;t have an account? <Link to="/signup" className="login-link">Create one here</Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
