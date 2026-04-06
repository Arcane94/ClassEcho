import type { ReactNode } from "react";

interface AuthShellProps {
    panelKicker: string;
    panelTitle: string;
    panelDescription: string;
    children: ReactNode;
    footer?: ReactNode;
    backAction?: ReactNode;
}

export default function AuthShell({
    panelKicker,
    panelTitle,
    panelDescription,
    children,
    footer,
    backAction,
}: AuthShellProps) {
    return (
        <div className="login-page auth-page">
            <div className="auth-shell">
                <section className="login-panel auth-panel">
                    {backAction ? <div className="auth-back-row">{backAction}</div> : null}

                    <div className="auth-panel-brand">
                        <img
                            src="/logo/logo.png"
                            alt="ClassEcho"
                            className="auth-panel-logo"
                        />
                    </div>

                    <div className="login-panel-header auth-panel-header">
                        <span className="login-panel-kicker">{panelKicker}</span>
                        <h2 className="login-panel-title">{panelTitle}</h2>
                        <p className="login-panel-copy">{panelDescription}</p>
                    </div>

                    {children}

                    {footer ? footer : null}
                </section>
            </div>
        </div>
    );
}
