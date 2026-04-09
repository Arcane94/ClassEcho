import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type LegalSection = {
    title: string;
    paragraphs?: readonly ReactNode[];
    bullets?: readonly ReactNode[];
    customContent?: ReactNode;
};

type LegalDocumentPageProps = {
    title: string;
    description: string;
    lastUpdated: string;
    sections: LegalSection[];
};

export default function LegalDocumentPage({
    title,
    description,
    lastUpdated,
    sections,
}: LegalDocumentPageProps) {
    return (
        <div className="login-page auth-page">
            <div className="legal-shell">
                <section className="login-panel legal-panel">
                    <div className="legal-header">
                        <Link to="/" className="auth-back-button" aria-label="Back to login">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="legal-header-main">
                            <img
                                src="/logo/logo.png"
                                alt="ClassEcho"
                                className="auth-panel-logo legal-header-logo"
                            />
                            <div className="login-panel-header auth-panel-header legal-header-copy">
                                <h1 className="login-panel-title legal-header-title">{title}</h1>
                                <p className="login-panel-copy legal-header-description">
                                    {description}
                                </p>
                            </div>
                        </div>
                        <div className="legal-header-spacer" aria-hidden="true" />
                    </div>

                    <div className="legal-meta">
                        <span className="legal-meta-pill">Last updated {lastUpdated}</span>
                    </div>

                    <div className="legal-doc">
                        {sections.map((section) => (
                            <section key={section.title} className="legal-doc-section">
                                <h2 className="legal-doc-title">{section.title}</h2>
                                {section.paragraphs?.map((paragraph, idx) => (
                                    <p key={`${section.title}-p-${idx}`} className="legal-doc-copy">
                                        {paragraph}
                                    </p>
                                ))}
                                {section.bullets?.length ? (
                                    <ul className="legal-doc-list">
                                        {section.bullets.map((bullet, idx) => (
                                            <li key={`${section.title}-b-${idx}`} className="legal-doc-list-item">
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                {section.customContent ? section.customContent : null}
                            </section>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
