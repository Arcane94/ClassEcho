// SVG renderer for the visualization seating chart and seated student overlays.
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { EmojiReactionInterval, GroupPayload } from "../types";
import {
    clsx,
    cumulativeHelpUpTo,
    HAND_SRC,
    heatGreen,
    TEACHER_SRC,
    VISUALIZATION_ICON_BASE,
} from "../utils";

type SeatingSVGProps = {
    group: GroupPayload;
    tNow: Date;
    onSelectStudent: (sid: string) => void;
    selectedStudentId?: string | null;
    emojiReactionsByStudent?: Record<string, EmojiReactionInterval[]>;
};

function heatYellow(secs: number, maxSecs: number) {
    if (!maxSecs || maxSecs <= 0) return "hsl(48 90% 88%)";
    const t = Math.sqrt(Math.max(0, Math.min(1, secs / maxSecs)));

    const Lmin = 52;
    const Lmax = 90;
    const S = 90;

    const L = Lmax - t * (Lmax - Lmin);
    return `hsl(48 ${S}% ${L}%)`;
}

function heatBlue(secs: number, maxSecs: number) {
    if (!maxSecs || maxSecs <= 0) return "hsl(199 85% 92%)";
    const t = Math.sqrt(Math.max(0, Math.min(1, secs / maxSecs)));

    const Lmin = 40;
    const Lmax = 92;
    const S = 82;

    const L = Lmax - t * (Lmax - Lmin);
    return `hsl(199 ${S}% ${L}%)`;
}

// Decide whether a teacher log interval counts as "teacher at desk/front"
function isTeacherDeskLikeLocation(loc?: string) {
    const s = (loc || "").toLowerCase();
    return s.includes("desk") || s.includes("front") || s.includes("lms") || s.includes("teacher");
}

function emojiIconHref(emojiKey: string) {
    return `${VISUALIZATION_ICON_BASE}/${encodeURIComponent(emojiKey)}.png`;
}

