// Observation workflow page for joining a session by join code.
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ObservationPanelLayout from "@/features/observation-mode/components/ObservationPanelLayout";
import ObservationTextField from "@/features/observation-mode/components/ObservationTextField";
import { getSessionByJoinCode, type SessionInfo } from "@/services/getSessionByJoinCode";

export default function JoinExistingSessionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [name, setName] = useState(localStorage.getItem("username") || "");
  const [joinCode, setJoinCode] = useState((searchParams.get("joinCode") || "").toUpperCase());
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionPreview, setSessionPreview] = useState<SessionInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const normalizedJoinCode = joinCode.trim().toUpperCase();
  const hasMinimumJoinCodeLength = normalizedJoinCode.length >= 8;
  const canJoinSession = Boolean(sessionPreview) && !isSearching;

  useEffect(() => {
    if (!normalizedJoinCode) {
      setSessionPreview(null);
      setErrorMsg("");
      setIsSearching(false);
      setIsDescriptionExpanded(false);
      return;
    }

    if (!hasMinimumJoinCodeLength) {
      setSessionPreview(null);
      setErrorMsg("");
      setIsSearching(false);
      setIsDescriptionExpanded(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setErrorMsg("");

      try {
        const sessionInfo = await getSessionByJoinCode(normalizedJoinCode);

        if (!active) {
          return;
        }

        if (sessionInfo.success && sessionInfo.session) {
          setSessionPreview(sessionInfo.session);
          setErrorMsg("");
          setIsSearching(false);
          setIsDescriptionExpanded(false);
          return;
        }

        setSessionPreview(null);
        setIsDescriptionExpanded(false);
        setErrorMsg(
          sessionInfo.error === "Failed to find session"
            ? "No session was found for that join code."
            : sessionInfo.error || "Unable to find that session.",
        );
        setIsSearching(false);
      } catch (error) {
        console.error("Error searching for session:", error);

        if (!active) {
          return;
        }

        setSessionPreview(null);
        setIsDescriptionExpanded(false);
        setErrorMsg("An unexpected error occurred. Please try again.");
        setIsSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [hasMinimumJoinCodeLength, normalizedJoinCode]);

  const handleJoinSession = () => {
    if (!sessionPreview) {
      return;
    }

    const normalizedName = name.trim();
    const normalizedUsername = (localStorage.getItem("username") || "").trim();

    if (normalizedName && normalizedName !== normalizedUsername) {
      localStorage.setItem("custom_username", normalizedName);
    } else {
      localStorage.removeItem("custom_username");
    }

    localStorage.setItem("session_info", JSON.stringify(sessionPreview));
    navigate("/observation-session");
  };

  const joinCodeHelperText = isSearching
    ? "Looking up session..."
    : normalizedJoinCode && !hasMinimumJoinCodeLength
      ? "Enter at least 8 characters."
      : sessionPreview
        ? "Session found. Review the details below and join when ready."
        : "Enter the code shared for the session.";

  const joinCodeError = normalizedJoinCode && hasMinimumJoinCodeLength ? errorMsg : "";
  const previewDescription = sessionPreview?.lesson_description?.trim() || "No description provided.";
  const canToggleDescription = Boolean(sessionPreview?.lesson_description?.trim() && previewDescription.length > 120);

  return (
    <ObservationPanelLayout
      title="Join Existing Session"
      subtitle="Enter the session code and join directly from this page."
      onBack={() => navigate("/session-options")}
    >
      <div className="observation-stack">
        <ObservationTextField
          label="Observer Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
        />

        <ObservationTextField
          label="Join Code"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/\s+/g, ""))}
          placeholder="Enter session join code"
          required
          helperText={joinCodeHelperText}
          error={joinCodeError}
        />

        {sessionPreview ? (
          <div className="observation-summary-card">
            <div className="observation-summary-grid">
              <div className="observation-summary-grid observation-summary-grid--top">
                <div>
                  <p className="observation-summary-label">Session Name</p>
                  <p className="observation-summary-value">{sessionPreview.session_name || "N/A"}</p>
                </div>
                <div>
                  <p className="observation-summary-label">Teacher Name</p>
                  <p className="observation-summary-value">{sessionPreview.teacher_name || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="observation-summary-label">Description</p>
                <div className="observation-summary-description-block">
                  <p
                    className={`observation-summary-value observation-summary-value--body${
                      isDescriptionExpanded ? "" : " observation-summary-value--body-clamped"
                    }`}
                  >
                    {previewDescription}
                  </p>
                  {canToggleDescription && (
                    <button
                      type="button"
                      className="observation-summary-toggle"
                      onClick={() => setIsDescriptionExpanded((current) => !current)}
                    >
                      {isDescriptionExpanded ? "See less" : "See more"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="observation-button observation-button--accent"
          onClick={handleJoinSession}
          disabled={!canJoinSession}
        >
          {isSearching ? "Checking Code..." : "Join Session"}
        </button>
      </div>
    </ObservationPanelLayout>
  );
}

