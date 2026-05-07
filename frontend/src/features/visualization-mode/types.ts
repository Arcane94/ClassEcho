// Shared type definitions for the visualization mode data structures.

export type SeatRow = {
    studentid: string;
    seat_id: string;
    x: number;
    y: number;
    seat_type?: VisualizationSeatType;
};

export type VisualizationSeatType = "student" | "teacher" | "blocked";

export type VisualizationSeat = {
    id: string;
    period_seat_id?: number | null;
    assignment_id?: number | null;
    seat_label: string;
    x: number;
    y: number;
    seat_type: VisualizationSeatType;
    student_identifier: string;
};

export type VisualizationScheduleRow = {
    id: string;
    session_date_id?: number | null;
    session_period_id?: number | null;
    date: string;
    period: string;
    student_id_prefix: string;
    timezone: string;
    start_time: string;
    end_time: string;
    seats: VisualizationSeat[];
};

export type LogTagSection = {
    key: string;
    label: string;
    tags: string;
};

export type HelpRow = {
    student_id: string;
    start_time: Date;
    end_time: Date;
    tag_sections: LogTagSection[];
    note?: string;
    location?: string;

    // NEW: keep original strings from CSV
    raw_start?: string;
    raw_end?: string;
};

export type RequestRow = {
    student_id: string;
    start_time: Date;
    end_time: Date;
    tag_sections: LogTagSection[];
    affect?: string;
    on_task?: string | number | boolean;
    note?: string;
    location?: string;

    // NEW: keep original strings from CSV
    raw_start?: string;
    raw_end?: string;
};

export type TeacherLog = {
    student_id: string;
    start: string;       // ISO for math
    end: string;         // ISO for math
    tag_sections: LogTagSection[];
    note?: string;
    location?: string;

    // NEW: time label exactly as we want to show it
    start_label?: string;
    end_label?: string;
};

export type StudentLog = {
    student_id: string;
    start: string;       // ISO for math
    end: string;         // ISO for math
    tag_sections: LogTagSection[];
    affect?: string;
    on_task?: string;
    note?: string;
    location?: string;

    // NEW: time label exactly as we want to show it
    start_label?: string;
    end_label?: string;
};

export type EmojiReactionEvent = {
    id?: number;
    student_id: string;
    user_id?: string | null;
    emoji_key: string;
    created_at: string;
    before_window?: boolean;
    assignment_id?: string | null;
    section_id?: string | null;
};

export type EmojiReactionInterval = {
    student_id: string;
    emoji_key: string;
    created_at: string;
    start: string;
    end: string;
    before_window?: boolean;
};

export type GroupPayload = {
    date: string;
    period: string;
    student_id_prefix?: string;
    timezone?: string;
    seats: Array<{
        seat_id: string;
        x: number;
        y: number;
        studentid: string;
        seat_type?: VisualizationSeatType;
    }>;

    // Session window from the saved visualization setup
    t0?: string;
    t1?: string;

    // Pure string labels from the saved visualization setup
    t0_label?: string;
    t1_label?: string;

    // Teacher help (timeline heatmap + SVG)
    has_help?: boolean;
    help_intervals?: Record<string, [string, string][]>;

    // Student help requests (hands up)
    has_requests?: boolean;
    request_intervals?: Record<string, [string, string][]>;

    // Logs for panel
    teacher_logs?: TeacherLog[];
    student_logs?: StudentLog[];
};

export type LogFilterKey = string;
export type LogFilters = Partial<Record<LogFilterKey, string[]>>;

export interface LogFilterDefinition {
    key: LogFilterKey;
    label: string;
    placeholder: string;
}

export const SECTION_FILTER_KEY_PREFIX = "section:";

export function getSectionFilterKey(sectionLabel: string): LogFilterKey {
    return `${SECTION_FILTER_KEY_PREFIX}${sectionLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

export function isSectionFilterKey(key: string): boolean {
    return key.startsWith(SECTION_FILTER_KEY_PREFIX);
}

export const BASE_LOG_FILTER_DEFINITIONS: LogFilterDefinition[] = [
    {
        key: "student",
        label: "Student",
        placeholder: "Type an ID and press Enter (e.g., 11)",
    },
    {
        key: "affect",
        label: "Affect",
        placeholder: "Type an affect and press Enter (e.g., excited)",
    },
    {
        key: "emoji",
        label: "Emoji",
        placeholder: "Type an emoji key and press Enter (e.g., happy)",
    },
    {
        key: "location",
        label: "Location",
        placeholder: "Type a location and press Enter (e.g., Front)",
    },
    {
        key: "note",
        label: "Notes",
        placeholder: "Type text and press Enter (e.g., peer collaboration)",
    },
];
