import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import {
  submitContactMessage,
  type ContactRecipient,
} from "@/services/submitContactMessage";

const RECIPIENT_OPTIONS: ReadonlyArray<{ id: ContactRecipient; label: string }> = [
  { id: "lab", label: "Game2Learn Lab" },
  { id: "ally_limke", label: "Dr. Ally Limke" },
  { id: "yasitha_rajapaksha", label: "Yasitha Rajapaksha" },
];

type Feedback = {
  type: "success" | "error";
  message: string;
};

export default function ContactForm() {
  const formId = useId();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [recipients, setRecipients] = useState<ContactRecipient[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !dropdownRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const toggleRecipient = (recipient: ContactRecipient) => {
    setRecipients((current) => (
      current.includes(recipient)
        ? current.filter((value) => value !== recipient)
        : [...current, recipient]
    ));
    setFeedback(null);
  };

  const selectedRecipientLabel = recipients.length === 0
    ? "Select recipient(s)"
    : recipients.length === 1
      ? RECIPIENT_OPTIONS.find((option) => option.id === recipients[0])?.label
      : `${recipients.length} recipients selected`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (recipients.length === 0) {
      setDropdownOpen(true);
      setFeedback({ type: "error", message: "Select at least one recipient." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const result = await submitContactMessage({ recipients, senderEmail, message, website });
    if (result.success) {
      setFeedback({ type: "success", message: result.result.message });
      setRecipients([]);
      setDropdownOpen(false);
      setSenderEmail("");
      setMessage("");
      setWebsite("");
    } else {
      setFeedback({ type: "error", message: result.error });
    }

    setSubmitting(false);
  };

  return (
    <div className="legal-contact-block">
      <div className="legal-contact-directory">
        <p className="legal-contact-subtitle">Researchers in charge</p>
        <div className="legal-contact-name-grid">
          <div className="legal-contact-card">
            <span className="legal-contact-name">Dr. Ally Limke</span>
            <span className="legal-contact-role">Assistant Professor, St. Ambrose University</span>
          </div>
          <div className="legal-contact-card">
            <span className="legal-contact-name">Yasitha Rajapaksha</span>
            <span className="legal-contact-role">Ph.D. Student, NC State University</span>
          </div>
        </div>
      </div>

      <form className="legal-contact-form" onSubmit={handleSubmit}>
        <div className="legal-contact-primary-fields">
          <div className="legal-contact-field">
            <span id={`${formId}-recipient-label`} className="legal-contact-label">Send to</span>
            <div className="legal-contact-dropdown" ref={dropdownRef}>
              <button
                id={`${formId}-recipient-trigger`}
                className="legal-contact-dropdown-trigger"
                type="button"
                aria-labelledby={`${formId}-recipient-label ${formId}-recipient-value`}
                aria-controls={`${formId}-recipient-options`}
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((current) => !current)}
              >
                <span id={`${formId}-recipient-value`}>{selectedRecipientLabel}</span>
                <ChevronDown
                  className={`legal-contact-dropdown-icon${dropdownOpen ? " legal-contact-dropdown-icon--open" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen ? (
                <div
                  id={`${formId}-recipient-options`}
                  className="legal-contact-dropdown-options"
                  role="group"
                  aria-labelledby={`${formId}-recipient-label`}
                >
                  {RECIPIENT_OPTIONS.map((recipient) => (
                    <label key={recipient.id} className="legal-contact-dropdown-option">
                      <input
                        type="checkbox"
                        checked={recipients.includes(recipient.id)}
                        onChange={() => toggleRecipient(recipient.id)}
                      />
                      <span>{recipient.label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <label className="legal-contact-field" htmlFor={`${formId}-email`}>
            <span className="legal-contact-label">Your email</span>
            <input
              id={`${formId}-email`}
              type="email"
              value={senderEmail}
              onChange={(event) => {
                setSenderEmail(event.target.value);
                setFeedback(null);
              }}
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
        </div>

        <label className="legal-contact-field" htmlFor={`${formId}-message`}>
          <span className="legal-contact-label">Message</span>
          <textarea
            id={`${formId}-message`}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setFeedback(null);
            }}
            rows={6}
            maxLength={5000}
            required
          />
          <span className="legal-contact-character-count">{message.length.toLocaleString()} / 5,000</span>
        </label>

        <label className="legal-contact-honeypot" aria-hidden="true">
          Website
          <input
            type="text"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            autoComplete="off"
            tabIndex={-1}
          />
        </label>

        <div className="legal-contact-actions">
          <button className="legal-contact-submit" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send message"}
          </button>
          {feedback ? (
            <p
              className={`legal-contact-feedback legal-contact-feedback--${feedback.type}`}
              role={feedback.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
