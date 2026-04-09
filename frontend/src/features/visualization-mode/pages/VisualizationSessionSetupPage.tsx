// Visualization setup page for defining replay windows and per-window seating charts.
import { ArrowRight, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ObservationPanelLayout from "@/features/observation-mode/components/ObservationPanelLayout";
import { fetchSessionById, type SessionData } from "@/services/fetchSessionById";
import { SeatingChartEditor } from "../components/SeatingChartEditor";
import { fetchVisualizationSetup, saveVisualizationSetup } from "../services/visualizationSetup";
import type { VisualizationScheduleRow, VisualizationSeat } from "../types";
import {
  countConfiguredVisualizationScheduleRows,
  countConfiguredVisualizationSeatMaps,
  createVisualizationScheduleRow,
  getValidVisualizationScheduleRows,
  getVisualizationScheduleRowErrors,
  hasConfiguredVisualizationSeats,
  isMeaningfulVisualizationScheduleRow,
} from "../utils/schedule";
import { getVisualizationBrowserTimeZone, getVisualizationTimeZoneOptions } from "../utils";

const setupFieldClassName =
  "min-h-[2.75rem] w-full min-w-0 rounded-[1rem] border border-[rgba(148,163,184,0.26)] bg-[rgba(255,255,255,0.94)] px-3 py-2 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--accent-color-deep)] focus:ring-2 focus:ring-[rgba(35,171,248,0.16)]";
const setupSelectFieldClassName = `${setupFieldClassName} appearance-none pr-11`;
const setupTimeFieldClassName = `${setupFieldClassName} pr-2`;
const setupFieldLabelClassName =
  "mb-1.5 block text-[0.72rem] font-semibold uppercase leading-none tracking-[0.14em] text-[var(--text-muted)]";
const setupIconButtonClassName =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(148,163,184,0.24)] bg-[rgba(255,255,255,0.96)] text-[var(--brand-navy)] shadow-[0_10px_22px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:border-[var(--accent-color-deep)] hover:bg-[rgba(240,249,255,0.98)]";
const setupIconButtonDangerClassName =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(248,113,113,0.22)] bg-[rgba(255,255,255,0.96)] text-[#b91c1c] shadow-[0_10px_22px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:border-[rgba(220,38,38,0.42)] hover:bg-[rgba(254,242,242,0.98)]";

function getFallbackScheduleRow(rows: VisualizationScheduleRow[], sharedTimeZone: string): VisualizationScheduleRow {
  const lastMeaningfulRow = [...rows].reverse().find(isMeaningfulVisualizationScheduleRow);
  return createVisualizationScheduleRow({
    date: lastMeaningfulRow?.date ?? "",
    period: lastMeaningfulRow?.period ?? "",
    timezone: sharedTimeZone,
  });
}

function SeatEditorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="2.75" rx="1.25" />
      <rect x="5" y="9" width="4" height="4" rx="1.2" />
      <rect x="10" y="9" width="4" height="4" rx="1.2" />
      <rect x="15" y="9" width="4" height="4" rx="1.2" />
      <rect x="7.5" y="16" width="4" height="4" rx="1.2" />
      <rect x="12.5" y="16" width="4" height="4" rx="1.2" />
    </svg>
  );
}

