// Playback controls and session metadata cards for visualization mode.
import type { GroupPayload } from "../types";
import { InfoTip } from "./InfoTip";

type ControlsPanelProps = {
    selectedDate: string | null;
    dateOptions: string[];
    period: string | null;
    periods: string[];
    isnapPrefix: string;

    speed: number;
    slider: number;
    sliderMax: number;
    playing: boolean;

    current: GroupPayload | null;
    statusText: string;
    playbackTimeZone?: string | null;
    hudLine: { teacher: string; requests: string; clock: string };

    formatDateLabel: (raw: string) => string;

    onDateChange: (date: string) => void;
    onPeriodChange: (period: string) => void;
    onIsnapPrefixChange: (prefix: string) => void;
    onSpeedChange: (speed: number) => void;
    onPlayToggle: () => void;
    onSliderChange: (value: number) => void;

    allDatesMode: boolean;
    allDatesValue: string;
};

export function ControlsPanel({
                                  selectedDate,
                                  dateOptions,
                                  period,
                                  periods,
                                  isnapPrefix,
                                  speed,
                                  slider,
                                  sliderMax,
                                  playing,
                                  current,
                                  statusText,
                                  playbackTimeZone,
                                  hudLine,
                                  formatDateLabel,
                                  onDateChange,
                                  onPeriodChange,
                                  onIsnapPrefixChange,
                                  onSpeedChange,
                                  onPlayToggle,
                                  onSliderChange,
                                  allDatesMode,
                                  allDatesValue,
                              }: ControlsPanelProps) {
    const LabelWithTip = ({
                              label,
                              tip,
                              align = "center",
                          }: {
        label: string;
        tip: string;
        align?: "left" | "center" | "right";
    }) => (
        <span className="label-with-tip">
      <span className="ctrl-label">{label}</span>
            <InfoTip content={tip} label={`Explain ${label}`} align={align} />
    </span>
    );

    return (
        <div className="panel-row">
            <div className="panel panel-wide">
                <div className="panel-title">Controls</div>

                <div className="controls">
                    <div className="controls-section controls-left">
                        <label className="ctrl ctrl-date">
                            <LabelWithTip
                                label="Date"
                                tip="Choose the classroom observation date to view. Use All dates to switch to the cumulative heatmap."
                                align="left"
                            />
                            <select
                                className="select select-date"
                                value={selectedDate ?? ""}
                                onChange={(e) => onDateChange(e.target.value)}
                            >
                                {dateOptions.map((d) => (
                                    <option key={d} value={d}>
                                        {d === allDatesValue ? "All dates" : formatDateLabel(d)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="ctrl ctrl-period">
                            <LabelWithTip
                                label="Period"
                                tip="Choose which class period to replay for the selected date."
                                align="right"
                            />
                            <select
                                className="select select-period"
                                value={period ?? ""}
                                onChange={(e) => onPeriodChange(e.target.value)}
                            >
                                {periods.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="ctrl ctrl-span-2 ctrl-prefix">
                            <LabelWithTip
                                label="Student ID Prefix"
                                tip='Enter the prefix that, when combined with a student ID, forms the SnapClass username (for example, "G2L" becomes G2L132).'
                                align="left"
                            />
                            <input
                                className="text-input text-input-prefix"
                                type="text"
                                value={isnapPrefix}
                                onChange={(e) => onIsnapPrefixChange(e.target.value)}
                                placeholder="Enter prefix"
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </label>
                    </div>

                    <div className="controls-section controls-right">
                        <div className="ctrl ctrl-play">
                            <button
                                onClick={onPlayToggle}
                                className="play"
                                disabled={allDatesMode || !current}
                            >
                                {playing ? "Pause" : "Play"}
                            </button>

                            <div className="ctrl-speed ctrl-speed-slider">
                                <LabelWithTip
                                    label="Speed"
                                    tip="Adjust how quickly playback advances through the session. Higher values move faster."
                                    align="left"
                                />
                                <div className="slider-row slider-row-compact">
                                    <input
                                        type="range"
                                        min={1}
                                        max={20}
                                        step={1}
                                        value={speed}
                                        onChange={(e) => onSpeedChange(Number(e.target.value))}
                                        className="range"
                                        disabled={allDatesMode || !current}
                                    />
                                    <span className="range-label">{speed}x</span>
                                </div>
                            </div>
                        </div>

                        <div className="ctrl ctrl-slider">
                            <LabelWithTip
                                label="Playback position"
                                tip="Scrub to any second within the selected session to inspect what was happening at that moment."
                                align="left"
                            />
                            <div className="slider-row">
                                <input
                                    type="range"
                                    min={0}
                                    max={Math.max(1, sliderMax)}
                                    value={slider}
                                    step={sliderMax > 10800 ? 5 : 1}
                                    onChange={(e) => onSliderChange(Number(e.target.value))}
                                    className="range"
                                    disabled={allDatesMode || !current}
                                />
                                <span className="range-label">{slider}s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel panel-narrow">
                <div className="panel-title-row panel-title-row-between">
                    <div className="panel-title">Playback Info</div>
                    {playbackTimeZone ? (
                        <div className="panel-meta-pill" title={playbackTimeZone}>
                            {playbackTimeZone}
                        </div>
                    ) : null}
                </div>

                <div className="hud-grid">
                    <div
                        className={`hud-item hud-span-full${allDatesMode ? " hud-item-status-cumulative" : ""}`}
                    >
                        <div className="label-with-tip">
                            <div className="hud-label">Session window</div>
                            <InfoTip
                                content="Shows the start and end time for the currently selected classroom session."
                                label="Explain session window"
                                align="right"
                            />
                        </div>
                        <div
                            className={`hud-value${allDatesMode ? " hud-value-status-cumulative" : ""}`}
                        >
                            {statusText}
                        </div>
                    </div>

                    {current && (
                        <>
                            <div className="hud-item">
                                <div className="label-with-tip">
                                    <div className="hud-label">Teacher helping</div>
                                    <InfoTip
                                        content="Identifies the student the teacher is currently helping, based on the observation logs."
                                        label="Explain teacher helping"
                                        align="left"
                                    />
                                </div>
                                <div className="hud-value">{hudLine.teacher}</div>
                            </div>

                            <div className="hud-item">
                                <div className="label-with-tip">
                                    <div className="hud-label">Requesting Help</div>
                                    <InfoTip
                                        content="Lists students who are currently marked as requesting help in the observation logs."
                                        label="Explain requesting help"
                                        align="right"
                                    />
                                </div>
                                <div className="hud-value">{hudLine.requests}</div>
                            </div>

                            <div className="hud-item hud-span-full">
                                <div className="label-with-tip">
                                    <div className="hud-label">Current time</div>
                                    <InfoTip
                                        content="Displays the classroom clock time corresponding to the current playback position."
                                        label="Explain current time"
                                        align="right"
                                    />
                                </div>
                                <div className="hud-value hud-clock">
                                    {hudLine.clock}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
