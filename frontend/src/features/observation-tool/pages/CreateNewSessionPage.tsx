import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ObservationInfoButton from "@/features/observation-tool/components/ObservationInfoButton";
import ObservationPanelLayout from "@/features/observation-tool/components/ObservationPanelLayout";
import ObservationSegmentedTabs from "@/features/observation-tool/components/ObservationSegmentedTabs";
import ObservationTextField from "@/features/observation-tool/components/ObservationTextField";
import {
  clearCreateSessionDraft,
  type JoinCodeMode,
  readCreateSessionDraft,
  saveCreateSessionDraft,
} from "@/features/observation-tool/config/createSessionDraftStorage";

export default function CreateNewSessionPage() {
  const navigate = useNavigate();
  const initialDraft = readCreateSessionDraft();
  const creatorId = Number(localStorage.getItem("user_id"));

  const [teacherName, setTeacherName] = useState(initialDraft.teacherName);
  const [sessionName, setSessionName] = useState(initialDraft.sessionName);
  const [lessonDescription, setLessonDescription] = useState(initialDraft.lessonDescription);
  const [joinCode, setJoinCode] = useState(initialDraft.joinCode);
  const [joinCodeMode, setJoinCodeMode] = useState<JoinCodeMode>(initialDraft.joinCodeMode);
  const [isDefaultTags, setIsDefaultTags] = useState(initialDraft.isDefaultTags);
  const [studentIdNumericOnly, setStudentIdNumericOnly] = useState(initialDraft.studentIdNumericOnly);

  const normalizedTeacherName = teacherName.trim();
  const normalizedSessionName = sessionName.trim();
  const normalizedJoinCode = joinCode.trim().toUpperCase();
  const isJoinCodeValid = normalizedJoinCode.length >= 8;
  const canProceed = Boolean(Number.isInteger(creatorId) && creatorId > 0 && normalizedTeacherName && normalizedSessionName && isJoinCodeValid);

  useEffect(() => {
    saveCreateSessionDraft({
      teacherName,
      sessionName,
      lessonDescription,
      joinCode,
      joinCodeMode,
      isDefaultTags,
      studentIdNumericOnly,
    });
  }, [isDefaultTags, joinCode, joinCodeMode, lessonDescription, sessionName, studentIdNumericOnly, teacherName]);

  const generateJoinCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let index = 0; index < 8; index += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    setJoinCode(code);
  };

  useEffect(() => {
    if (joinCodeMode === "generate" && normalizedJoinCode.length < 8) {
      generateJoinCode();
    }
  }, [joinCodeMode, normalizedJoinCode.length]);

  const handleNext = () => {
    if (!canProceed) {
      return;
    }

    const draft = {
      teacherName: normalizedTeacherName,
      sessionName: normalizedSessionName,
      lessonDescription: lessonDescription.trim(),
      joinCode: normalizedJoinCode,
      joinCodeMode,
      isDefaultTags,
      studentIdNumericOnly,
    };

    saveCreateSessionDraft(draft);

    navigate("/customize-session", {
      state: draft,
    });
  };

  const handleCancel = () => {
    clearCreateSessionDraft();
    navigate(-1);
  };

  return (
    <ObservationPanelLayout
      title="Create a New Session"
      subtitle="Set the basic details of your session."
      onBack={handleCancel}
      width="wide"
      footer={
        <div className="observation-cta-row">
          <button
            type="button"
            className="observation-button observation-button--secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="observation-button observation-button--accent"
            onClick={handleNext}
            disabled={!canProceed}
          >
            Next
          </button>
        </div>
      }
    >
      <div className="observation-stack">
        <div className="observation-form-grid observation-form-grid--two">
          <ObservationTextField
            label="Teacher Name"
            value={teacherName}
            onChange={(event) => setTeacherName(event.target.value)}
            placeholder="Enter teacher name"
            required
          />

          <ObservationTextField
            label="Session Name"
            value={sessionName}
            onChange={(event) => setSessionName(event.target.value)}
            placeholder="Enter session name"
            required
          />
        </div>

        <ObservationTextField
          label="Lesson Description"
          value={lessonDescription}
          onChange={(event) => setLessonDescription(event.target.value)}
          placeholder="Add a short description of the lesson or context"
          multiline
        />

        <div className="observation-field">
          <span className="observation-field-label-row">
            <span className="observation-field-label">Numeric-only Student IDs</span>
            <ObservationInfoButton
              content="Turn this on if observers should enter numeric student IDs only. Multiple IDs can still be entered by separating them with commas."
              label="About Numeric-only Student IDs"
            />
          </span>
          <p className="observation-field-helper">
            When enabled, the Student ID(s) field only accepts numbers.
          </p>
          <div className="observation-toggle-pill observation-toggle-pill--compact">
            <button
              type="button"
              className={!studentIdNumericOnly ? "observation-toggle-pill-button--active" : ""}
              onClick={() => setStudentIdNumericOnly(false)}
            >
              Off
            </button>
            <button
              type="button"
              className={studentIdNumericOnly ? "observation-toggle-pill-button--active" : ""}
              onClick={() => setStudentIdNumericOnly(true)}
            >
              On
            </button>
          </div>
        </div>

        <div className="observation-field">
          <span className="observation-field-label">
            Join Code
            <span className="observation-field-required"> *</span>
          </span>
          <p className="observation-field-helper">
            Choose whether you want the app to generate a code for you or if you want to type your own.
          </p>
          <div className="observation-code-group">
            <ObservationSegmentedTabs
              tabs={[
                {
                  key: "generate",
                  label: "Generate Code",
                },
                {
                  key: "custom",
                  label: "Custom Code",
                },
              ]}
              value={joinCodeMode}
              onChange={(value) => setJoinCodeMode(value)}
            />
            <div className="observation-code-row observation-code-row--single">
              <div className={`observation-code-input-wrap${joinCodeMode === "generate" ? " observation-code-input-wrap--with-action" : ""}`}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder={joinCodeMode === "generate" ? "Generated join code" : "Enter your custom join code"}
                  className={`observation-field-input${joinCodeMode === "generate" ? " observation-field-input--with-action" : ""}`}
                  required
                  readOnly={joinCodeMode === "generate"}
                  aria-invalid={joinCode.length > 0 && !isJoinCodeValid}
                />
                {joinCodeMode === "generate" && (
                  <button
                    type="button"
                    className="observation-inline-button observation-code-action-button"
                    onClick={generateJoinCode}
                  >
                    Generate new code
                  </button>
                )}
              </div>
            </div>
            {joinCodeMode === "custom" && joinCode.length > 0 && !isJoinCodeValid ? (
              <span className="observation-field-helper observation-field-helper--error">
                Join code must be at least 8 characters.
              </span>
            ) : joinCodeMode === "generate" ? (
              <span className="observation-field-helper">A random 8-character code is ready to use.</span>
            ) : (
              <span className="observation-field-helper">Enter your own join code using at least 8 characters.</span>
            )}
          </div>
        </div>

        <div className="observation-stack">
          <div>
            <h2 className="observation-editor-section-title">Starting tag set</h2>
            <p className="observation-editor-section-copy">
              Choose whether you want a blank canvas or the default observation tags preloaded.
            </p>
          </div>

          <ObservationSegmentedTabs
            tabs={[
              { key: "default", label: "Default Tags" },
              { key: "custom", label: "Custom Tags" },
            ]}
            value={isDefaultTags ? "default" : "custom"}
            onChange={(value) => setIsDefaultTags(value === "default")}
          />
        </div>
      </div>
    </ObservationPanelLayout>
  );
}