export default function VisualizationSessionSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedSessionId = searchParams.get("sessionId")?.trim() ?? "";
  const currentUserId = localStorage.getItem("user_id");

  const [scheduleRows, setScheduleRows] = useState<VisualizationScheduleRow[]>([createVisualizationScheduleRow()]);
  const [activeEditorRowId, setActiveEditorRowId] = useState<string | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(Boolean(selectedSessionId));
  const [savingSetup, setSavingSetup] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionData | null>(null);
  const [sessionDetailsLoading, setSessionDetailsLoading] = useState(Boolean(selectedSessionId));
  const timeZoneOptions = useMemo(() => getVisualizationTimeZoneOptions(), []);
  const defaultTimeZone = useMemo(
    () => timeZoneOptions[0] ?? getVisualizationBrowserTimeZone(),
    [timeZoneOptions],
  );
  const [sharedTimeZone, setSharedTimeZone] = useState(defaultTimeZone);

  useEffect(() => {
    let cancelled = false;

    if (!selectedSessionId) {
      setScheduleRows([createVisualizationScheduleRow({ timezone: defaultTimeZone })]);
      setSharedTimeZone(defaultTimeZone);
      setActiveEditorRowId(null);
      setLoadingSetup(false);
      setSetupError("Choose a session first.");
      return () => {
        cancelled = true;
      };
    }

    setLoadingSetup(true);
    setSetupError(null);
    setSetupNotice(null);

    fetchVisualizationSetup(selectedSessionId, currentUserId)
      .then((rows) => {
        if (cancelled) {
          return;
        }

        const normalizedRows = rows.length > 0 ? rows.map(createVisualizationScheduleRow) : [createVisualizationScheduleRow({ timezone: defaultTimeZone })];
        const nextTimeZone = normalizedRows[0]?.timezone || defaultTimeZone;
        const nextRows = normalizedRows.map((row) =>
          createVisualizationScheduleRow({
            ...row,
            timezone: nextTimeZone,
          }),
        );
        setSharedTimeZone(nextTimeZone);
        setScheduleRows(nextRows);
        setActiveEditorRowId((current) => {
          if (current && nextRows.some((row) => row.id === current)) {
            return current;
          }
          return nextRows[0]?.id ?? null;
        });
      })
      .catch((error) => {
        console.error("Failed to load visualization setup", error);
        if (!cancelled) {
          setScheduleRows([createVisualizationScheduleRow({ timezone: defaultTimeZone })]);
          setSharedTimeZone(defaultTimeZone);
          setActiveEditorRowId(null);
          setSetupError("We couldn't load this session setup right now.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSetup(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, defaultTimeZone, selectedSessionId]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedSessionId) {
      setSessionDetails(null);
      setSessionDetailsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setSessionDetailsLoading(true);
    fetchSessionById(selectedSessionId, currentUserId)
      .then((session) => {
        if (!cancelled) {
          setSessionDetails(session);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSessionDetailsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, selectedSessionId]);

  const updateScheduleRow = (
    rowId: string,
    field: keyof Pick<VisualizationScheduleRow, "date" | "period" | "start_time" | "end_time">,
    value: string,
  ) => {
    setScheduleRows((previous) =>
      previous.map((row) =>
        row.id === rowId
          ? createVisualizationScheduleRow({
            ...row,
            [field]: value,
          })
          : row,
      ),
    );
    setSetupNotice(null);
  };

  const updateSharedTimeZone = (timeZone: string) => {
    setSharedTimeZone(timeZone);
    setScheduleRows((previous) =>
      previous.map((row) =>
        createVisualizationScheduleRow({
          ...row,
          timezone: timeZone,
        }),
      ),
    );
    setSetupNotice(null);
  };

  const updateScheduleRowSeats = (rowId: string, seats: VisualizationSeat[]) => {
    setScheduleRows((previous) =>
      previous.map((row) =>
        row.id === rowId
          ? createVisualizationScheduleRow({
            ...row,
            seats,
          })
          : row,
      ),
    );
    setSetupNotice(null);
  };

  const addScheduleRow = (afterRowId?: string) => {
    setScheduleRows((previous) => {
      const nextRow =
        afterRowId == null
          ? getFallbackScheduleRow(previous, sharedTimeZone)
          : createVisualizationScheduleRow({
            date: previous.find((row) => row.id === afterRowId)?.date ?? "",
            period: previous.find((row) => row.id === afterRowId)?.period ?? "",
            timezone: sharedTimeZone,
          });

      const nextRows =
        afterRowId == null
          ? [...previous, nextRow]
          : (() => {
            const insertIndex = previous.findIndex((row) => row.id === afterRowId);
            if (insertIndex === -1) {
              return [...previous, nextRow];
            }

            return [...previous.slice(0, insertIndex + 1), nextRow, ...previous.slice(insertIndex + 1)];
          })();

      setActiveEditorRowId(nextRow.id);
      return nextRows;
    });
    setSetupNotice(null);
  };

  const removeScheduleRow = (rowId: string) => {
    setScheduleRows((previous) => {
      if (previous.length <= 1) {
        const nextRow = createVisualizationScheduleRow({ timezone: sharedTimeZone });
        setActiveEditorRowId(nextRow.id);
        return [nextRow];
      }

      const nextRows = previous.filter((row) => row.id !== rowId);
      setActiveEditorRowId((current) => {
        if (current && current !== rowId && nextRows.some((row) => row.id === current)) {
          return current;
        }
        return nextRows[0]?.id ?? null;
      });
      return nextRows;
    });
    setSetupNotice(null);
  };

  const rowErrors = useMemo(() => getVisualizationScheduleRowErrors(scheduleRows), [scheduleRows]);
  const validScheduleRows = useMemo(() => getValidVisualizationScheduleRows(scheduleRows), [scheduleRows]);
  const configuredScheduleCount = countConfiguredVisualizationScheduleRows(scheduleRows);
  const configuredSeatCount = countConfiguredVisualizationSeatMaps(scheduleRows);
  const windowsMissingSeats = validScheduleRows.filter((row) => !hasConfiguredVisualizationSeats(row)).length;
  const hasScheduleErrors = Object.keys(rowErrors).length > 0;
  const canOpenVisualization = validScheduleRows.length > 0 && windowsMissingSeats === 0 && !hasScheduleErrors;
  const setupStatus = useMemo(() => {
    if (configuredScheduleCount === 0) {
      return {
        headline: "Add at least one replay window to save this setup.",
        detail: null,
      };
    }

    if (windowsMissingSeats > 0) {
      return {
        headline: `${configuredScheduleCount} replay window${configuredScheduleCount === 1 ? "" : "s"} added. ${configuredSeatCount} ${configuredSeatCount === 1 ? "has" : "have"} a seating chart so far.`,
        detail: "Add a seating chart to every replay window to visualize.",
      };
    }

    return {
      headline: "Every replay window has a seating chart and is ready to visualize.",
      detail: null,
    };
  }, [configuredScheduleCount, configuredSeatCount, windowsMissingSeats]);
  const activeReplayWindow =
    scheduleRows.find((row) => row.id === activeEditorRowId) ??
    scheduleRows[0] ??
    null;

  useEffect(() => {
    if (!activeEditorRowId && scheduleRows.length > 0) {
      setActiveEditorRowId(scheduleRows[0].id);
    }
  }, [activeEditorRowId, scheduleRows]);

  const persistSetup = async (openAfterSave = false) => {
    if (!selectedSessionId) {
      setSetupError("Choose a session first.");
      return;
    }

    if (hasScheduleErrors) {
      setSetupError("Fix the replay window errors before saving.");
      return;
    }

    if (openAfterSave && validScheduleRows.some((row) => !hasConfiguredVisualizationSeats(row))) {
      setSetupError("Add a seating chart to every replay window before opening the visualization.");
      return;
    }

    setSavingSetup(true);
    setSetupError(null);
    setSetupNotice(null);

    try {
      const rowsToSave = validScheduleRows.map((row) =>
        createVisualizationScheduleRow({
          ...row,
          timezone: sharedTimeZone,
        }),
      );
      const savedRows = await saveVisualizationSetup(selectedSessionId, rowsToSave, currentUserId);
      const normalizedRows = savedRows.length > 0 ? savedRows.map(createVisualizationScheduleRow) : [createVisualizationScheduleRow({ timezone: sharedTimeZone })];
      const nextTimeZone = normalizedRows[0]?.timezone || sharedTimeZone;
      const nextRows = normalizedRows.map((row) =>
        createVisualizationScheduleRow({
          ...row,
          timezone: nextTimeZone,
        }),
      );
      setSharedTimeZone(nextTimeZone);
      setScheduleRows(nextRows);
      setActiveEditorRowId((current) => {
        if (current && nextRows.some((row) => row.id === current)) {
          return current;
        }
        return nextRows[0]?.id ?? null;
      });
      setSetupNotice(savedRows.length > 0 ? "Visualization setup saved." : "Visualization setup cleared.");

      if (openAfterSave && savedRows.length > 0) {
        navigate(`/visualization/view?sessionId=${encodeURIComponent(selectedSessionId)}`);
      }
    } catch (error) {
      console.error("Failed to save visualization setup", error);
      setSetupError(error instanceof Error ? error.message : "We couldn't save this setup right now.");
    } finally {
      setSavingSetup(false);
    }
  };

  const canEditVisualization = Boolean(sessionDetails?.permissions?.can_edit_visualization);

  return (
    <ObservationPanelLayout
      title="Visualization Setup"
      subtitle="Define replay windows and seating charts for this session."
      onBack={() => navigate("/visualization")}
      backIcon="arrow"
      width="wide"
    >
      <div className="grid gap-4 sm:gap-5">
        <section className="rounded-[1.5rem] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.9)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[var(--brand-navy)]">Replay windows</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                Add one row for each date and period you want to replay, then define its seating chart below.
              </p>
            </div>

            <label className="block min-w-0 sm:w-[15rem]">
              <span className={setupFieldLabelClassName}>
                Time zone
              </span>
              <div className="relative">
                <select
                  className={setupSelectFieldClassName}
                  value={sharedTimeZone}
                  onChange={(event) => updateSharedTimeZone(event.target.value)}
                >
                  {timeZoneOptions.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>
                      {timeZone}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none">
                    <path d="M2.25 4.5 6 8.25 9.75 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </label>
          </div>

          {loadingSetup || sessionDetailsLoading ? (
            <div className="mt-4 rounded-[1.25rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-4 py-5 text-sm text-[var(--text-muted)]">
              Loading this session setup...
            </div>
          ) : !canEditVisualization ? (
            <div className="mt-4 rounded-[1.25rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-4 py-5 text-sm text-[var(--text-muted)]">
              You can view this setup, but only a visualization editor or full editor can change replay windows and seating charts.
            </div>
          ) : (
            <div className="mt-4 rounded-[1.25rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)]">
              {scheduleRows.map((row, index) => {
                const isActive = activeReplayWindow?.id === row.id;
                const hasSeats = row.seats.length > 0;

                return (
                  <div
                    key={row.id}
                    className={`${index === 0 ? "" : "border-t border-[rgba(148,163,184,0.18)]"} px-3 py-4 sm:px-4`}
                  >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[8.75rem_minmax(9.5rem,1fr)_4.5rem_8.75rem_8.75rem_auto] xl:items-end">
                      <div className="flex min-w-0 flex-col">
                        <span className={`${setupFieldLabelClassName} invisible`} aria-hidden="true">
                          Seats
                        </span>
                        <button
                          type="button"
                          className={`inline-flex min-h-[2.75rem] min-w-0 items-center justify-center gap-2 rounded-[1rem] border px-3 py-2 text-sm font-semibold shadow-[0_10px_22px_rgba(15,23,42,0.07)] transition ${
                            isActive
                              ? "border-[var(--accent-color-deep)] bg-[rgba(224,242,254,0.96)] text-[var(--accent-color-deep)]"
                              : "border-[rgba(148,163,184,0.24)] bg-[rgba(255,255,255,0.96)] text-[var(--brand-navy)] hover:-translate-y-[1px] hover:border-[var(--accent-color-deep)] hover:bg-[rgba(240,249,255,0.98)]"
                          }`}
                          onClick={() => setActiveEditorRowId(row.id)}
                          title={hasSeats ? `${row.seats.length} seats defined. Open seating chart editor.` : "Open seating chart editor"}
                          aria-label={hasSeats ? `${row.seats.length} seats defined. Open seating chart editor.` : "Open seating chart editor"}
                        >
                          <SeatEditorIcon />
                          <span className="whitespace-nowrap">Seating chart</span>
                        </button>
                      </div>

                      <label className="block min-w-0">
                        <span className={setupFieldLabelClassName}>
                          Date
                        </span>
                        <input
                          type="date"
                          className={setupFieldClassName}
                          value={row.date}
                          onChange={(event) => updateScheduleRow(row.id, "date", event.target.value)}
                          onFocus={() => setActiveEditorRowId(row.id)}
                        />
                      </label>

                      <label className="block min-w-0">
                        <span className={setupFieldLabelClassName}>
                          Period
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={setupFieldClassName}
                          placeholder="3"
                          value={row.period}
                          onChange={(event) => updateScheduleRow(row.id, "period", event.target.value)}
                          onFocus={() => setActiveEditorRowId(row.id)}
                        />
                      </label>

                      <label className="block min-w-0">
                        <span className={setupFieldLabelClassName}>
                          Start time
                        </span>
                        <input
                          type="time"
                          step="1"
                          className={setupTimeFieldClassName}
                          value={row.start_time}
                          onChange={(event) => updateScheduleRow(row.id, "start_time", event.target.value)}
                          onFocus={() => setActiveEditorRowId(row.id)}
                        />
                      </label>

                      <label className="block min-w-0">
                        <span className={setupFieldLabelClassName}>
                          End time
                        </span>
                        <input
                          type="time"
                          step="1"
                          className={setupTimeFieldClassName}
                          value={row.end_time}
                          onChange={(event) => updateScheduleRow(row.id, "end_time", event.target.value)}
                          onFocus={() => setActiveEditorRowId(row.id)}
                        />
                      </label>

                      <div className="flex items-end justify-end gap-2 sm:col-span-2 xl:col-span-1">
                        <button
                          type="button"
                          className={setupIconButtonClassName}
                          onClick={() => addScheduleRow(row.id)}
                          title="Add replay window"
                          aria-label="Add replay window"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          className={setupIconButtonDangerClassName}
                          onClick={() => removeScheduleRow(row.id)}
                          title={`Remove replay window ${index + 1}`}
                          aria-label={`Remove replay window ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {rowErrors[row.id] ? (
                      <div className="mt-3 rounded-[1rem] border border-[rgba(220,38,38,0.14)] bg-[rgba(254,242,242,0.9)] px-3 py-2 text-sm text-[#b91c1c]">
                        {rowErrors[row.id]}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <SeatingChartEditor
          replayWindow={activeReplayWindow}
          replayWindows={scheduleRows}
          onChangeSeats={updateScheduleRowSeats}
        />
      </div>

      {setupError ? (
        <div className="mt-5 rounded-[1rem] border border-[rgba(220,38,38,0.14)] bg-[rgba(254,242,242,0.92)] px-4 py-3 text-sm text-[#b91c1c]">
          {setupError}
        </div>
      ) : null}

      {setupNotice ? (
        <div className="mt-5 rounded-[1rem] border border-[rgba(16,185,129,0.16)] bg-[rgba(236,253,245,0.92)] px-4 py-3 text-sm text-[#047857]">
          {setupNotice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-[rgba(35,171,248,0.18)] bg-[rgba(255,255,255,0.88)] p-4 shadow-[0_14px_30px_rgba(14,76,113,0.08)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-h-[3rem] flex-col justify-center text-sm leading-6 text-[var(--text-muted)]">
          <div>{setupStatus.headline}</div>
          {setupStatus.detail ? <div>{setupStatus.detail}</div> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:justify-self-end">
          <button
            type="button"
            className="observation-button"
            onClick={() => persistSetup(false)}
            disabled={savingSetup || loadingSetup || hasScheduleErrors || !canEditVisualization}
          >
            <Save className="h-4 w-4" />
            {savingSetup ? "Saving..." : "Save setup"}
          </button>

          <button
            type="button"
            className="observation-button observation-button--accent"
            onClick={() => persistSetup(true)}
            disabled={!canOpenVisualization || savingSetup || loadingSetup || !canEditVisualization}
          >
            <ArrowRight className="h-4 w-4" />
            Open visualization
          </button>
        </div>
      </div>
    </ObservationPanelLayout>
  );
}

