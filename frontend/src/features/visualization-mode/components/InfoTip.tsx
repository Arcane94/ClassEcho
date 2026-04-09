// Shared tooltip button and popover used across the visualization screens.
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

type InfoTipProps = {
    content: ReactNode;
    label?: string;
    align?: "left" | "center" | "right";
    side?: "top" | "bottom";
};

export function InfoTip({
                            content,
                            label = "Show help",
                            align = "center",
                            side = "bottom",
                        }: InfoTipProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLSpanElement | null>(null);
    const tipId = useId();

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <span className="info-tip-shell" ref={rootRef}>
      <button
          type="button"
          className="info-tip-btn"
          aria-label={label}
          aria-expanded={open}
          aria-describedby={open ? tipId : undefined}
          onClick={() => setOpen((v) => !v)}
      >
        <Info size={14} strokeWidth={2.2} aria-hidden="true" />
      </button>
            {open && (
                <span
                    id={tipId}
                    role="tooltip"
                    className={`info-tip-popover info-tip-popover-${side} info-tip-popover-${align}`}
                >
          {content}
        </span>
            )}
    </span>
    );
}
