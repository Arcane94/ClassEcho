// Render teacher, student, and emoji logs for the currently selected replay window.
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";
import type { EmojiReactionInterval, GroupPayload, LogFilters } from "../types";
import { clsx, fmtMS, VISUALIZATION_ICON_BASE } from "../utils";

type LogsPanelProps = {
    group: GroupPayload;
    tNow: Date;
    onJumpTo: (isoStart: string) => void;
    focusStart?: string | null;
    filters?: LogFilters;
    emojiReactionsByStudent?: Record<string, EmojiReactionInterval[]>;
};

type CombinedLog = {
    kind: "Teacher" | "Student" | "Emoji";
    start: string;
    end: string;
    student_id: string;

    behavior_tags: string;
    function_tags?: string;
    structure_tags?: string;
    custom_tags?: string;

    affect?: string;
    on_task?: string;
    location?: string;
    note?: string;

    start_label?: string;
    end_label?: string;
    emoji_key?: string;
};

function emojiIconHref(emojiKey: string) {
    return `${VISUALIZATION_ICON_BASE}/${encodeURIComponent(emojiKey)}.png`;
}

function formatEmojiTimeLabel(iso: string) {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) {
        return "";
    }

    return dt.toTimeString().slice(0, 8);
}

function norm(s: string) {
    return s.trim().toLowerCase();
}

function matchesText(raw: string | undefined, qRaw: string) {
    const q = norm(qRaw);
    if (!q) return true;
    const s = (raw ?? "").trim().toLowerCase();
    if (!s) return false;
    return s.includes(q);
}

function matchesTagList(tagsRaw: string | undefined, qRaw: string) {
    const q = norm(qRaw);
    if (!q) return true;
    const raw = (tagsRaw ?? "").trim();
    if (!raw) return false;

    const parts = raw
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase());

    return parts.some((p) => p === q || p.includes(q));
}

function anyMatch(values: string[] | undefined, predicate: (v: string) => boolean) {
    if (!values || values.length === 0) return true;
    return values.some((v) => predicate(v));
}

function splitLogStudentIds(raw: string) {
    return raw
        .split(/[;,]+/)
        .map((value) => value.trim())
        .filter(Boolean);
}

function formatStudentPillLabel(raw: string) {
    const studentIds = splitLogStudentIds(raw);
    if (studentIds.length <= 1) {
        return `Student ${raw}`;
    }

    return `Students ${studentIds.join(", ")}`;
}

type ScrollbarState = {
    visible: boolean;
    thumbHeight: number;
    thumbOffset: number;
};

const SCROLLBAR_BUTTON_SIZE = 16;
const SCROLLBAR_STEP_RATIO = 0.2;

