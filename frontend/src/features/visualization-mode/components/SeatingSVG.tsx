// SVG renderer for the visualization seating chart and seated student overlays.
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
    type ReactElement,
    type WheelEvent as ReactWheelEvent,
} from "react";
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
        type SeatCenter = { cx: number; cy: number; side: "left" | "right"; col: number };
        type TeacherDeskRect = {
            x: number;
            y: number;
            w: number;
            h: number;
            cx: number;
            cy: number;
            col: number;
        };
        type AxisLayout = {
            coords: number[];
            positions: Map<number, number>;
            indexByCoord: Map<number, number>;
            fallbackStart: number;
        };

        const allSeats = group.seats.filter((seat) => Number.isFinite(seat.x) && Number.isFinite(seat.y));
        const pad = 24;
        const seatSize = 64;
        const seatGap = 10;
        const aisleGap = seatSize / 2;
        const normalStep = seatSize + seatGap;
        const compactAisleStep = (seatSize + aisleGap) / 2;
        const teacherStudentGap = aisleGap;

        if (!allSeats.length) {
            return {
                pad,
                width: 600,
                height: 600,
                seatSize,
                seatGap,
                seatCentersByStudentId: {} as Record<string, SeatCenter>,
                seatCentersByCoord: {} as Record<string, SeatCenter>,
                teacherDeskRect: null as null | TeacherDeskRect,
                gridLinesX: [] as number[],
                gridLinesY: [] as number[],
                toCX: (x: number) => {
                    void x;
                    return pad;
                },
                toCY: (y: number) => {
                    void y;
                    return pad;
                },
            };
        }

        const teacherSeat = allSeats.find((s) => (s.seat_id || "").toLowerCase() === "teacher") || null;
        const studentSeats = allSeats.filter((s) => (s.seat_id || "").toLowerCase() !== "teacher");

        const buildAxisLayout = (axis: "x" | "y"): AxisLayout => {
            const perpendicularAxis = axis === "x" ? "y" : "x";
            const occupiedCoords = Array.from(new Set(allSeats.map((seat) => seat[axis]))).sort((a, b) => a - b);
            const allIntegerCoords = occupiedCoords.every((coord) => Number.isInteger(coord));
            const minCoord = occupiedCoords[0] ?? 0;
            const maxCoord = occupiedCoords[occupiedCoords.length - 1] ?? minCoord;
            const coords =
                allIntegerCoords && maxCoord - minCoord <= 100
                    ? Array.from({ length: maxCoord - minCoord + 1 }, (_, index) => minCoord + index)
                    : occupiedCoords;
            const occupiedCoordSet = new Set(occupiedCoords);
            const lineMap = new Map<number, Set<number>>();

            allSeats.forEach((seat) => {
                const line = seat[perpendicularAxis];
                const coord = seat[axis];
                const lineCoords = lineMap.get(line) ?? new Set<number>();
                lineCoords.add(coord);
                lineMap.set(line, lineCoords);
            });

            const hasOccupiedBefore = (coord: number) => occupiedCoords.some((value) => value < coord);
            const hasOccupiedAfter = (coord: number) => occupiedCoords.some((value) => value > coord);
            const hasSameLineNeighbor = (coord: number) => {
                for (const lineCoords of lineMap.values()) {
                    if (!lineCoords.has(coord)) {
                        continue;
                    }

                    if (lineCoords.has(coord - 1) || lineCoords.has(coord + 1)) {
                        return true;
                    }
                }

                return false;
            };

            const aisleCoords = new Set<number>();
            coords.forEach((coord) => {
                if (!hasOccupiedBefore(coord) || !hasOccupiedAfter(coord)) {
                    return;
                }

                if (!occupiedCoordSet.has(coord) || !hasSameLineNeighbor(coord)) {
                    aisleCoords.add(coord);
                }
            });

            const teacherCoord = teacherSeat?.[axis];
            const studentCoords = new Set(studentSeats.map((seat) => seat[axis]));
            const positions = new Map<number, number>();
            let position = 0;
            coords.forEach((coord, index) => {
                if (index === 0) {
                    positions.set(coord, position);
                    return;
                }

                const previousCoord = coords[index - 1];
                const rawDelta = coord - previousCoord;
                const step =
                    allIntegerCoords && rawDelta === 1
                        ? aisleCoords.has(previousCoord) || aisleCoords.has(coord)
                            ? compactAisleStep
                            : normalStep
                        : Math.max(1, rawDelta) * normalStep;
                const extraGap =
                    axis === "y" &&
                    teacherCoord !== undefined &&
                    previousCoord === teacherCoord &&
                    studentCoords.has(coord)
                        ? teacherStudentGap
                        : 0;

                position += step + extraGap;
                positions.set(coord, position);
            });

            return {
                coords,
                positions,
                indexByCoord: new Map(coords.map((coord, index) => [coord, index])),
                fallbackStart: minCoord,
            };
        };

        const xAxis = buildAxisLayout("x");
        const yAxis = buildAxisLayout("y");

        const resolveAxisCenter = (axisLayout: AxisLayout, shift: number, value: number) => {
            const direct = axisLayout.positions.get(value);
            if (direct !== undefined) {
                return shift + direct;
            }

            const coords = axisLayout.coords;
            if (coords.length === 0) {
                return shift;
            }

            const before = [...coords].reverse().find((coord) => coord < value);
            const after = coords.find((coord) => coord > value);
            if (before !== undefined && after !== undefined) {
                const beforePos = axisLayout.positions.get(before) ?? 0;
                const afterPos = axisLayout.positions.get(after) ?? beforePos;
                const ratio = (value - before) / (after - before);
                return shift + beforePos + (afterPos - beforePos) * ratio;
            }

            return shift + (value - axisLayout.fallbackStart) * normalStep;
        };

        const rawCenterX = (seat: Seat) => xAxis.positions.get(seat.x) ?? 0;
        const rawCenterY = (seat: Seat) => yAxis.positions.get(seat.y) ?? 0;
        const deskW = seatSize * 2 + seatGap;
        const deskH = seatSize;
        const getRawBounds = (seat: Seat) => {
            const cx = rawCenterX(seat);
            const cy = rawCenterY(seat);
            const isTeacher = (seat.seat_id || "").toLowerCase() === "teacher";

            if (isTeacher) {
                const left = cx - seatSize / 2;
                const top = cy - deskH / 2;

                return {
                    minX: left,
                    maxX: left + deskW,
                    minY: top,
                    maxY: top + deskH,
                };
            }

            return {
                minX: cx - seatSize / 2,
                maxX: cx + seatSize / 2,
                minY: cy - seatSize / 2,
                maxY: cy + seatSize / 2,
            };
        };

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        allSeats.forEach((seat) => {
            const bounds = getRawBounds(seat);

            minX = Math.min(minX, bounds.minX);
            maxX = Math.max(maxX, bounds.maxX);
            minY = Math.min(minY, bounds.minY);
            maxY = Math.max(maxY, bounds.maxY);
        });

        const contentW = Math.max(1, maxX - minX);
        const contentH = Math.max(1, maxY - minY);
        const width = Math.max(600, pad * 2 + contentW);
        const height = Math.max(600, pad * 2 + contentH);
        const extraX = Math.max(0, (width - (pad * 2 + contentW)) / 2);
        const extraY = Math.max(0, (height - (pad * 2 + contentH)) / 2);
        const shiftX = pad + extraX - minX;
        const shiftY = pad + extraY - minY;

        const seatCentersByStudentId: Record<string, SeatCenter> = {};
        const seatCentersByCoord: Record<string, SeatCenter> = {};
        let teacherDeskRect: null | TeacherDeskRect = null;

        for (const s of studentSeats) {
            const cx = shiftX + rawCenterX(s);
            const cy = shiftY + rawCenterY(s);
            const side: "left" | "right" = cx < width / 2 ? "left" : "right";
            const col = xAxis.indexByCoord.get(s.x) ?? 0;

            seatCentersByCoord[`${s.x},${s.y}`] = { cx, cy, side, col };
            if (s.studentid) seatCentersByStudentId[s.studentid] = { cx, cy, side, col };
        }

        if (teacherSeat) {
            const deskX = shiftX + rawCenterX(teacherSeat) - seatSize / 2;
            const cy = shiftY + rawCenterY(teacherSeat);

            teacherDeskRect = {
                x: deskX,
                y: cy - deskH / 2,
                w: deskW,
                h: deskH,
                cx: deskX + deskW / 2,
                cy,
                col: xAxis.indexByCoord.get(teacherSeat.x) ?? 0,
            };
        }

        const buildGridLines = (axisLayout: AxisLayout, shift: number, minEdge: number, maxEdge: number) => {
            const lines = [shift + minEdge];

            for (let index = 1; index < axisLayout.coords.length; index += 1) {
                const previousCoord = axisLayout.coords[index - 1];
                const coord = axisLayout.coords[index];
                const previousPosition = axisLayout.positions.get(previousCoord) ?? 0;
                const position = axisLayout.positions.get(coord) ?? previousPosition;
                lines.push(shift + (previousPosition + position) / 2);
            }

            lines.push(shift + maxEdge);

            return Array.from(new Set(lines.map((line) => Math.round(line * 1000) / 1000))).sort((a, b) => a - b);
        };

        return {
            pad,
            width,
            height,
            seatSize,
            seatGap,
            seatCentersByStudentId,
            seatCentersByCoord,
            teacherDeskRect,
            gridLinesX: buildGridLines(xAxis, shiftX, minX, maxX),
            gridLinesY: buildGridLines(yAxis, shiftY, minY, maxY),
            toCX: (x: number) => resolveAxisCenter(xAxis, shiftX, x),
            toCY: (y: number) => resolveAxisCenter(yAxis, shiftY, y),
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

    const handleWheel = (e: ReactWheelEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        applyZoomAtPoint(factor, clientToSvgPoint(e.clientX, e.clientY));
    };

    const handleMouseDown = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        e.preventDefault();
        setIsPanning(true);
        lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
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

    const getTeacherDeskIconRect = () => {
        if (!layout.teacherDeskRect) return null;

        const size = Math.max(22, layout.seatSize * 0.55);
        const gap = Math.max(8, layout.seatGap * 1.2);
        const desk = layout.teacherDeskRect;
        const rightX = desk.x + desk.w + gap;
        const leftX = desk.x - gap - size;
        const x =
            rightX + size <= layout.width - layout.pad / 2
                ? rightX
                : Math.max(layout.pad / 2, leftX);

        return {
            x,
            y: desk.y + (desk.h - size) / 2,
            size,
        };
    };

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

        if (teacherAtFront) {
            const teacherIconRect = getTeacherDeskIconRect();
            if (teacherIconRect) {
                minX = Math.min(minX, teacherIconRect.x);
                maxX = Math.max(maxX, teacherIconRect.x + teacherIconRect.size);
                minY = Math.min(minY, teacherIconRect.y);
                maxY = Math.max(maxY, teacherIconRect.y + teacherIconRect.size);
            }
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
            const teacherIconRect = getTeacherDeskIconRect();
            if (!teacherIconRect) return null;

            return (
                <image
                    href={TEACHER_SRC}
                    x={teacherIconRect.x}
                    y={teacherIconRect.y}
                    width={teacherIconRect.size}
                    height={teacherIconRect.size}
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
