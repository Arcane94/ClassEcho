// Visualization-mode data helpers for grouping logs, windows, seats, and playback state.
import type {
    GroupPayload,
    HelpRow,
    RequestRow,
    SeatRow,
    VisualizationScheduleRow,
    TeacherLog,
    StudentLog,
} from "./types";

export const VISUALIZATION_ICON_BASE = "/visualization/icons";
export const EASTERN_TIME_ZONE = "America/New_York";

export const TEACHER_SRC = `${VISUALIZATION_ICON_BASE}/teacher.png`;
export const HAND_SRC = `${VISUALIZATION_ICON_BASE}/hand.png`;

export const clsx = (...p: Array<string | false | undefined>) =>
    p.filter(Boolean).join(" ");

export const fmtMS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
};

function cleanCsvText(raw: any): string {
    if (raw === undefined || raw === null) return "";
    return String(raw)
        .replace(/\ufeff/g, "")
        .replace(/[\u00a0\u202f]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function isNullishCsvValue(raw: any): boolean {
    const s = cleanCsvText(raw).toLowerCase();
    return (
        s === "" ||
        s === "\\n" ||
        s === "nan" ||
        s === "null" ||
        s === "undefined" ||
        s === "n/a"
    );
}

function intlikeStr(v: any): string {
    const s = cleanCsvText(v);
    if (isNullishCsvValue(s)) return "";
    const x = Number(s);
    return Number.isFinite(x) ? String(Math.trunc(x)) : s;
}

function normCols(row: any) {
    const o: any = {};
    Object.keys(row).forEach((k) => {
        const normalized = k
            .replace(/\ufeff/g, "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        o[normalized] = row[k];
    });
    return o;
}

function buildLocalDate(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0
): Date | null {
    const dt = new Date(year, month - 1, day, hour, minute, second);
    if (isNaN(dt.getTime())) return null;
    if (
        dt.getFullYear() !== year ||
        dt.getMonth() !== month - 1 ||
        dt.getDate() !== day
    ) {
        return null;
    }
    return dt;
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

type TimeZoneDateParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

const timeZoneFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getTimeZoneFormatter(timeZone: string): Intl.DateTimeFormat {
    const cached = timeZoneFormatterCache.get(timeZone);
    if (cached) {
        return cached;
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    timeZoneFormatterCache.set(timeZone, formatter);
    return formatter;
}

function parseTimeZoneDateParts(date: Date, timeZone: string): TimeZoneDateParts | null {
    const parts = getTimeZoneFormatter(timeZone).formatToParts(date);
    const lookup = parts.reduce<Record<string, string>>((accumulator, part) => {
        if (part.type !== "literal") {
            accumulator[part.type] = part.value;
        }
        return accumulator;
    }, {});

    const year = Number(lookup.year);
    const month = Number(lookup.month);
    const day = Number(lookup.day);
    const hour = Number((lookup.hour ?? "0") === "24" ? "00" : lookup.hour);
    const minute = Number(lookup.minute);
    const second = Number(lookup.second);

    if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day) ||
        !Number.isFinite(hour) ||
        !Number.isFinite(minute) ||
        !Number.isFinite(second)
    ) {
        return null;
    }

    return { year, month, day, hour, minute, second };
}

function buildUtcComparableValue(parts: TimeZoneDateParts): number {
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function isSupportedTimeZone(timeZone: string): boolean {
    if (!timeZone) {
        return false;
    }

    try {
        getTimeZoneFormatter(timeZone).format(new Date());
        return true;
    } catch {
        return false;
    }
}

export function getVisualizationBrowserTimeZone(): string {
    try {
        const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return isSupportedTimeZone(browserTimeZone) ? browserTimeZone : EASTERN_TIME_ZONE;
    } catch {
        return EASTERN_TIME_ZONE;
    }
}

export function normalizeVisualizationTimeZone(raw: any, fallback = EASTERN_TIME_ZONE): string {
    const candidate = cleanCsvText(raw);
    if (candidate && isSupportedTimeZone(candidate)) {
        return candidate;
    }

    return fallback;
}

export function getVisualizationTimeZoneOptions(preferredTimeZone?: string): string[] {
    const supportedValuesOf = (
        Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;

    let supported: string[] = [];
    if (typeof supportedValuesOf === "function") {
        try {
            supported = supportedValuesOf("timeZone");
        } catch {
            supported = [];
        }
    }

    return Array.from(
        new Set(
            [
                preferredTimeZone ? normalizeVisualizationTimeZone(preferredTimeZone, getVisualizationBrowserTimeZone()) : "",
                getVisualizationBrowserTimeZone(),
                EASTERN_TIME_ZONE,
                "America/Chicago",
                "America/Denver",
                "America/Los_Angeles",
                "America/Anchorage",
                "Pacific/Honolulu",
                "UTC",
                ...supported,
            ].filter(Boolean),
        ),
    );
}

function buildDateInTimeZone(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    timeZone: string
): Date | null {
    let candidateMs = Date.UTC(year, month - 1, day, hour, minute, second);
    const desiredValue = Date.UTC(year, month - 1, day, hour, minute, second);

    for (let i = 0; i < 3; i += 1) {
        const actualParts = parseTimeZoneDateParts(new Date(candidateMs), timeZone);
        if (!actualParts) {
            return null;
        }

        const diff = desiredValue - buildUtcComparableValue(actualParts);
        candidateMs += diff;

        if (diff === 0) {
            break;
        }
    }

    const result = new Date(candidateMs);
    return Number.isNaN(result.getTime()) ? null : result;
}

export function formatClockLabel(d: Date, twelveHour: boolean): string {
    if (twelveHour) {
        const ampm = d.getHours() >= 12 ? "PM" : "AM";
        let h = d.getHours() % 12;
        if (h === 0) h = 12;
        return `${h}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${ampm}`;
    }
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function parseDateOnly(raw: any): Date | null {
    const s = cleanCsvText(raw);
    if (isNullishCsvValue(s)) return null;

    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {
        return buildLocalDate(Number(m[1]), Number(m[2]), Number(m[3]));
    }

    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) {
        return buildLocalDate(Number(m[3]), Number(m[1]), Number(m[2]));
    }

    const dt = new Date(s);
    if (isNaN(dt.getTime())) return null;
    return buildLocalDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

export function parseObservationTimestamp(raw: any): Date | null {
    const s = cleanCsvText(raw);
    if (isNullishCsvValue(s)) return null;

    const zoned = s.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?([zZ]|[+-]\d{2}:\d{2})$/
    );
    if (zoned) {
        const iso =
            `${zoned[1]}-${zoned[2]}-${zoned[3]}T${zoned[4]}:${zoned[5]}:${zoned[6] ?? "00"}` +
            `${zoned[7] ? `.${zoned[7].padEnd(3, "0")}` : ""}${zoned[8]}`;
        const dt = new Date(iso);
        return isNaN(dt.getTime()) ? null : dt;
    }

    const local = s.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (local) {
        return buildDateInTimeZone(
            Number(local[1]),
            Number(local[2]),
            Number(local[3]),
            Number(local[4]),
            Number(local[5]),
            Number(local[6] ?? "0"),
            EASTERN_TIME_ZONE
        );
    }

    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
}

type ParsedClock = {
    hour24: number;
    minute: number;
    second: number;
    hasMeridiem: boolean;
    pseudoUtc: boolean;
};

function parseClockParts(raw: any): ParsedClock | null {
    const s = cleanCsvText(raw);
    if (isNullishCsvValue(s)) return null;

    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?$/i);
    if (!m) return null;

    let hour = Number(m[1]);
    const minute = Number(m[2]);
    const second = Number(m[3] ?? "0");
    const meridiem = m[4]?.toUpperCase() ?? "";
    const hasMeridiem = meridiem.length > 0;
    const pseudoUtc = hasMeridiem && hour > 12;

    if (!pseudoUtc) {
        if (meridiem === "PM" && hour < 12) hour += 12;
        if (meridiem === "AM" && hour === 12) hour = 0;
    }

    if (hour < 0 || hour > 23 || minute > 59 || second > 59) return null;

    return { hour24: hour, minute, second, hasMeridiem, pseudoUtc };
}

export function parseSeatingDateTime(dateRaw: any, timeRaw: any, timeZoneRaw: any = EASTERN_TIME_ZONE): {
    value: Date | null;
    label: string;
} {
    const date = parseDateOnly(dateRaw);
    const time = parseClockParts(timeRaw);
    const fallbackLabel = cleanCsvText(timeRaw);
    const timeZone = normalizeVisualizationTimeZone(timeZoneRaw, EASTERN_TIME_ZONE);

    if (!date || !time) {
        return { value: null, label: fallbackLabel };
    }

    const value = time.pseudoUtc
        ? new Date(
              Date.UTC(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  time.hour24,
                  time.minute,
                  time.second
              )
          )
        : buildDateInTimeZone(
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate(),
              time.hour24,
              time.minute,
              time.second,
              timeZone
          );

    if (!value || isNaN(value.getTime())) {
        return { value: null, label: fallbackLabel };
    }

    return {
        value,
        label: fallbackLabel || formatClockLabel(value, time.hasMeridiem),
    };
}

function normalizeLocation(raw: any): string {
    const s = cleanCsvText(raw);
    if (isNullishCsvValue(s)) return "";

    const folded = s.toLowerCase();
    if (folded === "at front") return "At Front";
    if (folded === "on lms") return "On LMS";
    if (folded === "walking") return "Walking";
    if (folded === "by student") return "By Student";
    if (folded === "teacher desk" || folded === "at desk") return "Teacher Desk";
    return s;
}

function formatObservationTimeLabel(raw: any, parsed: Date): string {
    const s = cleanCsvText(raw);
    return formatClockLabel(parsed, /(?:^|\s)(AM|PM)$/i.test(s));
}

function stripLocation(raw: any): { cleaned: string; location: string | null } {
    let s = cleanCsvText(raw);
    if (isNullishCsvValue(s)) {
        return { cleaned: "", location: null };
    }

    const locParts: string[] = [];
    const locationMatchers: Array<{ re: RegExp; label: string }> = [
        { re: /at front/gi, label: "At Front" },
        { re: /on lms/gi, label: "On LMS" },
        { re: /walking/gi, label: "Walking" },
        { re: /by student/gi, label: "By Student" },
        { re: /teacher'?s desk/gi, label: "Teacher Desk" },
        { re: /at desk/gi, label: "Teacher Desk" },
    ];

    for (const { re, label } of locationMatchers) {
        if (re.test(s)) {
            locParts.push(label);
        }
        re.lastIndex = 0;
        s = s.replace(re, "");
    }

    return {
        cleaned: cleanCsvText(s),
        location: locParts.length ? Array.from(new Set(locParts)).join("; ") : null,
    };
}

// Turn that ugly JSON-ish tag string into "Tag A; Tag B; Tag C"
// (location phrases should already have been stripped out)
export function normalizeTags(raw: any): string {
    const s = cleanCsvText(raw);
    if (isNullishCsvValue(s)) return "";

    const chunks = s.split(/[;,]/);
    const cleaned: string[] = [];

    for (let part of chunks) {
        part = part.replace(/[\\[\]"]/g, " ");
        part = part.replace(/\s+-\s+.*$/g, "");
        part = part
            .replace(/[^A-Za-z0-9/&' -]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (part) cleaned.push(part);
    }

    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const c of cleaned) {
        if (!seen.has(c)) {
            seen.add(c);
            uniq.push(c);
        }
    }

    return uniq.join("; ");
}

export function cleanNote(raw: any): string {
    let s = cleanCsvText(raw);
    if (isNullishCsvValue(s)) return "";

    try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
            return parsed.join(" ").trim();
        }
        if (typeof parsed === "string") {
            return parsed.trim();
        }
    } catch {
        // not valid JSON, fall through
    }

    if (/^\[\s*]$/.test(s)) return "";

    if (s.startsWith("[") && s.endsWith("]")) {
        s = s.slice(1, -1).trim();
    }

    s = s.replace(/\\n/g, " ");
    s = s.replace(/\\"/g, '"');
    s = s.replace(/\\+/g, "");
    s = s.replace(/\s+/g, " ");
    s = s.replace(/(\S)"\s+"(\S)/g, '$1 "$2');
    s = s.replace(/"{2,}/g, '"');

    const quoteCount = (s.match(/"/g) || []).length;
    const hasQuotedSegment = /"[^"]+"/.test(s);

    if (quoteCount % 2 === 1 && /"$/.test(s) && !hasQuotedSegment) {
        s = s.slice(0, -1).trim();
    }

    return s.trim();
}

/* ---------- Parsing CSVs ---------- */

export function parseSeating(rows: any[]): SeatRow[] {
    const deduped = new Map<string, SeatRow>();

    for (const r of rows.map(normCols)) {
        const nextSeat: SeatRow = {
            studentid: intlikeStr(r.studentid),
            seat_id: cleanCsvText(r.seat_id),
            x: Number(cleanCsvText(r.x)),
            y: Number(cleanCsvText(r.y)),
        };

        if (!Number.isFinite(nextSeat.x) || !Number.isFinite(nextSeat.y)) {
            continue;
        }

        const seatKey = nextSeat.seat_id || `${nextSeat.x},${nextSeat.y}`;
        const existingSeat = deduped.get(seatKey);
        if (!existingSeat) {
            deduped.set(seatKey, nextSeat);
            continue;
        }

        deduped.set(seatKey, {
            seat_id: existingSeat.seat_id || nextSeat.seat_id,
            x: existingSeat.x,
            y: existingSeat.y,
            studentid: existingSeat.studentid || nextSeat.studentid,
        });
    }

    return Array.from(deduped.values());
}

export function parseHelp(rows: any[]): HelpRow[] {
    const out: HelpRow[] = [];
    for (const rr of rows.map(normCols)) {
        const sid = intlikeStr(rr.student_id ?? rr.studentid);

        const rawStart = cleanCsvText(rr.start_time);
        const rawEnd = cleanCsvText(rr.end_time);

        const st = parseObservationTimestamp(rawStart);
        const et = parseObservationTimestamp(rawEnd);
        if (!st || !et || et <= st) continue;

        const locParts: string[] = [];

        const bh = stripLocation(rr.behavior_tags ?? rr.behaviortags);
        if (bh.location) locParts.push(bh.location);

        const fn = stripLocation(rr.function_tags ?? rr.functiontags);
        if (fn.location) locParts.push(fn.location);

        const stc = stripLocation(rr.structure_tags ?? rr.structuretags);
        if (stc.location) locParts.push(stc.location);

        const ct = stripLocation(rr.custom_tags ?? rr.customtags);
        if (ct.location) locParts.push(ct.location);

        const teacherPosition = normalizeLocation(rr.teacher_position);
        if (teacherPosition) locParts.push(teacherPosition);

        out.push({
            student_id: sid,
            start_time: st,
            end_time: et,
            behavior_tags: normalizeTags(bh.cleaned),
            function_tags: normalizeTags(fn.cleaned),
            structure_tags: normalizeTags(stc.cleaned),
            custom_tags: normalizeTags(ct.cleaned),
            location: Array.from(new Set(locParts)).join("; "),
            note: cleanNote(rr.note ?? rr.notes),
            raw_start: rawStart,
            raw_end: rawEnd,
        });
    }
    return out;
}

export function parseRequests(rows: any[]): RequestRow[] {
    const out: RequestRow[] = [];
    for (const rr of rows.map(normCols)) {
        const sid = intlikeStr(rr.student_id ?? rr.studentid);

        const rawStart = cleanCsvText(rr.start_time);
        const rawEnd = cleanCsvText(rr.end_time);

        const st = parseObservationTimestamp(rawStart);
        const et = parseObservationTimestamp(rawEnd);
        if (!st || !et || et <= st) continue;

        const locParts: string[] = [];

        const bh = stripLocation(rr.behavior_tags ?? rr.behaviortags);
        if (bh.location) locParts.push(bh.location);

        const af = stripLocation(rr.affect ?? rr.affect_tags);
        if (af.location) locParts.push(af.location);

        out.push({
            student_id: sid,
            start_time: st,
            end_time: et,
            behavior_tags: normalizeTags(bh.cleaned),
            affect: normalizeTags(af.cleaned),
            on_task: rr.on_task,
            location: Array.from(new Set(locParts)).join("; "),
            note: cleanNote(rr.note ?? rr.notes),
            raw_start: rawStart,
            raw_end: rawEnd,
        });
    }
    return out;
}

/* ---------- Helper for cumulative help ---------- */
export function cumulativeHelpUpTo(ints: [string, string][], tNow: Date) {
    if (!ints?.length) return 0;
    let total = 0;
    for (const [s, e] of ints) {
        const sdt = new Date(s);
        const edt = new Date(e);
        if (edt <= tNow) {
            total += Math.max(0, (edt.getTime() - sdt.getTime()) / 1000);
        } else if (sdt < tNow && tNow < edt) {
            total += Math.max(0, (tNow.getTime() - sdt.getTime()) / 1000);
        }
    }
    return Math.floor(total);
}

// Green heat scale (sqrt) for seat fills
export function heatGreen(secs: number, maxSecs: number) {
    if (!maxSecs || maxSecs <= 0) return "hsl(140 25% 92%)";
    const t = Math.sqrt(Math.max(0, Math.min(1, secs / maxSecs)));
    const Lmin = 38,
        Lmax = 92;
    const S = 70;
    const L = Lmax - t * (Lmax - Lmin);
    return `hsl(140 ${S}% ${L}%)`;
}

function isHelpRequestBehavior(behaviorTags: string | undefined | null): boolean {
    if (!behaviorTags) return false;

    const parts = behaviorTags
        .split(";")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

    return parts.some((p) => p.includes("request") && p.includes("help"));
}

/* ---------- Build groups from all CSVs ---------- */
export function buildGroups(
    schedule: VisualizationScheduleRow[],
    help: HelpRow[] | null,
    requests: RequestRow[] | null
): Record<string, GroupPayload> {
    const grouped: Record<string, GroupPayload> = {};

    for (const r of schedule) {
        const date = cleanCsvText(r.date);
        const period = cleanCsvText(r.period);
        if (!date || !period) continue;

        const key = `${date} | ${period}`;
        if (!grouped[key]) {
            grouped[key] = {
                date,
                period,
                timezone: r.timezone,
                seats: (r.seats || []).map((seatRow) => ({
                    seat_id:
                        seatRow.seat_type === "teacher"
                            ? "teacher"
                            : cleanCsvText(seatRow.seat_label) || `seat-${seatRow.x}-${seatRow.y}`,
                    x: Number(seatRow.x),
                    y: Number(seatRow.y),
                    studentid: seatRow.seat_type === "student" ? cleanCsvText(seatRow.student_identifier) : "",
                    seat_type: seatRow.seat_type,
                })),
                teacher_logs: [],
                student_logs: [],
            };
        }
        const g = grouped[key];
        if (!g.timezone && r.timezone) {
            g.timezone = r.timezone;
        }

        const parsedStart = parseSeatingDateTime(date, r.start_time, r.timezone);
        const parsedEnd = parseSeatingDateTime(date, r.end_time, r.timezone);
        const startLabel = cleanCsvText(r.start_time) || parsedStart.label;
        const endLabel = cleanCsvText(r.end_time) || parsedEnd.label;

        if (startLabel && !g.t0_label) g.t0_label = startLabel;
        if (endLabel && !g.t1_label) g.t1_label = endLabel;

        if (parsedStart.value && parsedEnd.value) {
            const start = parsedStart.value;
            let end = parsedEnd.value;
            if (end <= start) {
                end = new Date(end.getTime() + 24 * 3600 * 1000);
            }

            if (!g.t0 || start < new Date(g.t0)) {
                g.t0 = start.toISOString();
            }
            if (!g.t1 || end > new Date(g.t1)) {
                g.t1 = end.toISOString();
            }
        }
    }

    for (const key of Object.keys(grouped)) {
        const item = grouped[key];
        const present = new Set(
            item.seats
                .map((s) => s.studentid)
                .filter((sid) => Boolean(sid) && sid !== "-1")
        );

        let t0 = item.t0 ? new Date(item.t0) : null;
        let t1 = item.t1 ? new Date(item.t1) : null;

        if (!t0 || !t1 || t1 <= t0) {
            const base = new Date("1970-01-01T00:00:00Z");
            t0 = base;
            t1 = new Date(base.getTime() + 1000);
            item.t0 = t0.toISOString();
            item.t1 = t1.toISOString();
        }

        const helpIntervals: Record<string, [string, string][]> = {};
        const teacherLogs: TeacherLog[] = [];
        let hasHelp = false;

        if (help) {
            let sub = help.map((h) => ({
                student_id: h.student_id || "",
                s2: h.start_time,
                e2: h.end_time,
                behavior_tags: h.behavior_tags || "",
                function_tags: h.function_tags || "",
                structure_tags: h.structure_tags || "",
                custom_tags: h.custom_tags || "",
                location: h.location || "",
                note: h.note || "",
                raw_start: h.raw_start || "",
                raw_end: h.raw_end || "",
            }));

            sub = sub
                .filter((h) => h.e2 > t0! && h.s2 < t1!)
                .map((h) => ({
                    ...h,
                    s2: new Date(Math.max(h.s2.getTime(), t0!.getTime())),
                    e2: new Date(Math.min(h.e2.getTime(), t1!.getTime())),
                }));

            if (sub.length) {
                hasHelp = true;

                for (const rec of sub) {
                    const sIso = rec.s2.toISOString();
                    const eIso = rec.e2.toISOString();

                    if (rec.student_id && present.has(rec.student_id)) {
                        if (!helpIntervals[rec.student_id]) {
                            helpIntervals[rec.student_id] = [];
                        }
                        helpIntervals[rec.student_id].push([sIso, eIso]);
                    }

                    teacherLogs.push({
                        student_id: rec.student_id,
                        start: sIso,
                        end: eIso,
                        behavior_tags: rec.behavior_tags,
                        function_tags: rec.function_tags,
                        structure_tags: rec.structure_tags,
                        custom_tags: rec.custom_tags,
                        location: rec.location,
                        note: rec.note,
                        start_label: formatObservationTimeLabel(rec.raw_start, rec.s2) || undefined,
                        end_label: formatObservationTimeLabel(rec.raw_end, rec.e2) || undefined,
                    });
                }
            }
        }

        const requestIntervals: Record<string, [string, string][]> = {};
        const studentLogs: StudentLog[] = [];
        let hasReq = false;

        if (requests && present.size) {
            let subReq = requests
                .filter((h) => present.has(h.student_id))
                .map((h) => ({
                    student_id: h.student_id,
                    s2: h.start_time,
                    e2: h.end_time,
                    behavior_tags: h.behavior_tags || "",
                    affect: h.affect || "",
                    on_task: h.on_task !== undefined ? String(h.on_task) : "",
                    location: h.location || "",
                    note: h.note || "",
                    raw_start: h.raw_start || "",
                    raw_end: h.raw_end || "",
                }));

            subReq = subReq
                .filter((h) => h.e2 > t0! && h.s2 < t1!)
                .map((h) => ({
                    ...h,
                    s2: new Date(Math.max(h.s2.getTime(), t0!.getTime())),
                    e2: new Date(Math.min(h.e2.getTime(), t1!.getTime())),
                }));

            for (const rec of subReq) {
                const sIso = rec.s2.toISOString();
                const eIso = rec.e2.toISOString();

                if (isHelpRequestBehavior(rec.behavior_tags) && rec.student_id) {
                    if (!requestIntervals[rec.student_id]) {
                        requestIntervals[rec.student_id] = [];
                    }
                    requestIntervals[rec.student_id].push([sIso, eIso]);
                    hasReq = true;
                }

                studentLogs.push({
                    student_id: rec.student_id,
                    start: sIso,
                    end: eIso,
                    behavior_tags: rec.behavior_tags,
                    affect: rec.affect,
                    on_task: rec.on_task,
                    location: rec.location,
                    note: rec.note,
                    start_label: formatObservationTimeLabel(rec.raw_start, rec.s2) || undefined,
                    end_label: formatObservationTimeLabel(rec.raw_end, rec.e2) || undefined,
                });
            }
        }

        item.has_help = hasHelp;
        item.help_intervals = helpIntervals;

        item.has_requests = hasReq;
        item.request_intervals = requestIntervals;

        item.teacher_logs = teacherLogs;
        item.student_logs = studentLogs;
    }

    return grouped;
}
