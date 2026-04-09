// Visualization playback page that loads session data, applies replay windows, and renders the viewer.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, List, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { SessionData } from "@/services/fetchSessionById";
import { SeatingSVG } from "../components/SeatingSVG";
import { LogsPanel } from "../components/LogsPanel";
import { ControlsPanel } from "../components/ControlsPanel";
import { CumulativeHeatmap } from "../components/CumulativeHeatmap";
import { StudentCodeView } from "../components/StudentCodeView";
import { InfoTip } from "../components/InfoTip";
import { UploadChip } from "../components/UploadChip";

import type {
  EmojiReactionEvent,
  EmojiReactionInterval,
  GroupPayload,
  HelpRow,
  RequestRow,
  VisualizationScheduleRow,
  FilterKey,
  LogFilters,
} from "../types";
import { FILTER_LABELS, FILTER_PLACEHOLDERS } from "../types";
import {
  buildGroups,
  parseDateOnly,
  parseHelp,
  parseObservationTimestamp,
  parseRequests,
} from "../utils";
import { fetchVisualizationCodeUrls } from "../services/fetchVisualizationCodeUrls";
import { fetchVisualizationEmojiReactions } from "../services/fetchVisualizationEmojiReactions";
import { fetchVisualizationSessionData } from "../services/fetchVisualizationSessionData";
import { parseCsvFile } from "../utils/csv";
import {
  getValidVisualizationScheduleRows,
  hasConfiguredVisualizationSeats,
} from "../utils/schedule";
import { fetchVisualizationSetup } from "../services/visualizationSetup";
import { useVisualizationStyles } from "../utils/useVisualizationStyles";

const ALL_DATES = "__ALL__";
type VisualizationSourceMode = "db" | "csv";

function buildEmojiReactionIntervals(
  events: any[],
  studentId: string,
  windowStartIso: string,
  windowEndIso: string
): EmojiReactionInterval[] {
  const windowStart = new Date(windowStartIso);
  const windowEnd = new Date(windowEndIso);

  if (
    isNaN(windowStart.getTime()) ||
    isNaN(windowEnd.getTime()) ||
    windowEnd.getTime() <= windowStart.getTime()
  ) {
    return [];
  }

  const normalized = events
    .map((entry) => {
      const emojiKey = String(entry?.emojiKey ?? entry?.emoji_key ?? "").trim();
      const createdAt = parseObservationTimestamp(entry?.createdAt ?? entry?.created_at);
      if (!emojiKey || !createdAt) return null;

      const normalizedEntry: EmojiReactionEvent = {
        student_id: studentId,
        emoji_key: emojiKey,
        created_at: createdAt.toISOString(),
        before_window: Boolean(entry?.beforeWindow ?? entry?.before_window),
      };

      return normalizedEntry;
    })
    .filter((entry): entry is EmojiReactionEvent => entry !== null)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const intervals: EmojiReactionInterval[] = [];

  for (let i = 0; i < normalized.length; i++) {
    const current = normalized[i];
    const currentStartMs = new Date(current.created_at).getTime();
    const nextStartMs =
      i + 1 < normalized.length
        ? new Date(normalized[i + 1].created_at).getTime()
        : windowEnd.getTime();

    const startMs = Math.max(currentStartMs, windowStart.getTime());
    const endMs = Math.min(nextStartMs, windowEnd.getTime());

    if (endMs <= startMs) {
      continue;
    }

    intervals.push({
      student_id: studentId,
      emoji_key: current.emoji_key,
      created_at: current.created_at,
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      before_window: Boolean(current.before_window || currentStartMs < windowStart.getTime()),
    });
  }

  return intervals;
}

