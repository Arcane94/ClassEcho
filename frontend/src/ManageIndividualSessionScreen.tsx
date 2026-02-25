import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, X } from "lucide-react";

import AddTagModal from "./components/AddTagModal";
import { exportStudentObservationsToCSV } from "./utils/exportStudentObservationsToCSV";
import { exportTeacherObservationsToCSV } from "./utils/exportTeacherObservationsToCSV";
import { fetchSessionById } from "./utils/fetchSessionById";
import { deleteSession } from "./utils/deleteSession";
import { getSessionSectionInfo } from "./utils/getSessionSectionInfo";
import { updateSessionInfo } from "./utils/updateSessionInfo";
import { updateSessionSections } from "./utils/updateSessionSections";

export default function ManageIndividualSessionScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const [addTagModalString, setAddTagModalString] = useState("");
  const [viewingTeacher, setViewingTeacher] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isControlSaving, setIsControlSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportingStudent, setIsExportingStudent] = useState(false);
  const [isExportingTeacher, setIsExportingTeacher] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

  const [observerName, setObserverName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [teacherBehaviorTags, setTeacherBehaviorTags] = useState<string[]>([]);
  const [functionTags, setFunctionTags] = useState<string[]>([]);
  const [structureTags, setStructureTags] = useState<string[]>([]);
  const [studentTags, setStudentTags] = useState<string[]>([]);

  const sessionId = new URLSearchParams(location.search).get("sessionId") || "";

  useEffect(() => {
    const loadSessionSections = async () => {
      if (!sessionId) {
        setStatusMessage("Missing session id");
        setIsLoading(false);
        return;
      }

      const [sections, sessionInfo] = await Promise.all([
        getSessionSectionInfo(sessionId),
        fetchSessionById(sessionId),
      ]);

      if (!sections) {
        setStatusMessage("Failed to load session sections");
        setIsLoading(false);
        return;
      }

      if (sessionInfo) {
        setObserverName(sessionInfo.observer_name || "");
        setTeacherName(sessionInfo.teacher_name || "");
        setSessionName(sessionInfo.lesson_name || "");
        setLessonDescription(sessionInfo.lesson_description || "");
        setJoinCode(sessionInfo.join_code || "");
      }

      const teacherBehaviorSection = sections.find(
        (section) => section.session_segtor === "Teacher" && section.section_name.toLowerCase().includes("behavior"),
      );
      const functionSection = sections.find(
        (section) => section.session_segtor === "Teacher" && section.section_name.toLowerCase().includes("function"),
      );
      const structureSection = sections.find(
        (section) => section.session_segtor === "Teacher" && section.section_name.toLowerCase().includes("structure"),
      );
      const studentSection = sections.find(
        (section) => section.session_segtor === "Student",
      );

      setTeacherBehaviorTags(teacherBehaviorSection?.tags || []);
      setFunctionTags(functionSection?.tags || []);
      setStructureTags(structureSection?.tags || []);
      setStudentTags(studentSection?.tags || []);
      setIsLoading(false);
    };

    loadSessionSections();
  }, [sessionId]);

  const addTag = (category: string, value: string) => {
    switch (category) {
      case "behavior_tags":
        setTeacherBehaviorTags((prev) => [...prev, value]);
        break;
      case "function_tags":
        setFunctionTags((prev) => [...prev, value]);
        break;
      case "structure_tags":
        setStructureTags((prev) => [...prev, value]);
        break;
      case "student_tags":
        setStudentTags((prev) => [...prev, value]);
        break;
    }
  };

  const removeTag = (category: string, tagToRemove: string) => {
    switch (category) {
      case "teacher_behavior":
        setTeacherBehaviorTags((prev) => prev.filter((tag) => tag !== tagToRemove));
        break;
      case "function":
        setFunctionTags((prev) => prev.filter((tag) => tag !== tagToRemove));
        break;
      case "structure":
        setStructureTags((prev) => prev.filter((tag) => tag !== tagToRemove));
        break;
      case "student":
        setStudentTags((prev) => prev.filter((tag) => tag !== tagToRemove));
        break;
    }
  };

  const editTag = (category: string, currentTag: string) => {
    const editedTag = window.prompt("Edit tag", currentTag);
    if (!editedTag || !editedTag.trim() || editedTag === currentTag) {
      return;
    }

    const nextTag = editedTag.trim();

    switch (category) {
      case "teacher_behavior":
        setTeacherBehaviorTags((prev) => prev.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
      case "function":
        setFunctionTags((prev) => prev.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
      case "structure":
        setStructureTags((prev) => prev.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
      case "student":
        setStudentTags((prev) => prev.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
    }
  };

  const handleConfirmEdits = async () => {
    if (!sessionId) {
      setStatusMessage("Missing session id");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    const sections = [
      {
        session_segtor: "Teacher",
        section_name: "Behavior",
        tags: teacherBehaviorTags.map((tag_name) => ({ tag_name })),
      },
      {
        session_segtor: "Teacher",
        section_name: "Function",
        tags: functionTags.map((tag_name) => ({ tag_name })),
      },
      {
        session_segtor: "Teacher",
        section_name: "Structure",
        tags: structureTags.map((tag_name) => ({ tag_name })),
      },
      {
        session_segtor: "Student",
        section_name: "Behaviors",
        tags: studentTags.map((tag_name) => ({ tag_name })),
      },
    ];

    const result = await updateSessionSections(sessionId, sections);

    if (!result.success) {
      setStatusMessage(result.error || "Failed to save session edits");
      setIsSaving(false);
      return;
    }

    setStatusMessage("Session edits saved");
    setIsSaving(false);
  };

  const handleSaveControlPanel = async () => {
    if (!sessionId) {
      setStatusMessage("Missing session id");
      return;
    }

    setIsControlSaving(true);

    const result = await updateSessionInfo(sessionId, {
      observer_name: observerName,
      teacher_name: teacherName,
      session_name: sessionName,
      lesson_description: lessonDescription,
      join_code: joinCode,
    });

    if (!result.success) {
      setStatusMessage(result.error || "Failed to update session info");
      setIsControlSaving(false);
      return;
    }

    setStatusMessage("Session info updated");
    setIsControlSaving(false);
    setIsControlPanelOpen(false);
  };

  const handleDeleteSession = async () => {
    if (!sessionId) {
      setStatusMessage("Missing session id");
      return;
    }

    const confirmed = window.confirm("Delete this session permanently?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteSession(sessionId);

    if (!result.success) {
      setStatusMessage(result.error || "Failed to delete session");
      setIsDeleting(false);
      return;
    }

    navigate("/manage-sessions");
  };

  const handleExportStudentCSV = async () => {
    if (!sessionId) {
      setStatusMessage("Missing session id");
      return;
    }

    setIsExportingStudent(true);
    await exportStudentObservationsToCSV(sessionId);
    setIsExportingStudent(false);
  };

  const handleExportTeacherCSV = async () => {
    if (!sessionId) {
      setStatusMessage("Missing session id");
      return;
    }

    setIsExportingTeacher(true);
    await exportTeacherObservationsToCSV(sessionId);
    setIsExportingTeacher(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--accent-color)]">
        <div className="text-white text-xl">Loading session...</div>
      </div>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full max-w-[800px] mx-auto h-[51px] bg-[var(--grey-accent)] grid grid-cols-12 items-center">
        <ArrowLeft
          className="ml-3 col-span-1 w-[24px] h-[24px] cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <p className="text-center col-span-10 text-base">Manage Session Tags</p>
      </header>

      <div className="w-full flex justify-center items-start min-h-[calc(100vh-51px)] overflow-hidden">
        <div className="max-w-[800px] w-full">
          <div className="mt-[51px] w-full flex items-center">
            <button
              onClick={() => setViewingTeacher(true)}
              className={`text-xl w-1/2 py-3 cursor-pointer ${viewingTeacher ? "bg-[var(--accent-color)] text-white" : "bg-[var(--light-blue-accent)] text-black"}`}
            >
              Teacher
            </button>
            <button
              onClick={() => setViewingTeacher(false)}
              className={`text-xl w-1/2 py-3 cursor-pointer ${!viewingTeacher ? "bg-[var(--green-accent)] text-white" : "bg-[var(--light-green-accent)] text-black"}`}
            >
              Student
            </button>
          </div>

          {viewingTeacher ? (
            <>
              <h2 className="text-xl ml-[24px] mt-4">Behavior (What?)</h2>
              <div className="mt-2">
                <div className="py-3 px-[24px] w-full">
                  <div className="flex gap-2 flex-wrap items-center">
                    {teacherBehaviorTags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                        onClick={() => editTag("teacher_behavior", tag)}
                      >
                        {tag}
                        <X
                          className="w-4 h-4 cursor-pointer hover:text-red-500"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeTag("teacher_behavior", tag);
                          }}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setAddTagModalString("behavior")}
                      className="text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer"
                    >
                      +
                    </button>
                    {addTagModalString === "behavior" && (
                      <AddTagModal
                        modalHeader={"Add Behavior Tag"}
                        tagSection={"behavior_tags"}
                        onAddTag={addTag}
                        onClose={() => setAddTagModalString("")}
                      />
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-xl ml-[24px] mt-4">Function (Why?)</h3>
              <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                {functionTags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                    onClick={() => editTag("function", tag)}
                  >
                    {tag}
                    <X
                      className="w-4 h-4 cursor-pointer hover:text-red-500"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeTag("function", tag);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => setAddTagModalString("function")}
                  className="text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer"
                >
                  +
                </button>
                {addTagModalString === "function" && (
                  <AddTagModal
                    modalHeader={"Add Function Tag"}
                    tagSection={"function_tags"}
                    onAddTag={addTag}
                    onClose={() => setAddTagModalString("")}
                  />
                )}
              </div>

              <h4 className="text-xl ml-[24px] mt-4">Structure (With what?)</h4>
              <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center">
                {structureTags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                    onClick={() => editTag("structure", tag)}
                  >
                    {tag}
                    <X
                      className="w-4 h-4 cursor-pointer hover:text-red-500"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeTag("structure", tag);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => setAddTagModalString("structure")}
                  className="text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer"
                >
                  +
                </button>
                {addTagModalString === "structure" && (
                  <AddTagModal
                    modalHeader={"Add Structure Tag"}
                    tagSection={"structure_tags"}
                    onAddTag={addTag}
                    onClose={() => setAddTagModalString("")}
                  />
                )}
              </div>
              <div className="mx-[24px] mt-6 flex">
                <button
                  onClick={handleExportTeacherCSV}
                  disabled={isExportingTeacher}
                  className="w-1/2 bg-[var(--medium-blue-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>{isExportingTeacher ? "Exporting..." : "Export Teacher CSV"}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl ml-[24px] mt-4">Student Behaviors</h2>
              <div className="py-2 px-[24px] w-full flex gap-2 flex-wrap items-center bg-[var(--light-green-accent)] mt-4">
                {studentTags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-sm px-2 py-2 rounded-xl border border-gray-300 bg-white"
                    onClick={() => editTag("student", tag)}
                  >
                    {tag}
                    <X
                      className="w-4 h-4 cursor-pointer hover:text-red-500"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeTag("student", tag);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => setAddTagModalString("student")}
                  className="text-sm w-6 h-6 rounded-full bg-white flex justify-center items-center border border-gray-300 cursor-pointer"
                >
                  +
                </button>
                {addTagModalString === "student" && (
                  <AddTagModal
                    modalHeader={"Add Student Tag"}
                    tagSection={"student_tags"}
                    onAddTag={addTag}
                    onClose={() => setAddTagModalString("")}
                  />
                )}
              </div>

              <div className="mx-[24px] mt-6 flex">
                <button
                  onClick={handleExportStudentCSV}
                  disabled={isExportingStudent}
                  className="w-1/2 bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>{isExportingStudent ? "Exporting..." : "Export Student CSV"}</span>
                </button>
              </div>
            </>
          )}

          {statusMessage && (
            <p className="mx-[24px] mt-4 text-sm text-[var(--accent-color)]">{statusMessage}</p>
          )}

          <div className="h-[84px]" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 w-full max-w-[800px] mx-auto px-[24px] pb-4 pt-2 bg-white">
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsControlPanelOpen(true)}
            className="w-full bg-[var(--medium-blue-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer"
          >
            Open Control Panel
          </button>
          <button
            onClick={handleConfirmEdits}
            disabled={isSaving}
            className="w-full bg-[var(--green-accent)] text-white text-lg py-3 px-4 rounded-sm cursor-pointer disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Confirm Session Edits"}
          </button>
        </div>
        <div className="w-full mt-3">
          <button
            onClick={() => navigate('/session-options')}
            className="w-full bg-[var(--grey-accent)] text-black text-lg py-3 px-4 rounded-sm cursor-pointer"
          >
            Back to Menu
          </button>
        </div>
      </div>

      {isControlPanelOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-[600px] bg-white p-4">
            <p className="text-xl mb-4">Session Control Panel</p>

            <div className="mb-3">
              <label className="block text-sm mb-1">Name</label>
              <input
                value={observerName}
                onChange={(e) => setObserverName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Teacher Name</label>
              <input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Session Name</label>
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Lesson Description</label>
              <textarea
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-sm h-24 resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Join Code</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setIsControlPanelOpen(false)}
                className="border-1 border-[var(--grey-accent)] p-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveControlPanel}
                disabled={isControlSaving}
                className="bg-[var(--medium-blue-accent)] text-white p-2 cursor-pointer disabled:opacity-70"
              >
                {isControlSaving ? "Saving..." : "Save Session Info"}
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="bg-red-500 text-white p-2 cursor-pointer disabled:opacity-70"
              >
                {isDeleting ? "Deleting..." : "Delete Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
