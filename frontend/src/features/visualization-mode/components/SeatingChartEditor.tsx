// Visual editor for replay-window seating charts and seat assignments.
import { Copy, Minus, Plus, Trash2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";

import type { VisualizationScheduleRow, VisualizationSeat } from "../types";
import { createVisualizationSeat } from "../utils/schedule";

type SeatingChartEditorProps = {
  replayWindow: VisualizationScheduleRow | null;
  replayWindows: VisualizationScheduleRow[];
  onChangeSeats: (rowId: string, seats: VisualizationSeat[]) => void;
};

type GridCell = {
  x: number;
  y: number;
};

const DEFAULT_COLUMNS = 6;
const DEFAULT_ROWS = 4;
const MIN_COLUMNS = 1;
const MIN_ROWS = 1;
const MAX_COLUMNS = 14;
const MAX_ROWS = 12;
const GRID_CELL_SIZE = 62;

function cellKey(x: number, y: number) {
  return `${x}:${y}`;
}

function parseCellKey(key: string): GridCell | null {
  const [rawX, rawY] = key.split(":");
  const x = Number(rawX);
  const y = Number(rawY);

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return null;
  }

  return { x, y };
}

function buildRectangleSelection(anchor: GridCell, target: GridCell): string[] {
  const minX = Math.min(anchor.x, target.x);
  const maxX = Math.max(anchor.x, target.x);
  const minY = Math.min(anchor.y, target.y);
  const maxY = Math.max(anchor.y, target.y);
  const next: string[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      next.push(cellKey(x, y));
    }
  }

  return next;
}

function getInitialGridSize(seats: VisualizationSeat[]) {
  const maxX = seats.reduce((value, seat) => Math.max(value, seat.x), -1);
  const maxY = seats.reduce((value, seat) => Math.max(value, seat.y), -1);

  return {
    columns: Math.min(MAX_COLUMNS, Math.max(DEFAULT_COLUMNS, maxX + 2)),
    rows: Math.min(MAX_ROWS, Math.max(DEFAULT_ROWS, maxY + 2)),
  };
}

function sortSeats(seats: VisualizationSeat[]) {
  return [...seats].sort((left, right) => {
    if (left.y !== right.y) {
      return left.y - right.y;
    }
    return left.x - right.x;
  });
}

function cloneVisualizationSeats(seats: VisualizationSeat[]): VisualizationSeat[] {
  return seats.map((seat) =>
    createVisualizationSeat({
      seat_label: seat.seat_label,
      x: seat.x,
      y: seat.y,
      seat_type: seat.seat_type,
      student_identifier: seat.student_identifier,
      period_seat_id: null,
      assignment_id: null,
    }),
  );
}

