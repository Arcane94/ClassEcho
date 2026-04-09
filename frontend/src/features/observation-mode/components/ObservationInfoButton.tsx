// Small inline help button that opens contextual guidance next to a label.
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface ObservationInfoButtonProps {
  content: string;
  label: string;
  align?: "start" | "end";
}

export default function ObservationInfoButton({
  content,
  label,
  align = "start",
}: ObservationInfoButtonProps) {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleTooltipOpen = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail !== tooltipId) {
        setIsOpen(false);
      }
    };

    document.addEventListener("observation-info-open", handleTooltipOpen as EventListener);

    return () => {
      document.removeEventListener("observation-info-open", handleTooltipOpen as EventListener);
    };
  }, [tooltipId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`observation-info-shell observation-info-shell--${align}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="observation-info-button"
        aria-label={label}
        aria-expanded={isOpen}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen((previous) => {
            const nextValue = !previous;
            if (nextValue) {
              document.dispatchEvent(new CustomEvent("observation-info-open", { detail: tooltipId }));
            }
            return nextValue;
          });
        }}
      >
        <span className="observation-info-glyph" aria-hidden="true">i</span>
      </button>

      {isOpen && (
        <div
          className={`observation-info-popover observation-info-popover--${align}`}
          role="note"
        >
          <button
            type="button"
            className="observation-info-close"
            aria-label={`Close ${label}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X className="observation-info-close-icon" />
          </button>
          <p className="observation-info-popover-copy">{content}</p>
        </div>
      )}
    </div>
  );
}