export function SeatingSVG({
                               group,
                               tNow,
                               onSelectStudent,
                               selectedStudentId,
                               emojiReactionsByStudent,
                           }: SeatingSVGProps) {
    const layout = useMemo(() => {
        type Seat = GroupPayload["seats"][number];

        type Pod = {
            id: string;
            seats: Seat[];
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
            anchorX: number;
            anchorY: number;
            px: number;
            py: number;
            block: number;
            isTeacher?: boolean;
        };

        const allSeats = group.seats;
        const pad = 24;
        const seatSize = 64;
        const seatGap = 10;
        const podGap = 36;

        if (!allSeats.length) {
            return {
                pad,
                width: 600,
                height: 600,
                seatSize,
                seatGap,
                podGap,
                cellW: 200,
                cellH: 200,
                seatCentersByStudentId: {} as Record<
                    string,
                    { cx: number; cy: number; side: "left" | "right"; col: number }
                >,
                seatCentersByCoord: {} as Record<
                    string,
                    { cx: number; cy: number; side: "left" | "right"; col: number }
                >,
                teacherDeskRect: null as null | {
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    cx: number;
                    cy: number;
                    col: number;
                },
                gridLinesX: [] as number[],
                gridLinesY: [] as number[],
                widthInner: 600,
                heightInner: 600,
                toCX: (_x: number) => pad,
                toCY: (_y: number) => pad,
            };
        }

        const teacherSeat = allSeats.find((s) => (s.seat_id || "").toLowerCase() === "teacher") || null;
        const studentSeats = allSeats.filter((s) => (s.seat_id || "").toLowerCase() !== "teacher");

        // ---- 1) cluster student seats into pods (connected components) ----
        const keyOf = (s: Seat) => `${s.x},${s.y}`;
        const seatByKey = new Map<string, Seat>();
        for (const s of studentSeats) seatByKey.set(keyOf(s), s);

        const visited = new Set<string>();
        const pods: Pod[] = [];

        const neighborDeltas = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
        ] as const;

        for (const s0 of studentSeats) {
            const k0 = keyOf(s0);
            if (visited.has(k0)) continue;
            visited.add(k0);

            const q: Seat[] = [s0];
            const comp: Seat[] = [];

            while (q.length) {
                const cur = q.pop()!;
                comp.push(cur);

                for (const [dx, dy] of neighborDeltas) {
                    const nk = `${cur.x + dx},${cur.y + dy}`;
                    const ns = seatByKey.get(nk);
                    if (!ns) continue;
                    if (visited.has(nk)) continue;
                    visited.add(nk);
                    q.push(ns);
                }
            }

            const xs = comp.map((s) => s.x);
            const ys = comp.map((s) => s.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            pods.push({
                id: `pod-${pods.length}`,
                seats: comp,
                minX,
                maxX,
                minY,
                maxY,
                anchorX: minX,
                anchorY: minY,
                px: 0,
                py: 0,
                block: 0,
            });
        }

        const teacherPod: Pod | null = teacherSeat
            ? {
                id: "teacher",
                seats: [teacherSeat],
                minX: teacherSeat.x,
                maxX: teacherSeat.x,
                minY: teacherSeat.y,
                maxY: teacherSeat.y,
                anchorX: teacherSeat.x,
                anchorY: teacherSeat.y,
                px: 0,
                py: 0,
                block: 0,
                isTeacher: true,
            }
            : null;

        const podsAll = teacherPod ? [...pods, teacherPod] : pods;

        // ---- 2) Build X-blocks (left/right blocks) from raw anchor gaps ----
        const nearThreshold = 3;

        const anchorXs = Array.from(new Set(podsAll.map((p) => p.anchorX))).sort((a, b) => a - b);
        const anchorYs = Array.from(new Set(podsAll.map((p) => p.anchorY))).sort((a, b) => a - b);

        const xBlock = new Map<number, number>();
        {
            let b = 0;
            for (let i = 0; i < anchorXs.length; i++) {
                if (i > 0) {
                    const d = anchorXs[i] - anchorXs[i - 1];
                    if (d > nearThreshold) b += 1;
                }
                xBlock.set(anchorXs[i], b);
            }
        }

        // ---- 3) Compress anchors to packed columns/rows ----
        const compress = (vals: number[], axis: "x" | "y") => {
            const m = new Map<number, number>();
            let pos = 0;
            for (let i = 0; i < vals.length; i++) {
                const v = vals[i];
                if (i === 0) {
                    m.set(v, 0);
                    continue;
                }
                const prev = vals[i - 1];
                const d = v - prev;

                if (d <= nearThreshold) pos += 1;
                else pos += axis === "x" ? 1 : 2;

                m.set(v, pos);
            }
            return m;
        };

        const xPacked = compress(anchorXs, "x");
        const yPacked = compress(anchorYs, "y");

        for (const p of podsAll) {
            p.px = xPacked.get(p.anchorX) ?? 0;
            p.py = yPacked.get(p.anchorY) ?? 0;
            p.block = xBlock.get(p.anchorX) ?? 0;
        }

        // ---- 4) Determine cell size ----
        const podPixelSize = (p: Pod) => {
            if (p.isTeacher) {
                return { w: seatSize * 2 + seatGap, h: seatSize };
            }
            const spanX = Math.max(1, p.maxX - p.minX + 1);
            const spanY = Math.max(1, p.maxY - p.minY + 1);
            return {
                w: spanX * seatSize + (spanX - 1) * seatGap,
                h: spanY * seatSize + (spanY - 1) * seatGap,
            };
        };

        const maxPodW = Math.max(...podsAll.map((p) => podPixelSize(p).w));
        const maxPodH = Math.max(...podsAll.map((p) => podPixelSize(p).h));

        const cellW = maxPodW + podGap;
        const cellH = maxPodH + podGap;

        const maxPX = Math.max(0, ...podsAll.map((p) => p.px));
        const maxPY = Math.max(0, ...podsAll.map((p) => p.py));

        const widthInner = (maxPX + 1) * cellW - podGap;
        const heightInner = (maxPY + 1) * cellH - podGap;

        const width = pad * 2 + widthInner;
        const height = pad * 2 + heightInner;

        // ---- 5) Compute seat centers (pods horizontally centered in each cell) ----
        const seatCentersByStudentId: Record<
            string,
            { cx: number; cy: number; side: "left" | "right"; col: number }
        > = {};
        const seatCentersByCoord: Record<
            string,
            { cx: number; cy: number; side: "left" | "right"; col: number }
        > = {};

        let teacherDeskRect: null | {
            x: number;
            y: number;
            w: number;
            h: number;
            cx: number;
            cy: number;
            col: number;
        } = null;

        for (const p of podsAll) {
            const cellStartX = pad + p.px * cellW;
            const cellStartY = pad + p.py * cellH;

            const { w: podWpx } = podPixelSize(p);

            // Center within full cell
            const alignDx = Math.max(0, (cellW - podWpx) / 2);

            const baseX = cellStartX + alignDx;
            const baseY = cellStartY;

            if (p.isTeacher) {
                const deskW = seatSize * 2 + seatGap;
                const deskH = seatSize;

                const deskX = cellStartX + Math.max(0, (cellW - deskW) / 2);
                const deskY = cellStartY + Math.max(0, (cellH - deskH) / 2);

                teacherDeskRect = {
                    x: deskX,
                    y: deskY,
                    w: deskW,
                    h: deskH,
                    cx: deskX + deskW / 2,
                    cy: deskY + deskH / 2,
                    col: p.px,
                };
                continue;
            }

            const midX = pad + widthInner / 2;

            for (const s of p.seats) {
                const lx = s.x - p.minX;
                const ly = s.y - p.minY;

                const cx = baseX + lx * (seatSize + seatGap) + seatSize / 2;
                const cy = baseY + ly * (seatSize + seatGap) + seatSize / 2;

                const side: "left" | "right" = cx < midX ? "left" : "right";

                seatCentersByCoord[`${s.x},${s.y}`] = { cx, cy, side, col: p.px };
                if (s.studentid) seatCentersByStudentId[s.studentid] = { cx, cy, side, col: p.px };
            }
        }

        const gridLinesX: number[] = [];
        const gridLinesY: number[] = [];
        for (let i = 0; i <= maxPX + 1; i++) gridLinesX.push(pad + i * cellW);
        for (let i = 0; i <= maxPY + 1; i++) gridLinesY.push(pad + i * cellH);

        const xsRaw = allSeats.map((s) => s.x);
        const ysRaw = allSeats.map((s) => s.y);
        const minX = Math.min(...xsRaw);
        const minY = Math.min(...ysRaw);

        return {
            pad,
            width,
            height,
            seatSize,
            seatGap,
            podGap,
            cellW,
            cellH,
            widthInner,
            heightInner,
            seatCentersByStudentId,
            seatCentersByCoord,
            teacherDeskRect,
            gridLinesX,
            gridLinesY,
            toCX: (x: number) => pad + (x - minX + 1) * (seatSize + seatGap),
            toCY: (y: number) => pad + (y - minY + 1) * (seatSize + seatGap),
        };
    }, [group.seats]);

    const teacherSeat = useMemo(
        () => group.seats.find((s) => s.seat_id && s.seat_id.toLowerCase() === "teacher") || null,
        [group.seats]
    );

    const studentSeats = useMemo(
        () => group.seats.filter((s) => !s.seat_id || s.seat_id.toLowerCase() !== "teacher"),
        [group.seats]
    );

    const {
        activeSid,
        teacherAtFront,
        cumHelpBySid,
        cumRequestBySid,
        sidPos,
        maxHelp,
        maxRequest,
        activeRequestSids,
        activeEmojisBySid,
        teacherDeskSecs,
        teacherDeskMaxSecs,
    } = useMemo(() => {
        let active: string | null = null;

        if (group.has_help && group.help_intervals) {
            outer: for (const [sid, arr] of Object.entries(group.help_intervals)) {
                for (const [s, e] of arr) {
                    const sdt = new Date(s);
                    const edt = new Date(e);
                    if (sdt <= tNow && tNow < edt) {
                        active = sid;
                        break outer;
                    }
                }
            }
        }

        let teacherAtFrontNow = false;
        const deskIntervals: [string, string][] = [];

        if (group.teacher_logs?.length) {
            for (const log of group.teacher_logs) {
                if (!isTeacherDeskLikeLocation(log.location)) continue;
                if (!log.start || !log.end) continue;

                deskIntervals.push([log.start, log.end]);

                const sdt = new Date(log.start);
                const edt = new Date(log.end);
                if (sdt <= tNow && tNow < edt) teacherAtFrontNow = true;
            }
        }

        const teacherDeskSecs = cumulativeHelpUpTo(deskIntervals, tNow);

        let teacherDeskMaxSecs = 0;
        for (const [s, e] of deskIntervals) {
            const sdt = new Date(s);
            const edt = new Date(e);
            const dur = (edt.getTime() - sdt.getTime()) / 1000;
            if (dur > 0) teacherDeskMaxSecs += dur;
        }

        const cumHelp = new Map<string, number>();
        const cumReq = new Map<string, number>();
        const pos: Record<string, { cx: number; cy: number; side: "left" | "right"; col: number }> =
            {};
        const activeReq = new Set<string>();
        const activeEmojis = new Map<string, EmojiReactionInterval[]>();

        for (const s of group.seats) {
            const sid = s.studentid || "";
            const helpArr = group.help_intervals?.[sid] || [];
            const reqArr = group.request_intervals?.[sid] || [];

            const helpSecs = group.has_help ? cumulativeHelpUpTo(helpArr, tNow) : 0;
            cumHelp.set(sid, Math.floor(helpSecs));

            const reqSecs = cumulativeHelpUpTo(reqArr, tNow);
            cumReq.set(sid, Math.floor(reqSecs));

            for (const [rs, re] of reqArr) {
                const sdt = new Date(rs);
                const edt = new Date(re);
                if (sdt <= tNow && tNow < edt) {
                    activeReq.add(sid);
                    break;
                }
            }

            if (sid) {
                const emojiArr = emojiReactionsByStudent?.[sid] || [];
                const activeEmojiIntervals = emojiArr
                    .filter((reaction) => {
                        const sdt = new Date(reaction.start);
                        const edt = new Date(reaction.end);
                        return sdt <= tNow && tNow < edt;
                    })
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                if (activeEmojiIntervals.length > 0) {
                    activeEmojis.set(sid, activeEmojiIntervals);
                }
            }

            if (sid) {
                const p = layout.seatCentersByStudentId?.[sid];
                if (p) pos[sid] = { cx: p.cx, cy: p.cy, side: p.side, col: p.col };
            }
        }

        const maxHelpVal = Math.max(0, ...Array.from(cumHelp.values()));
        const maxReqVal = Math.max(0, ...Array.from(cumReq.values()));

        return {
            activeSid: active,
            teacherAtFront: teacherAtFrontNow,
            cumHelpBySid: cumHelp,
            cumRequestBySid: cumReq,
            sidPos: pos,
            maxHelp: maxHelpVal,
            maxRequest: maxReqVal,
            activeRequestSids: activeReq,
            activeEmojisBySid: activeEmojis,
            teacherDeskSecs,
            teacherDeskMaxSecs,
        };
    }, [emojiReactionsByStudent, group, layout, tNow]);

    const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");

    // Zoom & pan state
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 }); // SVG group transform: screen = scale * point + offset
    const [isPanning, setIsPanning] = useState(false);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);
    const cameraRef = useRef({ scale: 1, offset: { x: 0, y: 0 } });

    const clampScale = (s: number) => Math.min(3, Math.max(0.5, s));

    useEffect(() => {
        cameraRef.current = { scale, offset };
    }, [offset, scale]);

    const clientToSvgPoint = (clientX: number, clientY: number) => {
        const svgEl = svgRef.current;
        if (!svgEl) return null;

        const ctm = svgEl.getScreenCTM();
        if (!ctm) return null;

        const point = svgEl.createSVGPoint();
        point.x = clientX;
        point.y = clientY;

        const mapped = point.matrixTransform(ctm.inverse());
        return {
            x: Math.max(0, Math.min(layout.width, mapped.x)),
            y: Math.max(0, Math.min(layout.height, mapped.y)),
        };
    };

    const applyZoomAtPoint = (factor: number, point?: { x: number; y: number } | null) => {
        const { scale: currentScale, offset: currentOffset } = cameraRef.current;
        const svgX = point?.x ?? layout.width / 2;
        const svgY = point?.y ?? layout.height / 2;
        const newScale = clampScale(currentScale * factor);

        // Keep the hovered SVG point fixed under the mouse.
        // With transform="translate(offset) scale(scale)" on the <g>, SVG applies
        // the scale first and then the translate, so: screen = scale * point + offset.
        const newOffset = {
            x: svgX - (newScale / currentScale) * (svgX - currentOffset.x),
            y: svgY - (newScale / currentScale) * (svgY - currentOffset.y),
        };

        cameraRef.current = { scale: newScale, offset: newOffset };
        setScale(newScale);
        setOffset(newOffset);
    };

    const handleWheel = (e: any) => {
        if (!svgRef.current) return;
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        applyZoomAtPoint(factor, clientToSvgPoint(e.clientX, e.clientY));
    };

    const handleMouseDown = (e: any) => {
        if (!svgRef.current) return;
        e.preventDefault();
        setIsPanning(true);
        lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: any) => {
        if (!isPanning) return;

        const svgEl = svgRef.current;
        const last = lastPosRef.current;
        if (!svgEl || !last) return;

        e.preventDefault();

        const rect = svgEl.getBoundingClientRect();
        const pxToSvgX = layout.width / rect.width;
        const pxToSvgY = layout.height / rect.height;

        const dxPx = e.clientX - last.x;
        const dyPx = e.clientY - last.y;

        // Offset lives in post-scale SVG space, so pan deltas should be applied
        // directly in SVG units without dividing by the current zoom.
        const dxSvg = dxPx * pxToSvgX;
        const dySvg = dyPx * pxToSvgY;

        lastPosRef.current = { x: e.clientX, y: e.clientY };
        setOffset((prev) => {
            const next = { x: prev.x + dxSvg, y: prev.y + dySvg };
            cameraRef.current = { scale: cameraRef.current.scale, offset: next };
            return next;
        });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        lastPosRef.current = null;
    };

    // The +/- buttons sit on top of the chart, so using the button position as the zoom
    // anchor makes the content collapse toward that corner. Keep button zoom centered.
    const zoomIn = () => applyZoomAtPoint(1.2, { x: layout.width / 2, y: layout.height / 2 });
    const zoomOut = () => applyZoomAtPoint(1 / 1.2, { x: layout.width / 2, y: layout.height / 2 });

    // ---------- NEW: default "fit to content" so it starts zoomed-in ----------
    const computeFitTransform = () => {
        // Bounds based on actual seat rectangles + teacher desk (not the grid cells)
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        const half = layout.seatSize / 2;

        for (const s of studentSeats) {
            const c = layout.seatCentersByCoord?.[`${s.x},${s.y}`];
            const cx = c ? c.cx : layout.toCX(s.x);
            const cy = c ? c.cy : layout.toCY(s.y);

            minX = Math.min(minX, cx - half);
            maxX = Math.max(maxX, cx + half);
            minY = Math.min(minY, cy - half);
            maxY = Math.max(maxY, cy + half);
        }

        if (layout.teacherDeskRect) {
            const r = layout.teacherDeskRect;
            minX = Math.min(minX, r.x);
            maxX = Math.max(maxX, r.x + r.w);
            minY = Math.min(minY, r.y);
            maxY = Math.max(maxY, r.y + r.h);
        }

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return { s: 1, t: { x: 0, y: 0 } };
        }

        const margin = 14; // leave room for border-seated badges
        minX -= margin;
        minY -= margin;
        maxX += margin;
        maxY += margin;

        const contentW = Math.max(1, maxX - minX);
        const contentH = Math.max(1, maxY - minY);

        const sFit = clampScale(Math.min(layout.width / contentW, layout.height / contentH));

        // We want the content center to map to the SVG center:
        // screen = s * p + t  =>  t = viewCenter - s * contentCenter
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        const tX = layout.width / 2 - sFit * cx;
        const tY = layout.height / 2 - sFit * cy;

        return { s: sFit, t: { x: tX, y: tY } };
    };

    const resetView = () => {
        const { s, t } = computeFitTransform();
        cameraRef.current = { scale: s, offset: t };
        setScale(s);
        setOffset(t);
    };

    // Apply the “fit to content” transform once on load / when layout meaningfully changes
    const didInitRef = useRef(false);
    useEffect(() => {
        // if seats/layout change, re-fit once
        didInitRef.current = false;
    }, [group.seats]);

    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;
        resetView();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout.width, layout.height]);
    // ---------------------------------------------------------------

    // Grid lines
    const grid: ReactElement[] = [];
    for (let i = 0; i < layout.gridLinesX.length; i++) {
        const X = layout.gridLinesX[i];
        grid.push(
            <line
                key={`vx-${i}`}
                x1={X}
                x2={X}
                y1={layout.pad}
                y2={layout.height - layout.pad}
                stroke="var(--grid)"
                strokeWidth={1}
            />
        );
    }
    for (let i = 0; i < layout.gridLinesY.length; i++) {
        const Y = layout.gridLinesY[i];
        grid.push(
            <line
                key={`hz-${i}`}
                x1={layout.pad}
                x2={layout.width - layout.pad}
                y1={Y}
                y2={Y}
                stroke="var(--grid)"
                strokeWidth={1}
            />
        );
    }

    // Student seats
    const seats = studentSeats.map((s, i) => {
        const center = layout.seatCentersByCoord?.[`${s.x},${s.y}`];
        const cx = center ? center.cx : layout.toCX(s.x);
        const cy = center ? center.cy : layout.toCY(s.y);

        const isActive = activeSid && s.studentid && activeSid === s.studentid;

        const helpSecs = s.studentid ? cumHelpBySid.get(s.studentid) || 0 : 0;
        const reqSecs = s.studentid ? cumRequestBySid.get(s.studentid) || 0 : 0;
        const secs = viewMode === "teacher" ? helpSecs : reqSecs;

        const fill =
            viewMode === "teacher" ? heatGreen(secs, maxHelp || secs || 1) : heatBlue(secs, maxRequest || secs || 1);

        const clickable = !!s.studentid;
        const activeBadges: Array<{
            key: string;
            src: string;
            className?: string;
            chipClassName?: string;
            label: string;
        }> = [];

        if (s.studentid && activeRequestSids?.has(s.studentid)) {
            activeBadges.push({
                key: `req-${s.studentid}`,
                src: HAND_SRC,
                className: "seat-badge-icon--request",
                chipClassName: "seat-badge-chip--request",
                label: "Help request",
            });
        }

        const activeEmojis = s.studentid ? activeEmojisBySid?.get(s.studentid) || [] : [];
        const latestEmoji = activeEmojis.length ? activeEmojis[activeEmojis.length - 1] : null;
        if (latestEmoji) {
            activeBadges.push({
                key: `emoji-${s.studentid}-${latestEmoji.start}-${latestEmoji.emoji_key}`,
                src: emojiIconHref(latestEmoji.emoji_key),
                className: "seat-badge-icon--emoji",
                chipClassName: "seat-badge-chip--emoji",
                label: latestEmoji.emoji_key,
            });
        }

        return (
            <g key={i}>
                <rect
                    x={cx - layout.seatSize / 2}
                    y={cy - layout.seatSize / 2}
                    width={layout.seatSize}
                    height={layout.seatSize}
                    rx={14}
                    className={clsx(
                        "seat",
                        clickable && "seat-clickable",
                        isActive ? "active" : "normal",
                        selectedStudentId === s.studentid && "selected"
                    )}
                    onClick={() => s.studentid && onSelectStudent(s.studentid)}
                    style={{ fill }}
                />

                {s.studentid && (
                    <g transform={`translate(${cx}, ${cy})`} className="seat-fo-wrap">
                        <foreignObject
                            x={-layout.seatSize / 2}
                            y={-layout.seatSize / 2}
                            width={layout.seatSize}
                            height={layout.seatSize}
                        >
                            <div className="seat-content seat-content--student">
                                <div className="seat-stack">
                                    <div className="seat-room seat-room--id">
                                        <div className="seat-id">{s.studentid}</div>
                                    </div>
                                    <div className="seat-room seat-room--time">
                                        <div className="seat-time" title={`${secs} seconds`}>
                                            {secs}s
                                        </div>
                                    </div>
                                    <div className="seat-room seat-room--status">
                                        <div
                                            className={clsx(
                                                "seat-status-row",
                                                activeBadges.length === 0 && "seat-status-row--empty",
                                                activeBadges.length === 1 && "seat-status-row--single",
                                                activeBadges.length === 2 && "seat-status-row--split",
                                                activeBadges.length === 3 && "seat-status-row--triple",
                                                activeBadges.length >= 4 && "seat-status-row--dense"
                                            )}
                                            aria-hidden="true"
                                        >
                                            {activeBadges.map((badge) => (
                                                <span
                                                    key={badge.key}
                                                    className={clsx("seat-badge-chip", badge.chipClassName)}
                                                    title={badge.label}
                                                >
                                                    <img
                                                        className={clsx("seat-badge-icon", badge.className)}
                                                        src={badge.src}
                                                        alt=""
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </foreignObject>
                    </g>
                )}
            </g>
        );
    });

    // Teacher desk
    const teacherDesk = (() => {
        if (!teacherSeat || !layout.teacherDeskRect) return null;

        const { x, y, w, h } = layout.teacherDeskRect;

        const DESK_DEFAULT_FILL = "hsl(48 90% 88%)";

        const fill =
            viewMode === "teacher"
                ? heatYellow(teacherDeskSecs, teacherDeskMaxSecs || teacherDeskSecs || 1)
                : DESK_DEFAULT_FILL;


        const secs = Math.floor(teacherDeskSecs);

        return (
            <g key="teacher-desk">
                <rect x={x} y={y} width={w} height={h} rx={14} className="seat teacher-desk" style={{ fill }} />
                <foreignObject x={x} y={y} width={w} height={h} className="seat-fo-wrap">
                    <div className="seat-content seat-content--desk">
                        <div className="seat-desk-row">
                            <div className="seat-id seat-id--desk">Teacher&apos;s Desk</div>
                            <div className="seat-time seat-time--desk">{secs}s</div>
                        </div>
                    </div>
                </foreignObject>
            </g>
        );
    })();

    // Teacher icon: at desk if teacherAtFront, else next to active student
    const teacher = (() => {
        if (teacherAtFront && layout.teacherDeskRect) {
            const { cx, cy } = layout.teacherDeskRect;
            const size = Math.max(22, layout.seatSize * 0.55);
            const tx = cx;
            const ty = cy - layout.seatSize * 0.9;

            return (
                <image
                    href={TEACHER_SRC}
                    x={tx - size / 2}
                    y={ty - size / 2}
                    width={size}
                    height={size}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ pointerEvents: "none" }}
                />
            );
        }

        if (!activeSid) return null;
        const pos = sidPos[activeSid];
        if (!pos) return null;

        const half = layout.seatSize * 0.5;
        const gap = Math.max(10, layout.seatGap * 1.1);
        const dx = half + gap;

        const tx = pos.side === "left" ? pos.cx - dx : pos.cx + dx;
        const ty = pos.cy - layout.seatSize * 0.35;
        const size = Math.max(22, layout.seatSize * 0.55);

        return (
            <image
                href={TEACHER_SRC}
                x={tx - size / 2}
                y={ty}
                width={size}
                height={size}
                preserveAspectRatio="xMidYMid meet"
                style={{ pointerEvents: "none" }}
            />
        );
    })();

    return (
        <div className="seating-zoom-shell">
            <div className="seat-view-toggle">
                <button
                    type="button"
                    className={clsx("seat-view-btn", "hover-tip", viewMode === "teacher" && "seat-view-btn-active")}
                    data-tip="Heat map of teacher help and other activities (e.g., announcements)."
                    onClick={() => setViewMode("teacher")}
                >
                    Teacher Actions
                </button>
                <button
                    type="button"
                    className={clsx("seat-view-btn", "hover-tip", viewMode === "student" && "seat-view-btn-active")}
                    data-tip="Heat map of student help requests"
                    onClick={() => setViewMode("student")}
                >
                    Student Actions
                </button>
            </div>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                preserveAspectRatio="xMidYMid meet"
                className="stage-svg rounded-xl w-full h-full"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
                    <g opacity={0.35}>{grid}</g>
                    <g id="seatsLayer">
                        {seats}
                        {teacherDesk}
                    </g>
                    {teacher}
                </g>
            </svg>

            <div className="zoom-controls">
                <div className="zoom-card">
                    <div className="zoom-row">
                        <button type="button" className="zoom-btn" onClick={zoomIn} aria-label="Zoom in">
                            +
                        </button>
                        <button type="button" className="zoom-btn" onClick={zoomOut} aria-label="Zoom out">
                            −
                        </button>
                    </div>
                    <button type="button" className="zoom-btn zoom-reset" onClick={resetView}>
                        Reset view
                    </button>
                </div>
            </div>
        </div>
    );
}