export default function VisualizationModePage() {
  useVisualizationStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedSessionId = searchParams.get("sessionId")?.trim() ?? "";
  const currentUserId = localStorage.getItem("user_id");
  const [speed, setSpeed] = useState(1);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [sourceMode, setSourceMode] = useState<VisualizationSourceMode>(() =>
    selectedSessionId ? "db" : "csv",
  );
  const previousThemeRef = useRef<string | null>(null);

  useEffect(() => {
    previousThemeRef.current = document.documentElement.getAttribute("data-theme");

    return () => {
      if (previousThemeRef.current === null) {
        document.documentElement.removeAttribute("data-theme");
        return;
      }

      document.documentElement.setAttribute("data-theme", previousThemeRef.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const [scheduleRows, setScheduleRows] = useState<VisualizationScheduleRow[]>([]);
  const [dbHelpRows, setDbHelpRows] = useState<HelpRow[] | null>(null);
  const [dbRequestRows, setDbRequestRows] = useState<RequestRow[] | null>(null);
  const [csvHelpRows, setCsvHelpRows] = useState<HelpRow[] | null>(null);
  const [csvRequestRows, setCsvRequestRows] = useState<RequestRow[] | null>(null);
  const [groups, setGroups] = useState<Record<string, GroupPayload> | null>(null);
  const [teacherCsvFile, setTeacherCsvFile] = useState<File | null>(null);
  const [studentCsvFile, setStudentCsvFile] = useState<File | null>(null);
  const [teacherFileName, setTeacherFileName] = useState<string | null>(null);
  const [studentFileName, setStudentFileName] = useState<string | null>(null);
  const [selectedSessionName, setSelectedSessionName] = useState<string | null>(null);
  const [selectedSessionPermissions, setSelectedSessionPermissions] = useState<SessionData["permissions"] | null>(null);
  const [sessionDataLoading, setSessionDataLoading] = useState(false);
  const [csvRefreshLoading, setCsvRefreshLoading] = useState(false);
  const [, setSessionDataError] = useState<string | null>(null);
  const [, setSetupLoading] = useState(false);
  const [, setSetupError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [isnapPrefix, setIsnapPrefix] = useState("G2L");

  const [slider, setSlider] = useState(0);
  const [sliderMax, setSliderMax] = useState(1);
  const [playing, setPlaying] = useState(false);

  const [focusStart, setFocusStart] = useState<string | null>(null);

  const [studentViewId, setStudentViewId] = useState<string | null>(null);

  const [logFilters, setLogFilters] = useState<LogFilters>({});
  const [activeFilterKey, setActiveFilterKey] = useState<FilterKey>("student");
  const [filterDraft, setFilterDraft] = useState<string>("");

  // iSnap cache
  const [codeUrlCache, setCodeUrlCache] = useState<Record<string, any[]>>({});
  const [codeUrlsLoading, setCodeUrlsLoading] = useState(false);
  const [codeUrlsError, setCodeUrlsError] = useState<string | null>(null);
  const [emojiReactionsByStudent, setEmojiReactionsByStudent] = useState<
    Record<string, EmojiReactionInterval[]>
  >({});

  // IMPORTANT: bump this to force iframe reload even if URL didn't change
  const [isnapReloadToken, setIsnapReloadToken] = useState(0);

  const studentCodeCardRef = useRef<HTMLDivElement | null>(null);
  const [isStudentCodeFullscreen, setIsStudentCodeFullscreen] = useState(false);
  const previousSessionIdRef = useRef(selectedSessionId);

  useEffect(() => {
    const onFsChange = () => {
      setIsStudentCodeFullscreen(document.fullscreenElement === studentCodeCardRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    setSourceMode(selectedSessionId ? "db" : "csv");
  }, [selectedSessionId]);

  useEffect(() => {
    if (previousSessionIdRef.current === selectedSessionId) {
      return;
    }

    previousSessionIdRef.current = selectedSessionId;
    setCsvHelpRows(null);
    setCsvRequestRows(null);
    setTeacherCsvFile(null);
    setStudentCsvFile(null);
    setTeacherFileName(null);
    setStudentFileName(null);
  }, [selectedSessionId]);

  const toggleStudentCodeFullscreen = () => {
    const el = studentCodeCardRef.current;
    if (!el) return;

    if (document.fullscreenElement === el) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };


  const clearAllFilters = () => setLogFilters({});

  const activeHelpRows = sourceMode === "db" ? dbHelpRows : csvHelpRows;
  const activeRequestRows = sourceMode === "db" ? dbRequestRows : csvRequestRows;
  const validScheduleRows = useMemo(
    () => getValidVisualizationScheduleRows(scheduleRows),
    [scheduleRows],
  );
  const configuredReplayWindows = useMemo(
    () => validScheduleRows.filter(hasConfiguredVisualizationSeats),
    [validScheduleRows],
  );
  const hasSavedSchedule = validScheduleRows.length > 0;
  const hasSavedSeatMaps = hasSavedSchedule && validScheduleRows.every(hasConfiguredVisualizationSeats);

  const loadCsvData = async <T,>(
    file: File,
    setFileName: (name: string) => void,
    parser: (rows: Record<string, string>[]) => T,
    setData: (value: T) => void,
    setStoredFile?: (file: File | null) => void,
  ) => {
    try {
      setStoredFile?.(file);
      setFileName(file.name);
      const rows = await parseCsvFile(file);
      setData(parser(rows));
    } catch (error) {
      console.error("Failed to parse CSV file", error);
    }
  };

  const loadSelectedSessionSetup = useCallback(async () => {
    if (!selectedSessionId) {
      setScheduleRows([]);
      setSetupLoading(false);
      setSetupError(null);
      return;
    }

    setSetupLoading(true);
    setSetupError(null);

    try {
      const rows = await fetchVisualizationSetup(selectedSessionId, currentUserId);
      setScheduleRows(rows);
    } catch (error) {
      console.error("Failed to load visualization setup", error);
      setScheduleRows([]);
      setSetupError("We couldn't load this session setup right now.");
    } finally {
      setSetupLoading(false);
    }
  }, [currentUserId, selectedSessionId]);

  const loadSelectedSessionData = useCallback(async () => {
    if (!selectedSessionId) {
      return;
    }

    setSessionDataLoading(true);
    setSessionDataError(null);

    try {
      const sessionData = await fetchVisualizationSessionData(selectedSessionId, currentUserId);

      setSelectedSessionName(
        sessionData.session?.lesson_name ||
          sessionData.session?.teacher_name ||
          `Session ${selectedSessionId}`,
      );
      setSelectedSessionPermissions(sessionData.session?.permissions ?? null);
      setDbHelpRows(sessionData.teacherRows);
      setDbRequestRows(sessionData.studentRows);
    } catch (error) {
      console.error("Failed to load visualization session data", error);
      setSelectedSessionPermissions(null);
      setSessionDataError("We couldn't load this session right now.");
    } finally {
      setSessionDataLoading(false);
    }
  }, [currentUserId, selectedSessionId]);

  const refreshUploadedCsvData = useCallback(async () => {
    if (!teacherCsvFile && !studentCsvFile) {
      return;
    }

    setCsvRefreshLoading(true);
    setSessionDataError(null);

    try {
      const reloads: Promise<void>[] = [];

      if (teacherCsvFile) {
        reloads.push(
          parseCsvFile(teacherCsvFile).then((rows) => {
            setTeacherFileName(teacherCsvFile.name);
            setCsvHelpRows(parseHelp(rows));
          }),
        );
      }

      if (studentCsvFile) {
        reloads.push(
          parseCsvFile(studentCsvFile).then((rows) => {
            setStudentFileName(studentCsvFile.name);
            setCsvRequestRows(parseRequests(rows));
          }),
        );
      }

      await Promise.all(reloads);
    } catch (error) {
      console.error("Failed to reload uploaded CSV files", error);
      setSessionDataError("We couldn't reload the uploaded CSV files.");
    } finally {
      setCsvRefreshLoading(false);
    }
  }, [studentCsvFile, teacherCsvFile]);

  useEffect(() => {
    if (selectedSessionId) {
      return;
    }

    setSelectedSessionName(null);
    setSessionDataLoading(false);
    setSessionDataError(null);
    setSetupLoading(false);
    setSetupError(null);
    setDbHelpRows(null);
    setDbRequestRows(null);
    setScheduleRows([]);
    setSelectedSessionPermissions(null);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId || sourceMode !== "db") {
      return;
    }

    loadSelectedSessionData();
  }, [loadSelectedSessionData, selectedSessionId, sourceMode]);

  useEffect(() => {
    loadSelectedSessionSetup();
  }, [loadSelectedSessionSetup]);

  const removeFilterValue = (key: FilterKey, value: string) => {
    setLogFilters((prev) => {
      const next: LogFilters = { ...prev };
      const arr = (next[key] ?? []).filter((v) => v !== value);
      if (arr.length === 0) delete next[key];
      else next[key] = arr;
      return next;
    });

    if (key === "student") {
      setStudentViewId((prev) => (prev === value ? null : prev));
    }
  };

  const addFilterValue = (key: FilterKey, raw: string) => {
    const value = raw.trim();
    if (!value) return;

    setLogFilters((prev) => {
      const next: LogFilters = { ...prev };
      const cur = next[key] ?? [];
      if (!cur.includes(value)) next[key] = [...cur, value];
      return next;
    });
  };

  const appliedFilterEntries = useMemo(() => {
    const entries: Array<{ key: FilterKey; value: string }> = [];
    (Object.keys(FILTER_LABELS) as FilterKey[]).forEach((k) => {
      (logFilters[k] ?? []).forEach((v) => entries.push({ key: k, value: v }));
    });
    return entries;
  }, [logFilters]);

  const filterTabRows = useMemo(() => {
    const keys = Object.keys(FILTER_LABELS) as FilterKey[];
    const midpoint = Math.ceil(keys.length / 2);
    return [keys.slice(0, midpoint), keys.slice(midpoint)];
  }, []);

  function compareDateStrings(a: string, b: string) {
    const aMs = parseDateOnly(a)?.getTime();
    const bMs = parseDateOnly(b)?.getTime();
    if (aMs !== undefined && bMs !== undefined) return aMs - bMs;
    if (aMs !== undefined) return -1;
    if (bMs !== undefined) return 1;
    return a.localeCompare(b);
  }

  useEffect(() => {
    if (configuredReplayWindows.length === 0) {
      setGroups(null);
      setSelectedDate(null);
      setPeriod(null);
      setSlider(0);
      setFocusStart(null);
      setStudentViewId(null);
      setLogFilters({});
      setActiveFilterKey("student");
      setFilterDraft("");
      setCodeUrlCache({});
      setCodeUrlsError(null);
      setCodeUrlsLoading(false);
      setEmojiReactionsByStudent({});
      setIsnapReloadToken(0);
      return;
    }

    const built = buildGroups(configuredReplayWindows, activeHelpRows, activeRequestRows);
    setGroups(built);

    const dates = Array.from(new Set(Object.values(built).map((g) => g.date))).sort(
        compareDateStrings
    );

    const first = dates[0] ?? null;
    setSelectedDate(first);

    const periods =
        first !== null
            ? Array.from(
                new Set(
                    Object.values(built)
                        .filter((g) => g.date === first)
                        .map((g) => g.period)
                )
            ).sort((a, b) => Number(a) - Number(b))
            : [];

    setPeriod(periods[0] ?? null);
    setSlider(0);
    setFocusStart(null);
    setStudentViewId(null);
    setLogFilters({});
    setActiveFilterKey("student");
    setFilterDraft("");

    setCodeUrlCache({});
    setCodeUrlsError(null);
    setCodeUrlsLoading(false);
    setEmojiReactionsByStudent({});

    setIsnapReloadToken(0);
  }, [configuredReplayWindows, activeHelpRows, activeRequestRows]);

  const current = useMemo(() => {
    if (!groups || !selectedDate || !period || selectedDate === ALL_DATES) return null;
    return groups[`${selectedDate} | ${period}`] ?? null;
  }, [groups, selectedDate, period]);

  const refreshCodeUrls = useCallback(async () => {
    if (!selectedSessionId || !current?.t0 || !current?.t1) {
      setCodeUrlCache({});
      setCodeUrlsError(null);
      setCodeUrlsLoading(false);
      return;
    }

    const studentIds = Array.from(
        new Set(
            (current.seats ?? [])
                .map((s) => String((s as any).studentid ?? "").trim())
                .filter((sid) => sid.length > 0 && sid.toLowerCase() !== "teacher" && sid !== "-1")
        )
    );

    if (studentIds.length === 0) {
      setCodeUrlCache({});
      setCodeUrlsError(null);
      setCodeUrlsLoading(false);
      return;
    }

    const { start, end } = getApiWindow(current);

    if (!start || !end) {
      setCodeUrlCache({});
      setCodeUrlsError("Missing session window for code snapshot query");
      setCodeUrlsLoading(false);
      return;
    }

    setCodeUrlsLoading(true);
    setCodeUrlsError(null);

    try {
      const data = await fetchVisualizationCodeUrls({
        sessionId: selectedSessionId,
        userId: currentUserId,
        students: studentIds,
        prefix: isnapPrefix.trim(),
        start,
        end,
      });

      const next: Record<string, any[]> = {};
      for (const s of data.students ?? []) {
        next[String(s.studentNumber)] = s.entries ?? [];
      }
      setCodeUrlCache(next);
    } catch (e: any) {
      setCodeUrlCache({});
      setCodeUrlsError(e?.message ?? "Failed to fetch code snapshots");
    } finally {
      setCodeUrlsLoading(false);
    }
  }, [current?.t0, current?.t1, current?.seats, currentUserId, isnapPrefix, selectedSessionId]);

  useEffect(() => {
    refreshCodeUrls();
  }, [refreshCodeUrls]);

  const refreshEmojiReactions = useCallback(async () => {
    if (!selectedSessionId || !current?.t0 || !current?.t1) {
      setEmojiReactionsByStudent({});
      return;
    }

    const studentIds = Array.from(
      new Set(
        (current.seats ?? [])
          .map((s) => String((s as any).studentid ?? "").trim())
          .filter(
            (sid) =>
              sid.length > 0 && sid.toLowerCase() !== "teacher" && sid !== "-1"
          )
      )
    );

    if (studentIds.length === 0) {
      setEmojiReactionsByStudent({});
      return;
    }

    const { start, end } = getApiWindow(current);

    if (!start || !end) {
      setEmojiReactionsByStudent({});
      return;
    }

    const sessionStartIso = current.t0;
    const sessionEndIso = current.t1;

    try {
      const data = await fetchVisualizationEmojiReactions({
        sessionId: selectedSessionId,
        userId: currentUserId,
        students: studentIds,
        prefix: isnapPrefix.trim(),
        start,
        end,
      });

      const next: Record<string, EmojiReactionInterval[]> = {};
      for (const student of data.students ?? []) {
        const sid = String(student?.studentNumber ?? "").trim();
        if (!sid) continue;

        next[sid] = buildEmojiReactionIntervals(
          student?.entries ?? [],
          sid,
          sessionStartIso,
          sessionEndIso
        );
      }

      setEmojiReactionsByStudent(next);
    } catch (e: any) {
      setEmojiReactionsByStudent({});
      console.error(
        "Failed to fetch emoji reactions",
        e?.message ?? e ?? "Unknown error"
      );
    }
  }, [current?.t0, current?.t1, current?.seats, currentUserId, isnapPrefix, selectedSessionId]);

  useEffect(() => {
    refreshEmojiReactions();
  }, [refreshEmojiReactions]);

  useEffect(() => {
    if (!current || !current.t0 || !current.t1) return;
    const t0 = new Date(current.t0);
    const t1 = new Date(current.t1);
    const total = Math.max(1, Math.floor((t1.getTime() - t0.getTime()) / 1000));
    setSlider(0);
    setSliderMax(total);
  }, [current?.t0, current?.t1]);

  function getApiWindow(current: GroupPayload) {
    return { start: current.t0, end: current.t1, source: "t0t1" };
  }


  function formatDateLabel(raw: string): string {
    const dt = parseDateOnly(raw);
    if (dt) {
      return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
    return raw;
  }

  function parseClockBase(label: string | undefined | null) {
    if (!label) return null;
    const m = label.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!m) return null;

    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const sec = m[3] ? parseInt(m[3], 10) : 0;
    const ampm = m[4]?.toUpperCase();
    const twelveHour = !!ampm;

    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    return { seconds: h * 3600 + min * 60 + sec, twelveHour, hasSeconds: Boolean(m[3]) };
  }

  function formatClockFromSeconds(
    total: number,
    twelveHour: boolean,
    includeSeconds = true,
  ): string {
    const day = 24 * 3600;
    let s = ((total % day) + day) % day;
    let h = Math.floor(s / 3600);
    s -= h * 3600;
    const m = Math.floor(s / 60);
    const sec = s - m * 60;
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (!twelveHour) return `${pad(h)}:${pad(m)}:${pad(sec)}`;

    const ampm = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const secondsText = includeSeconds ? `:${pad(sec)}` : "";
    return `${h12}:${pad(m)}${secondsText} ${ampm}`;
  }

  function formatClockLabel(label: string | undefined | null): string {
    const base = parseClockBase(label);
    if (!base) return label ?? "";
    return formatClockFromSeconds(base.seconds, true, base.hasSeconds);
  }

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const baseStep = sliderMax > 10800 ? 5 : 1;
      setSlider((s) => (s >= sliderMax ? 0 : s + baseStep * speed));
    }, 240);
    return () => clearInterval(id);
  }, [playing, sliderMax, speed]);

  const tNow = useMemo(() => {
    if (!current || !current.t0) return new Date();
    const t0 = new Date(current.t0);
    return new Date(t0.getTime() + slider * 1000);
  }, [current?.t0, slider]);

  const prettyRange = useMemo(() => {
    if (!current) return "";
    if (current.t0_label && current.t1_label) {
      const dateLabel = formatDateLabel(current.date);
      return `${dateLabel} ${formatClockLabel(current.t0_label)} - ${formatClockLabel(current.t1_label)}`;
    }
    if (!current.t0 || !current.t1) return "";
    const fmt: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    const a = new Date(current.t0).toLocaleString([], fmt);
    const b = new Date(current.t1).toLocaleString([], fmt);
    return `${a} - ${b}`;
  }, [current]);

  const hudLine = useMemo(() => {
    if (!current) return { teacher: "", requests: "", clock: "" };

    let activeTeacher: string | null = null;
    if (current.has_help && current.help_intervals) {
      outer: for (const [sid, arr] of Object.entries(current.help_intervals)) {
        for (const [s, e] of arr) {
          const sdt = new Date(s);
          const edt = new Date(e);
          if (sdt <= tNow && tNow < edt) {
            activeTeacher = sid;
            break outer;
          }
        }
      }
    }

    const requestingNow: string[] = [];
    if (current.has_requests && current.request_intervals) {
      for (const [sid, arr] of Object.entries(current.request_intervals)) {
        for (const [s, e] of arr) {
          const sdt = new Date(s);
          const edt = new Date(e);
          if (sdt <= tNow && tNow < edt) {
            requestingNow.push(sid);
            break;
          }
        }
      }
    }

    const teacher = activeTeacher ? `Student ${activeTeacher}` : "None";
    const requests = requestingNow.length > 0 ? requestingNow.map((id) => `Student ${id}`).join(", ") : "None";

    const t0Label = (current as any).t0_label as string | undefined;
    const base = parseClockBase(t0Label);
    let clock: string;

    if (base) {
      clock = formatClockFromSeconds(base.seconds + slider, true);
    } else {
      clock = tNow.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }

    return { teacher, requests, clock };
  }, [current, tNow, slider]);

  const isCumulativeView = selectedDate === ALL_DATES;
  const hasSelectedSession = selectedSessionId.length > 0;
  const showObservationCsvUploads = !hasSelectedSession || sourceMode === "csv";
  const hasUploadedCsvFiles = Boolean(teacherCsvFile || studentCsvFile);
  const hasStageContent = Boolean((groups && isCumulativeView && period) || (groups && current));
  const hasLogContent = Boolean(current);
  const shouldCenterShell = !hasStageContent && !hasLogContent;
  const refreshButtonBusy = sourceMode === "db" ? sessionDataLoading : csvRefreshLoading;
  const refreshButtonDisabled =
    sourceMode === "db" ? sessionDataLoading : csvRefreshLoading || !hasUploadedCsvFiles;
  const handleRefresh = () => {
    if (sourceMode === "db") {
      void loadSelectedSessionData();
      return;
    }

    void refreshUploadedCsvData();
  };
  const statusText = current
      ? prettyRange
      : groups
          ? isCumulativeView
              ? "Session window is hidden in cumulative view. Choose a specific date to inspect a single session."
              : "Select a date and period to see the session window."
          : hasSelectedSession
              ? !hasSavedSchedule
                  ? "Define the dates, periods, and time ranges in Session Setup to start the visualization."
                  : !hasSavedSeatMaps
                      ? "Add a seating chart to each replay window in Session Setup to start the visualization."
                      : sourceMode === "db"
                          ? "Choose a date and period to start the visualization."
                          : "Choose a date and period, then upload teacher and student CSV files if needed."
              : "Open a saved session from Sessions to begin.";
  const playbackTimeZone = current?.timezone ?? null;

  const dateOptions = groups
      ? [
        ...Array.from(new Set(Object.values(groups).map((g) => g.date))).sort(
            compareDateStrings
        ),
        ALL_DATES,
      ]
      : [];

  const periods =
      groups && selectedDate
          ? Array.from(
              new Set(
                  Object.values(groups as Record<string, GroupPayload>)
                      .filter((g) => (selectedDate === ALL_DATES ? true : g.date === selectedDate))
                      .map((g) => g.period)
              )
          ).sort((a, b) => Number(a) - Number(b))
          : [];

  const handleDateChange = (d: string) => {
    setSelectedDate(d);
    if (!groups) return;

    const ps = Array.from(
        new Set(
            Object.values(groups)
                .filter((g) => (d === ALL_DATES ? true : g.date === d))
                .map((g) => g.period)
        )
    ).sort((a, b) => Number(a) - Number(b));

    setPeriod((prev) => {
      if (prev && ps.includes(prev)) return prev;
      return ps[0] ?? null;
    });

    setSlider(0);
    setFocusStart(null);
    setStudentViewId(null);
    setLogFilters({});
    setActiveFilterKey("student");
    setFilterDraft("");
  };

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    setSlider(0);
    setFocusStart(null);
    setStudentViewId(null);
    setLogFilters({});
    setActiveFilterKey("student");
    setFilterDraft("");
  };

  const onSelectStudent = (sid: string) => {
    if (!sid) return;

    setStudentViewId((prev) => (prev === sid ? null : sid));

    setLogFilters((prev) => {
      const cur = prev.student ?? [];
      const isSameSingle = cur.length === 1 && cur[0] === sid;

      const next: LogFilters = { ...prev };
      if (isSameSingle) delete next.student;
      else next.student = [sid];
      return next;
    });

    setActiveFilterKey("student");
    setFilterDraft("");
    setFocusStart(null);
  };

  const exitStudentView = () => {
    setStudentViewId(null);
    setLogFilters({});
    setActiveFilterKey("student");
    setFilterDraft("");
    setFocusStart(null);
  };

  const logPanelTitle = studentViewId ? `Student ${studentViewId}'s Logs` : "Logs";

  return (
      <div className={`visualization-page${shouldCenterShell ? " visualization-page-centered" : ""}`}>
        <div className="visualization-shell card shell">
          <div className="px-2 sm:px-3">
            <div className="viewer-header">
              <div className="viewer-header-nav">
                <button
                  type="button"
                  className="theme-btn inline-flex items-center gap-2"
                  onClick={() => navigate("/apps")}
                >
                  <Home size={16} aria-hidden="true" />
                  Home
                </button>
                {hasSelectedSession ? (
                  <button
                    type="button"
                    className="theme-btn inline-flex items-center gap-2"
                    onClick={handleRefresh}
                    disabled={refreshButtonDisabled}
                  >
                    <RefreshCw
                      size={16}
                      aria-hidden="true"
                      className={refreshButtonBusy ? "animate-spin" : undefined}
                    />
                    {refreshButtonBusy ? "Loading..." : "Refresh"}
                  </button>
                ) : null}
              </div>

              <div className="viewer-header-copy">
                <h1 className="viewer-heading-line">
                  <span className="viewer-title">Visualization Mode</span>
                  <span className="viewer-heading-divider" aria-hidden="true" />
                  <span className="viewer-subtitle">
                    {selectedSessionName ? `Replaying ${selectedSessionName}` : "Observation replay"}
                  </span>
                </h1>
              </div>

              <div className="viewer-header-actions">
                <button
                  type="button"
                  className="theme-btn inline-flex items-center gap-2"
                  onClick={() => navigate("/visualization")}
                >
                  <List size={16} aria-hidden="true" />
                  Sessions
                </button>
                {hasSelectedSession && selectedSessionPermissions?.can_edit_visualization ? (
                  <button
                    type="button"
                    className="theme-btn"
                    onClick={() => navigate(`/visualization/setup?sessionId=${encodeURIComponent(selectedSessionId)}`)}
                  >
                    Session Setup
                  </button>
                ) : null}
                <button className="theme-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? "Light Theme" : "Dark Theme"}
                </button>
              </div>
            </div>

            {/* Uploads */}
            <div className="toolbar">
              {hasSelectedSession ? (
                <div className="toolbar-source">
                  <div className="source-toggle" role="tablist" aria-label="Visualization data source">
                    <button
                      type="button"
                      className={`source-toggle-btn ${sourceMode === "db" ? "source-toggle-btn-active" : ""}`}
                      aria-pressed={sourceMode === "db"}
                      onClick={() => setSourceMode("db")}
                    >
                      DB Data
                    </button>
                    <button
                      type="button"
                      className={`source-toggle-btn ${sourceMode === "csv" ? "source-toggle-btn-active" : ""}`}
                      aria-pressed={sourceMode === "csv"}
                      onClick={() => {
                        setSourceMode("csv");
                        setSessionDataError(null);
                      }}
                    >
                      CSV Data
                    </button>
                    <div className="source-toggle-tip">
                      <InfoTip
                        content="DB Data pulls observation data from the database. CSV Data lets you upload teacher and student CSV files instead."
                        label="Explain data source"
                        align="right"
                        side="top"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="toolbar-chips">
                {showObservationCsvUploads ? (
                  <>
                    <UploadChip
                      title="Teacher CSV"
                      tip="Upload the teacher observation CSV. It is used to place the teacher, show help intervals, and populate teacher log entries."
                      tipAlign="center"
                      selectedFileName={teacherFileName}
                      onFileSelect={(file) =>
                        loadCsvData(file, setTeacherFileName, parseHelp, (value) => {
                          setCsvHelpRows(value);
                          setSessionDataError(null);
                        }, setTeacherCsvFile)
                      }
                    />

                    <UploadChip
                      title="Student CSV"
                      tip="Upload the student observation CSV. It populates student logs with behaviors, affect, and help-request intervals."
                      tipAlign="right"
                      selectedFileName={studentFileName}
                      onFileSelect={(file) =>
                        loadCsvData(file, setStudentFileName, parseRequests, (value) => {
                          setCsvRequestRows(value);
                          setSessionDataError(null);
                        }, setStudentCsvFile)
                      }
                    />
                  </>
                ) : null}
              </div>
            </div>

              <ControlsPanel
                  selectedDate={selectedDate}
                  dateOptions={dateOptions}
                  period={period}
                  periods={periods}
                  isnapPrefix={isnapPrefix}
                  speed={speed}
                  slider={slider}
                  sliderMax={sliderMax}
                playing={playing}
                current={current}
                statusText={statusText}
                playbackTimeZone={playbackTimeZone}
                hudLine={hudLine}
                  formatDateLabel={formatDateLabel}
                  onDateChange={handleDateChange}
                  onPeriodChange={handlePeriodChange}
                  onIsnapPrefixChange={setIsnapPrefix}
                  onSpeedChange={(s) => setSpeed(s)}
                  onPlayToggle={() => {
                  setPlaying((p) => !p);
                  setFocusStart(null);
                }}
                onSliderChange={(v) => setSlider(v)}
                allDatesMode={selectedDate === ALL_DATES}
                allDatesValue={ALL_DATES}
            />

            <div className="main-row">
              <div id="stage" className={`stage${hasStageContent ? "" : " stage-empty"}`}>
                {groups && selectedDate === ALL_DATES && period ? (
                    <CumulativeHeatmap groups={groups} period={period} />
                ) : groups && current ? (
                    studentViewId ? (
                        <div className="student-code-view">
                          <div className="student-code-header">
                            {/* left controls */}
                            <div className="student-code-left">
                              <button
                                  className="student-back-btn"
                                  onClick={exitStudentView}
                                  aria-label="Back to seating chart"
                                  title="Go back to seating chart view"
                              >
                                Back
                              </button>

                              <button
                                  className="student-back-btn"
                                  type="button"
                                  onClick={() => {
                                    refreshCodeUrls();
                                    setIsnapReloadToken((x) => x + 1);
                                  }}
                                  disabled={codeUrlsLoading}
                                  title="Reload the code viewer for this student"
                              >
                                Refresh
                              </button>
                            </div>

                            {/* centered title */}
                            <div className="student-code-title">
                              Student {studentViewId}'s Current Code
                            </div>

                            {/* right controls */}
                            <div className="student-code-right">
                              <button
                                  type="button"
                                  className="student-icon-btn"
                                  onClick={toggleStudentCodeFullscreen}
                                  aria-label={isStudentCodeFullscreen ? "Exit full screen" : "Full screen"}
                                  title={isStudentCodeFullscreen ? "Exit full screen" : "Full screen"}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                      d="M8 3H5a2 2 0 0 0-2 2v3h2V5h3V3Zm11 0h-3v2h3v3h2V5a2 2 0 0 0-2-2ZM5 16H3v3a2 2 0 0 0 2 2h3v-2H5v-3Zm16 0h-2v3h-3v2h3a2 2 0 0 0 2-2v-3Z"
                                      fill="currentColor"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {codeUrlsError ? <div className="placeholder">Error: {codeUrlsError}</div> : null}

                          <div className="student-code-card" ref={studentCodeCardRef}>
                            <StudentCodeView
                                sessionId={selectedSessionId}
                                userId={currentUserId}
                                studentNumber={studentViewId}
                                tNow={tNow}
                                entries={codeUrlCache[studentViewId] ?? []}
                                loadingEntries={codeUrlsLoading}
                                reloadToken={isnapReloadToken}
                            />
                          </div>
                        </div>
                    ) : (
                        <SeatingSVG group={current} tNow={tNow} onSelectStudent={onSelectStudent}
                                    selectedStudentId={studentViewId}
                                    emojiReactionsByStudent={emojiReactionsByStudent}/>
                    )
                ) : (
                    <div className="viewer-empty-state">
                      <div className="viewer-empty-copy">
                        {hasSelectedSession
                          ? !hasSavedSchedule
                                  ? "Define this session's dates, periods, and time ranges in Session Setup to view it here."
                                  : !hasSavedSeatMaps
                                      ? "Add a seating chart to each replay window in Session Setup to view this session."
                                  : sourceMode === "db"
                                      ? "Choose a date and period to view this session."
                                      : "Choose a date and period, then upload teacher and student CSV files if needed."
                          : "Open a saved session from Sessions to start the visualization."}
                      </div>
                    </div>
                )}
              </div>

              <div className={`log-panel${hasLogContent ? "" : " log-panel-empty"}`}>
                <div className="panel-title-row">
                  <div className="panel-title">{logPanelTitle}</div>
                  <InfoTip
                    content="Shows the observation log entries for the current session. Click a log entry to jump playback to that moment."
                    label="Explain logs"
                    align="right"
                  />
                </div>

                <div className="log-filterbar">
                  <div className="log-filterbar-head">
                    <div className="log-filterbar-title">Filters</div>
                    <InfoTip
                      content="Use these tabs and search field to filter the log list by student, tags, affect, location, or note text."
                      label="Explain filters"
                      align="right"
                    />
                  </div>

                  <div className="filter-tabs" role="tablist" aria-label="Log filters">
                    {filterTabRows.map((row, rowIdx) => (
                        <div key={rowIdx} className="filter-tabs-row">
                          {row.map((k) => (
                              <button
                                  key={k}
                                  type="button"
                                  className={`filter-tab ${activeFilterKey === k ? "filter-tab-active" : ""}`}
                                  onClick={() => {
                                    setActiveFilterKey(k);
                                    setFilterDraft("");
                                  }}
                              >
                                {FILTER_LABELS[k]}
                              </button>
                          ))}
                        </div>
                    ))}
                  </div>

                  <div className="filter-input-row">
                    <input
                        className="log-filter-input"
                        value={filterDraft}
                        placeholder={FILTER_PLACEHOLDERS[activeFilterKey]}
                        onChange={(e) => setFilterDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addFilterValue(activeFilterKey, filterDraft);
                            setFilterDraft("");
                          }
                        }}
                        aria-label={`Add ${FILTER_LABELS[activeFilterKey]} filter`}
                    />

                    {appliedFilterEntries.length > 0 && (
                        <button
                            type="button"
                            className="filter-clear-all"
                            onClick={() => {
                              clearAllFilters();
                              setStudentViewId(null);
                            }}
                        >
                          Clear all
                        </button>
                    )}
                  </div>

                  {appliedFilterEntries.length > 0 && (
                      <div className="applied-filters" aria-label="Applied filters">
                        {appliedFilterEntries.map(({ key, value }, idx) => (
                            <span key={`${key}:${value}:${idx}`} className="filter-pill">
                        <span className="filter-pill-label">{FILTER_LABELS[key]}:</span>
                        <span className="filter-pill-value">{value}</span>
                        <button
                            type="button"
                            className="filter-pill-x"
                            aria-label={`Remove ${FILTER_LABELS[key]} filter ${value}`}
                            onClick={() => removeFilterValue(key, value)}
                        >
                          x
                        </button>
                      </span>
                        ))}
                      </div>
                  )}
                </div>

                {current ? (
                    <LogsPanel
                        group={current}
                        tNow={tNow}
                        focusStart={focusStart}
                        filters={logFilters}
                        emojiReactionsByStudent={emojiReactionsByStudent}
                        onJumpTo={(isoStart) => {
                          if (!current || !current.t0) return;

                          const start = new Date(isoStart);
                          const t0 = new Date(current.t0);
                          const sec = Math.max(0, Math.floor((start.getTime() - t0.getTime()) / 1000));
                          setSlider(Math.min(sliderMax, sec));
                          setFocusStart(isoStart);
                        }}
                    />
                ) : (
                    <div className="logs-empty-state">
                      <div className="log-empty">
                        {groups
                            ? isCumulativeView
                                ? "Logs are not shown in cumulative view. Choose a specific date to see individual logs."
                                : "Select a date and period to see logs."
                            : hasSelectedSession
                                ? !hasSavedSchedule
                                        ? "Define this session's dates, periods, and time ranges in Session Setup to view logs."
                                        : !hasSavedSeatMaps
                                            ? "Add a seating chart to each replay window in Session Setup to view logs."
                                        : sourceMode === "db"
                                            ? "Choose a date and period to view logs."
                                            : "Choose a date and period, then upload teacher and student CSV files if needed."
                                : "Open a saved session from Sessions to view logs."}
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