export function LogsPanel({
    group,
    tNow,
    onJumpTo,
    focusStart,
    filters = {},
    emojiReactionsByStudent = {},
}: LogsPanelProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const dragRef = useRef<{
        startY: number;
        startScrollTop: number;
        thumbHeight: number;
    } | null>(null);

    const [scrollbarState, setScrollbarState] = useState<ScrollbarState>({
        visible: false,
        thumbHeight: 44,
        thumbOffset: 0,
    });

    const logsAll: CombinedLog[] = useMemo(() => {
        const merged: CombinedLog[] = [];

        (group.teacher_logs || []).forEach((r) => {
            merged.push({
                kind: "Teacher",
                start: r.start,
                end: r.end,
                student_id: r.student_id,
                behavior_tags: r.behavior_tags,
                function_tags: r.function_tags,
                structure_tags: r.structure_tags,
                custom_tags: r.custom_tags,
                location: r.location,
                note: r.note,
                start_label: r.start_label,
                end_label: r.end_label,
            });
        });

        (group.student_logs || []).forEach((r) => {
            merged.push({
                kind: "Student",
                start: r.start,
                end: r.end,
                student_id: r.student_id,
                behavior_tags: r.behavior_tags,
                affect: r.affect,
                on_task: r.on_task,
                location: r.location,
                note: r.note,
                start_label: r.start_label,
                end_label: r.end_label,
            });
        });

        Object.entries(emojiReactionsByStudent).forEach(([studentId, intervals]) => {
            intervals.forEach((interval) => {
                merged.push({
                    kind: "Emoji",
                    start: interval.start,
                    end: interval.end,
                    student_id: studentId,
                    behavior_tags: "",
                    start_label: formatEmojiTimeLabel(interval.start),
                    end_label: formatEmojiTimeLabel(interval.end),
                    emoji_key: interval.emoji_key,
                });
            });
        });

        const filtered = merged.filter((row) => {
            const hasBehavior = row.behavior_tags && row.behavior_tags.trim() !== "";
            const hasAffect = row.affect && row.affect.trim() !== "";
            const hasCustom = row.custom_tags && row.custom_tags.trim() !== "";
            const hasNote = row.note && row.note.trim() !== "";
            const hasLocation = row.location && row.location.trim() !== "";
            const hasEmoji = row.emoji_key && row.emoji_key.trim() !== "";
            return hasBehavior || hasAffect || hasCustom || hasNote || hasLocation || hasEmoji;
        });

        return filtered.sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
    }, [emojiReactionsByStudent, group.teacher_logs, group.student_logs]);

    const logs: CombinedLog[] = useMemo(() => {
        const f = filters ?? {};

        return logsAll.filter((row) => {
            const rowStudentIds = splitLogStudentIds(row.student_id);
            if (!anyMatch(f.student, (v) => {
                const needle = v.trim();
                return row.student_id === needle || rowStudentIds.includes(needle);
            })) return false;
            if (!anyMatch(f.structure, (v) => matchesTagList(row.structure_tags, v))) return false;
            if (!anyMatch(f.behavior, (v) => matchesTagList(row.behavior_tags, v))) return false;
            if (!anyMatch(f.function, (v) => matchesTagList(row.function_tags, v))) return false;
            if (!anyMatch(f.affect, (v) => matchesText(row.affect, v))) return false;
            if (!anyMatch(f.emoji, (v) => matchesText(row.emoji_key, v))) return false;
            if (!anyMatch(f.location, (v) => matchesText(row.location, v))) return false;
            if (!anyMatch(f.note, (v) => matchesText(row.note, v))) return false;
            return true;
        });
    }, [logsAll, filters]);

    const updateScrollbar = () => {
        const el = scrollRef.current;
        if (!el) return;

        const clientHeight = el.clientHeight;
        const scrollHeight = el.scrollHeight;
        const scrollTop = el.scrollTop;
        const canScroll = scrollHeight - clientHeight > 1;

        if (!canScroll || clientHeight <= 0) {
            setScrollbarState((prev) => {
                if (!prev.visible && prev.thumbOffset === 0) return prev;
                return {
                    visible: false,
                    thumbHeight: 44,
                    thumbOffset: 0,
                };
            });
            return;
        }

        const trackHeight = Math.max(1, clientHeight - SCROLLBAR_BUTTON_SIZE * 2);
        const minThumbHeight = 34;
        const thumbHeight = Math.max(
            minThumbHeight,
            (clientHeight / scrollHeight) * trackHeight
        );
        const maxThumbOffset = Math.max(0, trackHeight - thumbHeight);
        const thumbOffset =
            maxThumbOffset <= 0
                ? 0
                : (scrollTop / (scrollHeight - clientHeight)) * maxThumbOffset;

        setScrollbarState((prev) => {
            if (
                prev.visible &&
                Math.abs(prev.thumbHeight - thumbHeight) < 0.5 &&
                Math.abs(prev.thumbOffset - thumbOffset) < 0.5
            ) {
                return prev;
            }

            return {
                visible: true,
                thumbHeight,
                thumbOffset,
            };
        });
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        updateScrollbar();

        const handleScroll = () => updateScrollbar();
        el.addEventListener("scroll", handleScroll);

        const contentEl = el.firstElementChild as HTMLElement | null;
        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => updateScrollbar())
                : null;

        resizeObserver?.observe(el);
        if (contentEl) resizeObserver?.observe(contentEl);
        window.addEventListener("resize", updateScrollbar);

        return () => {
            el.removeEventListener("scroll", handleScroll);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateScrollbar);
        };
    }, [logs]);

    useEffect(() => {
        let targetKey: string | null = focusStart || null;

        if (!targetKey && logs.length) {
            const tNowMs = tNow.getTime();

            let idx = logs.findIndex((row) => {
                const start = new Date(row.start);
                const end = new Date(row.end);
                return start <= tNow && tNow < end;
            });

            if (idx === -1) {
                let bestIdx = 0;
                let bestDiff = Number.POSITIVE_INFINITY;
                logs.forEach((row, i) => {
                    const diff = Math.abs(new Date(row.start).getTime() - tNowMs);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestIdx = i;
                    }
                });
                idx = bestIdx;
            }

            if (idx >= 0) targetKey = logs[idx].start;
        }

        if (!targetKey) return;
        const el = rowRefs.current[targetKey];
        if (el && el.scrollIntoView) {
            el.scrollIntoView({ block: "start", behavior: "smooth" });
        }
    }, [focusStart, tNow, logs]);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const drag = dragRef.current;
            const el = scrollRef.current;
            if (!drag || !el) return;

            const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
            const maxThumbOffset = Math.max(1, el.clientHeight - drag.thumbHeight);
            const deltaY = event.clientY - drag.startY;
            const nextScrollTop =
                drag.startScrollTop + (deltaY * maxScrollTop) / maxThumbOffset;

            el.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
        };

        const handlePointerUp = () => {
            dragRef.current = null;
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, []);

    const handleTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el || !scrollbarState.visible) return;

        const trackRect = event.currentTarget.getBoundingClientRect();
        const clickOffset = event.clientY - trackRect.top;
        const maxThumbOffset = Math.max(0, el.clientHeight - scrollbarState.thumbHeight);
        const nextThumbOffset = Math.max(
            0,
            Math.min(maxThumbOffset, clickOffset - scrollbarState.thumbHeight / 2)
        );
        const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
        const nextScrollTop =
            maxThumbOffset <= 0 ? 0 : (nextThumbOffset / maxThumbOffset) * maxScrollTop;

        el.scrollTop = nextScrollTop;
    };

    const nudgeScroll = (direction: -1 | 1) => {
        const el = scrollRef.current;
        if (!el) return;

        const amount = Math.max(48, Math.round(el.clientHeight * SCROLLBAR_STEP_RATIO));
        el.scrollTop = Math.max(
            0,
            Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + direction * amount)
        );
    };

    const handleThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el || !scrollbarState.visible) return;

        event.preventDefault();
        event.stopPropagation();

        dragRef.current = {
            startY: event.clientY,
            startScrollTop: el.scrollTop,
            thumbHeight: scrollbarState.thumbHeight,
        };
    };

    const renderTagRow = (label: string, raw?: string) => {
        const txt = raw?.trim();
        if (!txt) return null;

        const parts = txt
            .split(";")
            .map((t) => t.trim())
            .filter(Boolean);

        if (!parts.length) return null;

        return (
            <div className="log-field">
                <span className="log-label">{label}</span>
                <div className="log-tags">
                    {parts.map((p, i) => (
                        <span key={i} className="log-tag">
                            {p}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    const content = !logs.length ? (
        <div className="logs-empty-state">
            <div className="log-empty">No logs match the current filters.</div>
        </div>
    ) : (
        <div className="log-section">
            {logs.map((row, idx) => {
                const start = new Date(row.start);
                const end = new Date(row.end);
                const durSec = Math.max(
                    1,
                    Math.floor((end.getTime() - start.getTime()) / 1000)
                );
                const active = start <= tNow && tNow < end;

                const offTask =
                    row.kind === "Student" &&
                    row.on_task !== undefined &&
                    row.on_task !== "" &&
                    !isNaN(Number(row.on_task)) &&
                    Number(row.on_task) === 0;

                const startLabel =
                    row.start_label?.trim() || start.toTimeString().slice(0, 8);

                return (
                    <div
                        key={idx}
                        ref={(el) => {
                            if (el) rowRefs.current[row.start] = el;
                        }}
                        className={clsx("log-row", active && "log-row-active")}
                        onClick={() => onJumpTo(row.start)}
                    >
                        <div className="log-row-top">
                            <div className="log-row-ids">
                                <span
                                    className={clsx(
                                        "log-kind",
                                        row.kind === "Teacher" && "teacher",
                                        row.kind === "Student" && "student",
                                        row.kind === "Emoji" && "emoji"
                                    )}
                                >
                                    {row.kind}
                                </span>

                            </div>

                            <div className="log-row-meta">
                                <span className="log-meta-time">{startLabel}</span>
                                <span className="log-meta-dot">·</span>
                                <span className="log-meta-duration">{fmtMS(durSec)}</span>
                            </div>
                        </div>

                        {row.student_id && (
                            <div className="log-row-students">
                                <span className="log-student-pill">
                                    {formatStudentPillLabel(row.student_id)}
                                </span>
                            </div>
                        )}

                        {renderTagRow("Behavior", row.behavior_tags)}
                        {row.kind === "Teacher" && renderTagRow("Function", row.function_tags)}
                        {row.kind === "Teacher" && renderTagRow("Structure", row.structure_tags)}
                        {row.kind === "Teacher" && renderTagRow("Custom", row.custom_tags)}

                        {row.kind === "Emoji" && row.emoji_key && (
                            <div className="log-inline">
                                <span className="log-inline-label">Reaction</span>
                                <span className="log-emoji-inline">
                                    <img
                                        className="log-emoji-icon"
                                        src={emojiIconHref(row.emoji_key)}
                                        alt=""
                                    />
                                    <span className="log-inline-value">{row.emoji_key}</span>
                                </span>
                            </div>
                        )}

                        {row.location && (
                            <div className="log-inline">
                                <span className="log-inline-label">Location</span>
                                <span className="log-inline-value">{row.location}</span>
                            </div>
                        )}

                        {row.kind === "Student" && row.affect && (
                            <div className="log-inline">
                                <span className="log-inline-label">Affect</span>
                                <span className="log-inline-value">{row.affect}</span>
                            </div>
                        )}

                        {row.kind === "Student" && offTask && (
                            <div className="log-inline">
                                <span className="log-inline-label">On task</span>
                                <span className="log-inline-value log-off-task">Off task</span>
                            </div>
                        )}

                        {row.note && <div className="log-note">{row.note}</div>}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="logs-scroll-shell">
            <div ref={scrollRef} className="logs-scroll">
                {content}
            </div>

            <div
                className={clsx(
                    "logs-scrollbar",
                    !scrollbarState.visible && "logs-scrollbar-hidden"
                )}
            >
                <button
                    type="button"
                    className="logs-scrollbar-btn"
                    aria-label="Scroll logs up"
                    onClick={() => nudgeScroll(-1)}
                >
                    <span className="logs-scrollbar-arrow logs-scrollbar-arrow-up" />
                </button>

                <div className="logs-scrollbar-track" onPointerDown={handleTrackPointerDown}>
                <div
                    className="logs-scrollbar-thumb"
                    style={{
                        height: `${scrollbarState.thumbHeight}px`,
                        transform: `translateY(${scrollbarState.thumbOffset}px)`,
                    }}
                    onPointerDown={handleThumbPointerDown}
                />
                </div>

                <button
                    type="button"
                    className="logs-scrollbar-btn"
                    aria-label="Scroll logs down"
                    onClick={() => nudgeScroll(1)}
                >
                    <span className="logs-scrollbar-arrow logs-scrollbar-arrow-down" />
                </button>
            </div>
        </div>
    );
}