export function SeatingChartEditor({
  replayWindow,
  replayWindows,
  onChangeSeats,
}: SeatingChartEditorProps) {
  const [selectedCell, setSelectedCell] = useState<GridCell>({ x: 0, y: 0 });
  const [selectedCellKeys, setSelectedCellKeys] = useState<string[]>(() => [cellKey(0, 0)]);
  const [gridSize, setGridSize] = useState({ columns: DEFAULT_COLUMNS, rows: DEFAULT_ROWS });
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const [dragSelection, setDragSelection] = useState<{
    anchor: GridCell;
    additive: boolean;
    baseSelection: string[];
  } | null>(null);
  const copyMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!replayWindow) {
      setSelectedCell({ x: 0, y: 0 });
      setSelectedCellKeys([cellKey(0, 0)]);
      setGridSize({ columns: DEFAULT_COLUMNS, rows: DEFAULT_ROWS });
      return;
    }

    setSelectedCell({ x: 0, y: 0 });
    setSelectedCellKeys([cellKey(0, 0)]);
    setGridSize(getInitialGridSize(replayWindow.seats));
    setIsCopyMenuOpen(false);
  }, [replayWindow?.id]);

  useEffect(() => {
    if (!dragSelection) {
      return undefined;
    }

    const stopDragSelection = () => {
      setDragSelection(null);
    };

    window.addEventListener("mouseup", stopDragSelection);
    return () => window.removeEventListener("mouseup", stopDragSelection);
  }, [dragSelection]);

  useEffect(() => {
    if (!isCopyMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!copyMenuRef.current?.contains(event.target as Node)) {
        setIsCopyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isCopyMenuOpen]);

  const seatMap = useMemo(() => {
    const map = new Map<string, VisualizationSeat>();
    if (!replayWindow) {
      return map;
    }

    replayWindow.seats.forEach((seat) => {
      map.set(`${seat.x}:${seat.y}`, seat);
    });
    return map;
  }, [replayWindow]);
  const selectedCellKeySet = useMemo(() => new Set(selectedCellKeys), [selectedCellKeys]);
  const selectedCellCount = selectedCellKeys.length;

  const selectedSeat = replayWindow
    ? seatMap.get(`${selectedCell.x}:${selectedCell.y}`) ?? null
    : null;
  const canEditStudentId = selectedCellCount === 1 && selectedSeat?.seat_type === "student";
  const copySourceRows = useMemo(
    () =>
      replayWindows.filter((row) => row.id !== replayWindow?.id && row.seats.length > 0),
    [replayWindow?.id, replayWindows],
  );

  const updateSeats = (updater: (previous: VisualizationSeat[]) => VisualizationSeat[]) => {
    if (!replayWindow) {
      return;
    }

    onChangeSeats(replayWindow.id, sortSeats(updater(replayWindow.seats)));
  };

  const getSelectedCells = (keys = selectedCellKeys): GridCell[] => {
    const next = keys
      .map(parseCellKey)
      .filter((cell): cell is GridCell => cell !== null);

    return next.length > 0 ? next : [selectedCell];
  };

  const updateRectangleSelection = (
    anchor: GridCell,
    target: GridCell,
    additive: boolean,
    baseSelection: string[],
  ) => {
    const rectangleKeys = buildRectangleSelection(anchor, target);
    const nextSelection = additive
      ? Array.from(new Set([...baseSelection, ...rectangleKeys]))
      : rectangleKeys;

    setSelectedCellKeys(nextSelection);
  };

  const clearSelectedSeats = useCallback(() => {
    if (!replayWindow) {
      return;
    }

    const targetCellKeys = new Set(
      getSelectedCells().map((cell) => cellKey(cell.x, cell.y)),
    );

    updateSeats((previous) =>
      previous.filter((seat) => !targetCellKeys.has(cellKey(seat.x, seat.y))),
    );
  }, [replayWindow, selectedCell, selectedCellKeys]);

  useEffect(() => {
    if (!replayWindow) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      clearSelectedSeats();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelectedSeats, replayWindow]);

  const handleCellMouseDown = (cell: GridCell, event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const additive = event.ctrlKey || event.metaKey;
    const baseSelection = additive ? selectedCellKeys : [];
    setSelectedCell(cell);
    setDragSelection({
      anchor: cell,
      additive,
      baseSelection,
    });
    updateRectangleSelection(cell, cell, additive, baseSelection);
  };

  const handleCellMouseEnter = (cell: GridCell) => {
    if (!dragSelection) {
      return;
    }

    setSelectedCell(cell);
    updateRectangleSelection(
      dragSelection.anchor,
      cell,
      dragSelection.additive,
      dragSelection.baseSelection,
    );
  };

  const setSelectedSeatType = (seatType: "student" | "teacher" | "clear") => {
    if (!replayWindow) {
      return;
    }

    const targetCells = seatType === "teacher" ? [selectedCell] : getSelectedCells();
    const targetCellKeys = new Set(targetCells.map((cell) => cellKey(cell.x, cell.y)));

    if (seatType === "clear") {
      clearSelectedSeats();
      return;
    }

    updateSeats((previous) => {
      const withoutSelected = previous.filter((seat) => !targetCellKeys.has(cellKey(seat.x, seat.y)));
      const nextSeats = seatType === "teacher"
        ? withoutSelected.filter((seat) => seat.seat_type !== "teacher")
        : withoutSelected;

      targetCells.forEach((cell) => {
        const existingSeat = previous.find((seat) => seat.x === cell.x && seat.y === cell.y);

        nextSeats.push(createVisualizationSeat({
          ...(existingSeat || {}),
          x: cell.x,
          y: cell.y,
          seat_type: seatType,
          seat_label: seatType === "teacher" ? "teacher" : `r${cell.y + 1}c${cell.x + 1}`,
          student_identifier:
            seatType === "student" && existingSeat?.seat_type === "student"
              ? existingSeat.student_identifier
              : "",
        }));
      });

      return nextSeats;
    });
  };

  const updateSelectedStudentIdentifier = (studentIdentifier: string) => {
    if (!replayWindow) {
      return;
    }

    const existingSeat = selectedSeat && selectedSeat.seat_type === "student"
      ? selectedSeat
      : createVisualizationSeat({
        x: selectedCell.x,
        y: selectedCell.y,
        seat_type: "student",
        seat_label: `r${selectedCell.y + 1}c${selectedCell.x + 1}`,
      });

    const nextSeat = createVisualizationSeat({
      ...existingSeat,
      seat_type: "student",
      student_identifier: studentIdentifier,
    });

    updateSeats((previous) => [
      ...previous.filter((seat) => seat.x !== selectedCell.x || seat.y !== selectedCell.y),
      nextSeat,
    ]);
  };

  const copySeatsFromReplayWindow = (sourceRowId: string) => {
    const sourceRow = copySourceRows.find((row) => row.id === sourceRowId);
    if (!replayWindow || !sourceRow) {
      return;
    }

    const clonedSeats = cloneVisualizationSeats(sourceRow.seats);
    onChangeSeats(replayWindow.id, sortSeats(clonedSeats));
    setGridSize(getInitialGridSize(clonedSeats));
    setSelectedCell({ x: 0, y: 0 });
    setSelectedCellKeys([cellKey(0, 0)]);
    setDragSelection(null);
    setIsCopyMenuOpen(false);
  };

  const updateGridSize = (axis: "columns" | "rows", direction: "increase" | "decrease") => {
    const delta = direction === "increase" ? 1 : -1;

    setGridSize((previous) => {
      const nextValue = axis === "columns"
        ? Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, previous.columns + delta))
        : Math.min(MAX_ROWS, Math.max(MIN_ROWS, previous.rows + delta));

      if (nextValue === previous[axis]) {
        return previous;
      }

      if (replayWindow && direction === "decrease") {
        const maxX = axis === "columns" ? nextValue - 1 : previous.columns - 1;
        const maxY = axis === "rows" ? nextValue - 1 : previous.rows - 1;

        onChangeSeats(
          replayWindow.id,
          sortSeats(replayWindow.seats.filter((seat) => seat.x <= maxX && seat.y <= maxY)),
        );

        const clampedCell = {
          x: Math.min(selectedCell.x, maxX),
          y: Math.min(selectedCell.y, maxY),
        };
        setSelectedCell(clampedCell);
        setSelectedCellKeys((current) => {
          const filtered = current.filter((key) => {
            const cell = parseCellKey(key);
            return cell !== null && cell.x <= maxX && cell.y <= maxY;
          });

          return filtered.length > 0 ? filtered : [cellKey(clampedCell.x, clampedCell.y)];
        });
      }

      return {
        ...previous,
        [axis]: nextValue,
      };
    });
  };

  if (!replayWindow) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-[rgba(148,163,184,0.28)] bg-[rgba(247,250,252,0.92)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
        Add a replay window first, then define its seating chart here.
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--brand-navy)]">Seating chart editor</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Click a cell to place a student seat or the teacher desk for {replayWindow.date} period {replayWindow.period}.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-auto" ref={copyMenuRef}>
            <button
              type="button"
              className="observation-inline-button observation-inline-button--compact w-full justify-center sm:w-auto"
              onClick={() => setIsCopyMenuOpen((current) => !current)}
              disabled={copySourceRows.length === 0}
              title={
                copySourceRows.length === 0
                  ? "Add a seating chart to another replay window first."
                  : "Copy a seating chart from another replay window"
              }
            >
              <Copy className="h-4 w-4" />
              Copy chart
            </button>

            {isCopyMenuOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-[1rem] border border-[rgba(148,163,184,0.2)] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:left-auto sm:right-0 sm:w-[18rem]">
                <div className="px-2 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Copy from
                </div>
                <div className="space-y-1">
                  {copySourceRows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="flex w-full items-start justify-between rounded-[0.85rem] px-3 py-2 text-left text-sm text-[var(--brand-navy)] transition hover:bg-[rgba(240,249,255,0.98)]"
                      onClick={() => copySeatsFromReplayWindow(row.id)}
                    >
                      <span className="font-semibold">
                        {row.date || "No date"}{row.period ? `, period ${row.period}` : ""}
                      </span>
                      <span className="ml-3 shrink-0 text-xs font-medium text-[var(--text-muted)]">
                        {row.seats.length} seats
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="observation-inline-button observation-inline-button--danger observation-inline-button--compact w-full justify-center sm:w-auto"
            onClick={() => onChangeSeats(replayWindow.id, [])}
          >
            <Trash2 className="h-4 w-4" />
            Clear chart
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-3 py-2 text-sm text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--brand-navy)]">Columns</span>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(148,163,184,0.24)] bg-white text-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => updateGridSize("columns", "decrease")}
              aria-label="Remove column"
              disabled={gridSize.columns <= MIN_COLUMNS}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center font-semibold text-[var(--brand-navy)]">{gridSize.columns}</span>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(148,163,184,0.24)] bg-white text-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => updateGridSize("columns", "increase")}
              aria-label="Add column"
              disabled={gridSize.columns >= MAX_COLUMNS}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-3 py-2 text-sm text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--brand-navy)]">Rows</span>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(148,163,184,0.24)] bg-white text-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => updateGridSize("rows", "decrease")}
              aria-label="Remove row"
              disabled={gridSize.rows <= MIN_ROWS}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center font-semibold text-[var(--brand-navy)]">{gridSize.rows}</span>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(148,163,184,0.24)] bg-white text-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => updateGridSize("rows", "increase")}
              aria-label="Add row"
              disabled={gridSize.rows >= MAX_ROWS}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_12.5rem] xl:gap-5">
          <div className="overflow-auto pb-1">
            <div
              className="grid w-max gap-2 rounded-[1.25rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] p-3"
              style={{ gridTemplateColumns: `repeat(${gridSize.columns}, ${GRID_CELL_SIZE}px)` }}
            >
              {Array.from({ length: gridSize.rows }).flatMap((_, y) =>
                Array.from({ length: gridSize.columns }).map((_, x) => {
                  const isSelected = selectedCellKeySet.has(cellKey(x, y));
                  const isPrimarySelected = selectedCell.x === x && selectedCell.y === y;
                  const seat = seatMap.get(`${x}:${y}`) ?? null;
                  const isTeacher = seat?.seat_type === "teacher";
                  const isStudent = seat?.seat_type === "student";
                  const seatLabel = isTeacher ? "Teacher" : isStudent ? "Seat" : "";

                  return (
                    <button
                      key={`${x}:${y}`}
                      type="button"
                      className={`flex items-center justify-center rounded-[1rem] border px-1.5 text-center transition ${
                        isSelected
                          ? isPrimarySelected
                            ? "border-[var(--accent-color-deep)] bg-[rgba(224,242,254,0.98)] shadow-[0_0_0_2px_rgba(35,171,248,0.14)]"
                            : "border-[rgba(35,171,248,0.42)] bg-[rgba(240,249,255,0.98)] shadow-[0_0_0_1px_rgba(35,171,248,0.1)]"
                          : "border-[rgba(148,163,184,0.18)] bg-white hover:border-[rgba(35,171,248,0.28)] hover:bg-[rgba(248,250,252,0.98)]"
                      } ${isTeacher ? "text-[#92400e]" : isStudent ? "text-[var(--brand-navy)]" : "text-[var(--text-muted)]"}`}
                      onMouseDown={(event) => handleCellMouseDown({ x, y }, event)}
                      onMouseEnter={() => handleCellMouseEnter({ x, y })}
                      onMouseUp={() => setDragSelection(null)}
                      style={{ width: GRID_CELL_SIZE, height: GRID_CELL_SIZE }}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        {seatLabel ? (
                          <span className={`text-[0.62rem] font-semibold uppercase tracking-[0.1em] ${isTeacher ? "text-[#b45309]" : "text-[var(--text-muted)]"}`}>
                            {seatLabel}
                          </span>
                        ) : null}
                        <span className="line-clamp-2 px-1 text-[0.72rem] font-semibold leading-tight">
                          {isTeacher
                            ? "Desk"
                            : isStudent
                              ? seat?.student_identifier || "EMPTY"
                              : ""}
                        </span>
                      </div>
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          <div className="h-fit w-full self-start rounded-[1.25rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] p-4 xl:max-w-[12.5rem]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {selectedCellCount > 1 ? "Selected seats" : "Selected cell"}
            </div>
            <div className="mt-2 text-sm font-semibold text-[var(--brand-navy)]">
              {selectedCellCount > 1
                ? `${selectedCellCount} seats selected`
                : `Column ${selectedCell.x + 1}, Row ${selectedCell.y + 1}`}
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                className={`flex w-full items-center justify-center rounded-[0.9rem] border px-3 py-2 text-sm font-semibold transition ${
                  selectedSeat?.seat_type === "student"
                    ? "border-[var(--accent-color-deep)] bg-[rgba(224,242,254,0.96)] text-[var(--accent-color-deep)]"
                    : "border-[rgba(148,163,184,0.22)] bg-white text-[var(--brand-navy)]"
                }`}
                onClick={() => setSelectedSeatType("student")}
              >
                Student seat
              </button>
              <button
                type="button"
                className={`flex w-full items-center justify-center rounded-[0.9rem] border px-3 py-2 text-sm font-semibold transition ${
                  selectedSeat?.seat_type === "teacher"
                    ? "border-[#f59e0b] bg-[rgba(254,243,199,0.96)] text-[#92400e]"
                    : "border-[rgba(148,163,184,0.22)] bg-white text-[var(--brand-navy)]"
                }`}
                onClick={() => setSelectedSeatType("teacher")}
              >
                Teacher desk
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-[0.9rem] border border-[rgba(248,113,113,0.22)] bg-white px-3 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[rgba(254,242,242,0.98)]"
                onClick={() => setSelectedSeatType("clear")}
              >
                Clear cell
              </button>
            </div>

            {canEditStudentId ? (
              <div className="mt-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Student ID
                  </span>
                  <input
                    type="text"
                    className="min-h-[2.75rem] w-full rounded-[1rem] border border-[rgba(148,163,184,0.26)] bg-white px-3 py-2 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--accent-color-deep)] focus:ring-2 focus:ring-[rgba(35,171,248,0.16)]"
                    placeholder="11"
                    value={selectedSeat?.student_identifier ?? ""}
                    onChange={(event) => updateSelectedStudentIdentifier(event.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
