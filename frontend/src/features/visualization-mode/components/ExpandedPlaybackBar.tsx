// Compact playback controls shown while visualization mode is expanded.
import { Minimize2 } from "lucide-react";
import type { GroupPayload } from "../types";

type ExpandedPlaybackBarProps = {
    selectedDate: string | null;
    dateOptions: string[];
    period: string | null;
    periods: string[];
    slider: number;
    sliderMax: number;
    current: GroupPayload | null;
    statusText: string;
    currentTime: string;
    allDatesMode: boolean;
    allDatesValue: string;
    formatDateLabel: (raw: string) => string;
    onDateChange: (date: string) => void;
    onPeriodChange: (period: string) => void;
    onSliderChange: (value: number) => void;
    onExitExpandedView: () => void;
};

export function ExpandedPlaybackBar({
    selectedDate,
    dateOptions,
    period,
    periods,
    slider,
    sliderMax,
    current,
    statusText,
    currentTime,
    allDatesMode,
    allDatesValue,
    formatDateLabel,
    onDateChange,
    onPeriodChange,
    onSliderChange,
    onExitExpandedView,
}: ExpandedPlaybackBarProps) {
    return (
        <div
            className="expanded-playback-bar"
            role="region"
            aria-label="Expanded visualization controls"
        >
            <button
                type="button"
                className="view-mode-button expanded-view-exit"
                onClick={onExitExpandedView}
                title="Return to the normal visualization layout"
            >
                <Minimize2 size={16} aria-hidden="true" />
                Normal view
            </button>

            <label className="expanded-control expanded-control-date">
                <span className="expanded-control-label">Date</span>
                <select
                    className="select expanded-control-select"
                    value={selectedDate ?? ""}
                    onChange={(event) => onDateChange(event.target.value)}
                    aria-label="Playback date"
                >
                    {dateOptions.map((date) => (
                        <option key={date} value={date}>
                            {date === allDatesValue ? "All dates" : formatDateLabel(date)}
                        </option>
                    ))}
                </select>
            </label>

            <label className="expanded-control expanded-control-period">
                <span className="expanded-control-label">Period</span>
                <select
                    className="select expanded-control-select"
                    value={period ?? ""}
                    onChange={(event) => onPeriodChange(event.target.value)}
                    aria-label="Playback period"
                >
                    {periods.map((periodOption) => (
                        <option key={periodOption} value={periodOption}>
                            {periodOption}
                        </option>
                    ))}
                </select>
            </label>

            <label className="expanded-control expanded-control-position">
                <span className="expanded-control-label">Playback position</span>
                <span className="expanded-position-row">
                    <input
                        type="range"
                        min={0}
                        max={Math.max(1, sliderMax)}
                        value={slider}
                        step={sliderMax > 10800 ? 5 : 1}
                        onChange={(event) => onSliderChange(Number(event.target.value))}
                        className="range"
                        disabled={allDatesMode || !current}
                    />
                    <span className="expanded-position-value">{slider}s</span>
                </span>
            </label>

            <div className="expanded-control expanded-control-session">
                <span className="expanded-control-label">Session window</span>
                <span className="expanded-control-value expanded-session-value" title={statusText}>
                    {statusText}
                </span>
            </div>

            <div className="expanded-control expanded-control-time">
                <span className="expanded-control-label">Current time</span>
                <span className="expanded-control-value expanded-time-value">
                    {current ? currentTime : "--"}
                </span>
            </div>
        </div>
    );
}
