import LegalDocumentPage from "@/features/auth/components/LegalDocumentPage";

const sections = [
    {
        title: "Overview",
        paragraphs: [
            "ClassEcho is used to support classroom observation, replay, and analysis workflows for research and educational use.",
            "ClassEcho is owned by the Game2Learn lab at North Carolina State University.",
            "This Privacy Policy explains what information may be processed when you use the platform and how that information is used within the product.",
        ],
    },
    {
        title: "Information We May Process",
        bullets: [
            "Account information such as username, email address, and password-related records needed for authentication.",
            "Observation data entered by users, including session details and teacher or student observation logs.",
            "Visualization data entered by users including seating charts and replay windows.",
            "Student code snapshots from SnapClass integration.",
            "Basic technical information needed to keep the app working, such as browser-local session values and request metadata.",
        ],
    },
    {
        title: "How Information Is Used",
        bullets: [
            "Authenticate users and manage access to the platform.",
            "Store and replay classroom observation sessions.",
            "Generate visualizations, filters, cumulative views, and optional code playback.",
            "Maintain, troubleshoot, and improve the platform.",
        ],
    },
    {
        title: "SnapClass Integration",
        paragraphs: [
            <>
                SnapClass is another tool owned by Game2Learn Lab at North Carolina State University. ClassEcho reads
                student coding data from the{" "}
                <a
                    href="https://lin-class17.csc.ncsu.edu/snapclass/"
                    target="_blank"
                    rel="noreferrer"
                    className="login-link"
                >
                    SnapClass
                </a>{" "}
                database to support the student code view in Visualization Mode.
            </>,
            <>
                If SnapClass is not used, the rest of ClassEcho remains functional.
                Observation Mode, visualization replay, seating charts, logs, and
                cumulative analysis are not dependent on SnapClass. If you use
                SnapClass, you should also review the privacy policy and terms of use
                provided in that tool.
            </>,
        ],
    },
    {
        title: "Sharing and Access",
        paragraphs: [
            "We do not sell your data or share with third parties.",
            "Access to stored data is limited to authorized researchers, administrators, or technical operators responsible for the deployment and operation of ClassEcho.",
            "Information may also be disclosed if required for security, legal compliance, or protection of the platform and its users.",
        ],
    },
    {
        title: "Research Use",
        paragraphs: [
            "We may use your anonymized data for research purposes.",
            "We will also obtain Institutional Review Board approval from North Carolina State University before using data in research where that approval is required.",
        ],
    },
    {
        title: "Retention and Security",
        paragraphs: [
            "We retain your data indefinitely. You can delete your data from ClassEcho at any time by deleting the sessions you created or deleteing your account.",
            "We use reasonable technical and administrative safeguards to protect stored data, but no system can guarantee absolute security.",
        ],
    },
    {
        title: "Contact",
        paragraphs: ["Support email: game2learnlab@ncsu.edu"],
        customContent: (
            <div className="legal-contact-block">
                <p className="legal-contact-subtitle">Researchers in charge</p>
                <div className="legal-contact-grid">
                    <div className="legal-contact-card">
                        <span className="legal-contact-name">Dr. Ally Limke</span>
                        <span className="legal-contact-email">anlimke@ncsu.edu</span>
                    </div>
                    <div className="legal-contact-card">
                        <span className="legal-contact-name">Yasitha Rajapaksha</span>
                        <span className="legal-contact-email">yrajapa@ncsu.edu</span>
                    </div>
                </div>
            </div>
        ),
    },
] as const;

export default function PrivacyPolicyPage() {
    return (
        <LegalDocumentPage
            title="Privacy Policy"
            description="How ClassEcho handles account data, classroom observation records, and optional SnapClass-connected visualization data."
            lastUpdated="April 2026"
            sections={[...sections]}
        />
    );
}
