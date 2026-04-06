import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ObservationPanelLayout from "@/features/observation-tool/components/ObservationPanelLayout";
import ObservationSessionCard from "@/features/observation-tool/components/ObservationSessionCard";
import { getAllUserSessions } from "@/services/getAllUserSessions";
import type { SessionData } from "@/services/fetchSessionById";

export default function ViewSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const userId = localStorage.getItem("user_id");

      if (userId) {
        const userSessions = await getAllUserSessions(userId);
        setSessions(userSessions);
      }

      setLoading(false);
    };

    fetchSessions();
  }, []);

  const handleRejoinSession = (session: SessionData) => {
    localStorage.removeItem("custom_username");
    localStorage.setItem(
      "session_info",
      JSON.stringify({
        session_id: Number(session.session_id),
        creator: session.creator,
        teacher_name: session.teacher_name,
        session_name: session.lesson_name,
        lesson_description: session.lesson_description || null,
        local_time: session.local_time || null,
        server_time: session.server_time,
        join_code: session.join_code,
        student_id_numeric_only: session.student_id_numeric_only,
        observers: null,
        editors: null,
      }),
    );
    navigate("/observation-session");
  };

  return (
    <ObservationPanelLayout
      title="Previous Sessions"
      subtitle="Jump back into any active sessions you've joined before."
      onBack={() => navigate("/session-options")}
      width="wide"
    >
      {loading ? (
        <div className="observation-empty-state">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="observation-empty-state">No previous sessions were found for this account yet.</div>
      ) : (
        <div className="observation-session-grid">
          {sessions.map((session) => {
            return (
              <ObservationSessionCard
                key={session.session_id}
                session={session}
                contextLabel="Joined Session"
                actions={
                  <button
                    type="button"
                    className="observation-button observation-button--accent"
                    onClick={() => handleRejoinSession(session)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Rejoin Session
                  </button>
                }
              />
            );
          })}
        </div>
      )}
    </ObservationPanelLayout>
  );
}
