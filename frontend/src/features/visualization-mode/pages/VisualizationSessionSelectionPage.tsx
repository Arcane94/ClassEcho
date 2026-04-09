// Visualization session picker that shows accessible sessions and whether their setup is ready.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ObservationPanelLayout from "@/features/observation-mode/components/ObservationPanelLayout";
import ObservationSessionCard from "@/features/observation-mode/components/ObservationSessionCard";
import type { SessionData } from "@/services/fetchSessionById";
import { getAccessibleSessions } from "@/services/getAccessibleSessions";
import { fetchVisualizationSetup } from "../services/visualizationSetup";
import {
  countConfiguredVisualizationScheduleRows,
  countConfiguredVisualizationSeatMaps,
} from "../utils/schedule";

function getSessionSortTime(session: SessionData): number {
  const rawValue = session.local_time || session.server_time;
  const parsedValue = rawValue ? new Date(rawValue).getTime() : Number.NaN;
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

export default function VisualizationSessionSelectionPage() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("user_id");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [setupSummaries, setSetupSummaries] = useState<
    Record<string, { replayWindowCount: number; seatingChartCount: number; isReady: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const orderedSessions = useMemo(
    () => [...sessions].sort((left, right) => getSessionSortTime(right) - getSessionSortTime(left)),
    [sessions],
  );

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setLoadingError(null);

    try {
      if (!currentUserId) {
        setSessions([]);
        setLoadingError("Sign in again to see your saved sessions.");
        return;
      }

      const accessibleSessions = await getAccessibleSessions(currentUserId);
      setSessions(accessibleSessions.filter((session) => session.permissions?.can_view_session));
    } catch (error) {
      console.error("Failed to load visualization sessions", error);
      setSessions([]);
      setLoadingError("We couldn't load your sessions right now.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    let cancelled = false;

    if (sessions.length === 0) {
      setSetupSummaries({});
      return () => {
        cancelled = true;
      };
    }

    Promise.allSettled(
      sessions.map(async (session) => ({
        sessionId: session.session_id,
        rows: await fetchVisualizationSetup(session.session_id, currentUserId),
      })),
    ).then((results) => {
      if (cancelled) {
        return;
      }

      const nextSummaries = results.reduce<
        Record<string, { replayWindowCount: number; seatingChartCount: number; isReady: boolean }>
      >((accumulator, result) => {
        if (result.status !== "fulfilled") {
          return accumulator;
        }

        const replayWindowCount = countConfiguredVisualizationScheduleRows(result.value.rows);
        const seatingChartCount = countConfiguredVisualizationSeatMaps(result.value.rows);
        accumulator[result.value.sessionId] = {
          replayWindowCount,
          seatingChartCount,
          isReady: replayWindowCount > 0 && replayWindowCount === seatingChartCount,
        };
        return accumulator;
      }, {});

      setSetupSummaries(nextSummaries);
    });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, sessions]);

  const openVisualizationSetup = (sessionId: string) => {
    navigate(`/visualization/setup?sessionId=${encodeURIComponent(sessionId)}`);
  };

  const openVisualizationViewer = (sessionId: string) => {
    navigate(`/visualization/view?sessionId=${encodeURIComponent(sessionId)}`);
  };

  return (
    <ObservationPanelLayout
      title="Visualization Sessions"
      subtitle="Choose a saved session to set up its visualization."
      onBack={() => navigate("/apps")}
      backIcon="home"
      width="wide"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--brand-navy)]">Saved sessions</h2>
        </div>

        <button
          type="button"
          className="observation-inline-button observation-inline-button--compact"
          onClick={loadSessions}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="observation-empty-state">Loading your sessions...</div>
        ) : loadingError ? (
          <div className="observation-empty-state">{loadingError}</div>
        ) : orderedSessions.length === 0 ? (
          <div className="observation-empty-state">No saved sessions were found for this account yet.</div>
        ) : (
          <div className="observation-session-grid">
            {orderedSessions.map((session) => {
              const summary = setupSummaries[session.session_id] ?? {
                replayWindowCount: 0,
                seatingChartCount: 0,
                isReady: false,
              };
              const isSetupReady = summary.isReady;
              const canEditVisualization = Boolean(session.permissions?.can_edit_visualization);
              const showVisualizationButton = isSetupReady;
              const showSetupButton = canEditVisualization;
              const showSetupWarning = !canEditVisualization && !isSetupReady;

              return (
                <ObservationSessionCard
                  key={session.session_id}
                  session={session}
                  contextLabel={session.access_role_label || (isSetupReady ? "Setup ready" : "Needs setup")}
                  supplemental={
                    <div className="grid gap-3">
                      <div className="min-h-[2.55rem] rounded-[1rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-3 py-2 text-sm text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--brand-navy)]">Seating charts:</span>{" "}
                        {summary.replayWindowCount === 0
                          ? "Not defined yet"
                          : `${summary.seatingChartCount} of ${summary.replayWindowCount} replay windows ready`}
                      </div>

                      <div className="min-h-[2.55rem] rounded-[1rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-3 py-2 text-sm text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--brand-navy)]">Replay windows:</span>{" "}
                        {summary.replayWindowCount > 0
                          ? `${summary.replayWindowCount} ${summary.replayWindowCount === 1 ? "window" : "windows"} saved`
                          : "Not defined yet"}
                      </div>

                      {showSetupWarning ? (
                        <div className="min-h-[2.55rem] rounded-[1rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-3 py-2 text-sm text-[var(--text-muted)]">
                          A user with edit access needs to finish the replay windows and seating charts before this
                          session can be opened.
                        </div>
                      ) : null}
                    </div>
                  }
                  actions={
                    showVisualizationButton || showSetupButton ? (
                      <div className="observation-session-card-action-row">
                        {showVisualizationButton ? (
                          <button
                            type="button"
                            className="observation-button"
                            onClick={() => openVisualizationViewer(session.session_id)}
                          >
                            <BarChart3 className="h-4 w-4" />
                            Visualize session
                          </button>
                        ) : null}
                        {canEditVisualization ? (
                          <button
                            type="button"
                            className="observation-button observation-button--accent"
                            onClick={() => openVisualizationSetup(session.session_id)}
                          >
                            <ArrowRight className="h-4 w-4" />
                            {isSetupReady ? "Edit setup" : "Set up visualization"}
                          </button>
                        ) : null}
                      </div>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </ObservationPanelLayout>
  );
}

