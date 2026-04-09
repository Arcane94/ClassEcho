// Cumulative heatmap of help and request activity with anchored drill-down popups.
import {
    useMemo,
    useState,
    useEffect,
    useRef,
    useCallback,
    useLayoutEffect,
    type MouseEvent as ReactMouseEvent
} from "react";
import type { GroupPayload } from "../types";

type Props = {
    groups: Record<string, GroupPayload>;
    period: string | null;
};

type Row = {
    id: string;
    label: string;
    helpSecs: number;      // teacher helping this student
    requestSecs: number;   // student help requests
    totalSecs: number;     // helpSecs + requestSecs
    kind: "student" | "teacherDesk";
};

type AnchorRect = {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};

type Selected = {
    row: Row;
    anchorRect: AnchorRect;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

function heatYellow(secs: number, maxSecs: number) {
    if (!maxSecs || maxSecs <= 0) return "hsl(48 90% 88%)";
    const t = Math.sqrt(Math.max(0, Math.min(1, secs / maxSecs)));
    const Lmin = 52;
    const Lmax = 90;
    const S = 90;
    const L = Lmax - t * (Lmax - Lmin);
    return `hsl(48 ${S}% ${L}%)`;
}

function formatSecs(total: number) {
    const s = Math.max(0, Math.floor(total));
    return `${s}s`;
}

function accumIntervals(intervals: [string, string][]): number {
    let total = 0;
    for (const [s, e] of intervals) {
        const sdt = new Date(s);
        const edt = new Date(e);
        if (isNaN(sdt.getTime()) || isNaN(edt.getTime())) continue;
        const dur = (edt.getTime() - sdt.getTime()) / 1000;
        if (dur > 0) total += dur;
    }
    return total;
}

export function CumulativeHeatmap({ groups, period }: Props) {
    const rows: Row[] = useMemo(() => {
        if (!groups || !period) return [];

        const helpTotals = new Map<string, number>();    // teacher help
        const requestTotals = new Map<string, number>(); // student requests
        let teacherDeskSecs = 0;

        for (const g of Object.values(groups)) {
            if (g.period !== period) continue;

            // teacher at desk (non-help)
            if (g.teacher_logs && g.teacher_logs.length) {
                for (const log of g.teacher_logs) {
                    const loc = (log.location || "").toLowerCase();
                    const isDesk =
                        loc.includes("at front") || loc.includes("on lms");
                    if (!isDesk) continue;

                    teacherDeskSecs += accumIntervals([[log.start, log.end]]);
                }
            }

            // teacher help intervals (per-student)
            if (g.help_intervals) {
                for (const [sid, intervals] of Object.entries(
                    g.help_intervals
                )) {
                    if (!sid) continue;
                    const prev = helpTotals.get(sid) ?? 0;
                    helpTotals.set(sid, prev + accumIntervals(intervals));
                }
            }

            // student help requests (per-student)
            if (g.request_intervals) {
                for (const [sid, intervals] of Object.entries(
                    g.request_intervals
                )) {
                    if (!sid) continue;
                    const prev = requestTotals.get(sid) ?? 0;
                    requestTotals.set(sid, prev + accumIntervals(intervals));
                }
            }
        }

        // Build teacher desk row
        const teacherRow: Row | null =
            teacherDeskSecs > 0
                ? {
                    id: "teacher-desk",
                    label: "Teacher (Non-help)",
                    helpSecs: Math.floor(teacherDeskSecs),
                    requestSecs: 0,
                    totalSecs: Math.floor(teacherDeskSecs),
                    kind: "teacherDesk",
                }
                : null;

        // Build student rows with stacked bars
        const allStudentIds = new Set<string>([
            ...helpTotals.keys(),
            ...requestTotals.keys(),
        ]);

        const studentRows: Row[] = [];
        for (const sid of allStudentIds) {
            const h = Math.floor(helpTotals.get(sid) ?? 0);
            const r = Math.floor(requestTotals.get(sid) ?? 0);
            const total = h + r;
            if (total <= 0) continue;

            studentRows.push({
                id: sid,
                label: `Student ${sid}`,
                helpSecs: h,
                requestSecs: r,
                totalSecs: total,
                kind: "student",
            });
        }

        studentRows.sort((a, b) => b.totalSecs - a.totalSecs);

        const allRows: Row[] = [
            ...(teacherRow ? [teacherRow] : []),
            ...studentRows,
        ];

        const maxSecs = allRows.length
            ? Math.max(...allRows.map((r) => r.totalSecs))
            : 0;

        return allRows.map((r) => ({
            ...r,
            totalSecs: maxSecs > 0 ? r.totalSecs : 0,
        }));
    }, [groups, period]);

    const [selected, setSelected] = useState<Selected | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    const heatPanelRef = useRef<HTMLDivElement | null>(null);
    const listWrapperRef = useRef<HTMLDivElement | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);

    const computePopupPosition = useCallback(
        (anchorRect: AnchorRect, popupWidth: number, popupHeight: number) => {
            const panelRect = heatPanelRef.current?.getBoundingClientRect();
            const hostLeft = panelRect?.left ?? 0;
            const hostTop = panelRect?.top ?? 0;
            const hostWidth = panelRect?.width ?? window.innerWidth;
            const hostHeight = panelRect?.height ?? window.innerHeight;
            const safePad = 8;
            const gap = 10;

            const localLeft = anchorRect.left - hostLeft;
            const localTop = anchorRect.top - hostTop;
            const localBottom = anchorRect.bottom - hostTop;

            // Keep the popup visually tied to the row label area, not the far-right bar end.
            let left = localLeft + 12;
            left = clamp(
                left,
                safePad,
                Math.max(safePad, hostWidth - popupWidth - safePad),
            );

            // Prefer opening directly above the clicked row, fallback below.
            let top = localTop - popupHeight - gap;
            if (top < safePad) {
                top = localBottom + gap;
            }
            top = clamp(
                top,
                safePad,
                Math.max(safePad, hostHeight - popupHeight - safePad),
            );

            return { left, top };
        },
        [],
    );

    const positionPopup = useCallback(() => {
        if (!selected || !popupRef.current) return;

        const popupRect = popupRef.current.getBoundingClientRect();
        const nextPos = computePopupPosition(
            selected.anchorRect,
            popupRect.width,
            popupRect.height,
        );
        setPopupPosition(nextPos);
    }, [selected, computePopupPosition]);

    useLayoutEffect(() => {
        positionPopup();
    }, [positionPopup]);

    useEffect(() => {
        if (!selected) return;

        const onViewportChange = () => positionPopup();
        window.addEventListener("resize", onViewportChange);

        return () => {
            window.removeEventListener("resize", onViewportChange);
        };
    }, [selected, positionPopup]);

    useEffect(() => {
        if (selected) return;
        setPopupPosition(null);
    }, [selected]);

    // Click-anywhere-else-to-close
    useEffect(() => {
        if (!selected) return;

        function handleClickOutside(e: MouseEvent) {
            const popup = popupRef.current;
            if (!popup) return;

            if (!popup.contains(e.target as Node)) {
                setSelected(null);
            }
        }

        window.addEventListener("mousedown", handleClickOutside);
        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [selected]);

    useEffect(() => {
        if (!selected) return;

        const listWrapper = listWrapperRef.current;
        if (!listWrapper) return;

        const onListScroll = () => setSelected(null);
        listWrapper.addEventListener("scroll", onListScroll, { passive: true });

        return () => {
            listWrapper.removeEventListener("scroll", onListScroll);
        };
    }, [selected]);

    if (!rows.length) {
        return (
            <div className="heat-panel" ref={heatPanelRef}>
                <div className="heat-header">
                    <div className="heat-header-main">
                        <div className="heat-title">Cumulative Help & Requests</div>
                        <div className="heat-subtitle">
                            Select a period with help / requests to see summary.
                        </div>
                    </div>
                </div>
                <div className="heat-empty">No cumulative data available.</div>
            </div>
        );
    }

    const maxTotal = Math.max(...rows.map((r) => r.totalSecs || 0)) || 1;

    const handleRowClick = (
        e: ReactMouseEvent<HTMLDivElement>,
        row: Row
    ) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const anchorRect: AnchorRect = {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
        };

        // Set an immediate anchored position so the first paint is already near the clicked row.
        setPopupPosition(computePopupPosition(anchorRect, 300, 210));
        setSelected({
            row,
            anchorRect,
        });
    };

    return (
        <>
            <div className="heat-panel" ref={heatPanelRef}>
                <div className="heat-header">
                    <div className="heat-header-main">
                        <div className="heat-title">CUMULATIVE HELP & REQUESTS</div>
                        <div className="heat-subtitle">Period – All dates</div>
                    </div>
                    <div className="heat-legend">
                        <span className="legend-item">
                            <span className="legend-swatch legend-teacherhelp">
                                &nbsp;
                            </span>
                            Teacher help
                        </span>
                        <span className="legend-item">
                            <span className="legend-swatch legend-studentreq">
                                &nbsp;
                            </span>
                            Student help requests
                        </span>
                        <span className="legend-item">
                            <span className="legend-swatch legend-teacherdesk">
                                &nbsp;
                            </span>
                            Teacher (Non-help)
                        </span>
                    </div>
                </div>

                {/* Scrollable list that fills vertical space */}
                <div className="heat-list-wrapper" ref={listWrapperRef}>
                    <div className="heat-list">
                        {rows.map((row) => {
                            const totalWidth = (row.totalSecs / maxTotal) * 100;
                            const isSelected = selected?.row.id === row.id;

                            const rowClasses = ["heat-row"];
                            // both teacher row and student rows are clickable
                            rowClasses.push("heat-row-clickable");
                            if (isSelected) rowClasses.push("heat-row-selected");

                            // teacher row: single yellow bar
                            if (row.kind === "teacherDesk") {
                                return (
                                    <div
                                        key={row.id}
                                        className={rowClasses.join(" ")}
                                        onClick={(e) => handleRowClick(e, row)}
                                    >
                                        <div className="heat-id">{row.label}</div>
                                        <div className="heat-bar-wrap">
                                            <div
                                                className="heat-bar teacher-desk-bar"
                                                style={{
                                                    width: totalWidth ? `${totalWidth}%` : "0%",
                                                    background: heatYellow(row.totalSecs, maxTotal),
                                                }}
                                            />
                                        </div>
                                        <div className="heat-secs">
                                            {formatSecs(row.totalSecs)}
                                        </div>
                                    </div>
                                );
                            }

                            // Student row: stacked bar (green = teacher help, blue = requests)
                            const total = row.totalSecs || 1;
                            const helpFrac = row.helpSecs / total;
                            const reqFrac = row.requestSecs / total;

                            const helpWidth = totalWidth * helpFrac;
                            const reqWidth = totalWidth * reqFrac;

                            return (
                                <div
                                    key={row.id}
                                    className={rowClasses.join(" ")}
                                    onClick={(e) => handleRowClick(e, row)}
                                >
                                    <div className="heat-id">{row.label}</div>
                                    <div className="heat-bar-wrap">
                                        <div
                                            style={{
                                                width: helpWidth ? `${helpWidth}%` : "0%",
                                                height: "100%",
                                                background: "#22c55e", // green
                                                borderRadius:
                                                    reqWidth > 0 ? "999px 0 0 999px" : "999px",
                                            }}
                                        />
                                        {reqWidth > 0 && (
                                            <div
                                                style={{
                                                    width: reqWidth ? `${reqWidth}%` : "0%",
                                                    height: "100%",
                                                    background: "#0ea5e9", // blue
                                                    borderRadius:
                                                        helpWidth > 0 ? "0 999px 999px 0" : "999px",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="heat-secs">
                                        {formatSecs(row.totalSecs)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {selected && (
                <div
                    ref={popupRef}
                    className="heat-detail-card"
                    style={
                        popupPosition
                            ? { left: popupPosition.left, top: popupPosition.top }
                            : { left: 8, top: 8, visibility: "hidden" }
                    }
                >
                    <button
                        type="button"
                        className="heat-detail-close"
                        onClick={() => setSelected(null)}
                        aria-label="Close details"
                    >
                        ×
                    </button>
                    <div className="heat-detail-title">
                        {selected.row.label}
                    </div>
                    <div className="heat-detail-body">
                        {selected.row.kind === "teacherDesk" ? (
                            <>
                                <div className="heat-detail-row">
            <span className="heat-detail-label">
              Non-help time
            </span>
                                    <span className="heat-detail-value">
              {formatSecs(selected.row.totalSecs)}
            </span>
                                </div>
                                <div className="heat-detail-note">
                                    Time the teacher spent on non-help activities like
                                    announcements or admin tasks.
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="heat-detail-row">
                                    <span className="heat-detail-label">Teacher help</span>
                                    <span className="heat-detail-value">
              {formatSecs(selected.row.helpSecs)}
            </span>
                                </div>
                                <div className="heat-detail-row">
            <span className="heat-detail-label">
              Help requests
            </span>
                                    <span className="heat-detail-value">
              {formatSecs(selected.row.requestSecs)}
            </span>
                                </div>
                                <div className="heat-detail-row">
                                    <span className="heat-detail-label">Total</span>
                                    <span className="heat-detail-value">
              {formatSecs(selected.row.totalSecs)}
            </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                )}
            </div>
        </>
    );
}
