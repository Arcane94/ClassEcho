import LegalDocumentPage from "@/features/auth/components/LegalDocumentPage";
import ContactForm from "@/features/auth/components/ContactForm";

const sections = [
    {
        title: "Acceptance of Terms",
        paragraphs: [
            "By using ClassEcho, you agree to use the platform in accordance with these Terms of Use and any policies or institutional requirements that apply to your classroom, school, or research setting.",
        ],
    },
    {
        title: "Permitted Use",
        bullets: [
            "Use ClassEcho for classroom observation, replay, reflection, research, and educational analysis.",
            "Use the platform only if you are authorized to access the relevant classroom, session, or data.",
            "Follow applicable school, district, university, and research-governance requirements when collecting or reviewing classroom data.",
        ],
    },
    {
        title: "User Responsibilities",
        bullets: [
            "Provide accurate account information and keep your login credentials secure.",
            "Use care when entering observation data and session information.",
            "Do not use the platform in a way that disrupts service, bypasses access controls, or exposes data to unauthorized parties.",
        ],
    },
    {
        title: "Observation and Uploaded Data",
        paragraphs: [
            "You are responsible for ensuring that any classroom observations, uploads, and related data entered into ClassEcho are collected and used in compliance with applicable policies, approvals, and laws.",
            "If you connect SnapClass data, you are responsible for obtaining and maintaining the right to access and use SnapClass and its stored classroom data.",
        ],
    },
    {
        title: "SnapClass Integration",
        paragraphs: [
            <>
                SnapClass is another tool by Game2Learn Lab at North Carolina State University. ClassEcho can optionally use
                data from{" "}
                <a
                    href="https://lin-class17.csc.ncsu.edu/snapclass/"
                    target="_blank"
                    rel="noreferrer"
                    className="login-link"
                >
                    SnapClass
                </a>{" "}
                for the student code view in Visualization Mode.
            </>,
            "That integration is optional and not required for the rest of the platform.",
            "If you use SnapClass with ClassEcho, you should also review the privacy policy and terms of use provided in SnapClass.",
        ],
    },
    {
        title: "Availability and Changes",
        paragraphs: [
            "ClassEcho is provided on an as-available basis. Features may change over time, and administrators may modify, limit, or suspend access as needed.",
        ],
    },
    {
        title: "Contact",
        paragraphs: [
            "For questions or other inquiries, contact the Game2Learn Lab at NC State University or the researchers in charge.",
        ],
        customContent: <ContactForm />,
    },
] as const;

export default function TermsOfUsePage() {
    return (
        <LegalDocumentPage
            title="Terms of Use"
            description="The core expectations for using ClassEcho responsibly in classroom, educational, and research settings."
            lastUpdated="April 2026"
            sections={[...sections]}
        />
    );
}
