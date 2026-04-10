// Shared tooltip button and popover used across the visualization screens.
import { type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLSpanElement | null>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const tipId = useId();

    const updatePosition = useCallback(() => {
        if (!buttonRef.current || !popoverRef.current) {
            return;
        }

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const gutter = 12;
        const gap = 8;

        let left = buttonRect.left;
        if (align === "center") {
            left = buttonRect.left + (buttonRect.width - popoverRect.width) / 2;
        } else if (align === "right") {
            left = buttonRect.right - popoverRect.width;
        }
        left = Math.min(Math.max(left, gutter), viewportWidth - popoverRect.width - gutter);

        let top = side === "top"
            ? buttonRect.top - popoverRect.height - gap
            : buttonRect.bottom + gap;
        if (side === "top" && top < gutter) {
            top = Math.min(buttonRect.bottom + gap, viewportHeight - popoverRect.height - gutter);
        }
        if (side === "bottom" && top + popoverRect.height > viewportHeight - gutter) {
            top = Math.max(gutter, buttonRect.top - popoverRect.height - gap);
        }

        setPosition({ top, left });
    }, [align, side]);

    useLayoutEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }

        updatePosition();
    }, [open, content, updatePosition]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
                setOpen(false);
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        const onViewportChange = () => {
            updatePosition();
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", onViewportChange);
        window.addEventListener("scroll", onViewportChange, true);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("resize", onViewportChange);
            window.removeEventListener("scroll", onViewportChange, true);
        };
    }, [open, updatePosition]);

    return (
        <span className={`info-tip-shell${open ? " info-tip-shell--open" : ""}`} ref={rootRef}>
      <button
          ref={buttonRef}
          type="button"
          className="info-tip-btn"
          aria-label={label}
          aria-expanded={open}
          aria-describedby={open ? tipId : undefined}
          onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
          }}
          onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((v) => !v);
          }}
      >
        <Info size={11} strokeWidth={2.2} aria-hidden="true" />
      </button>
            {open && typeof document !== "undefined"
                ? createPortal(
                    <span
                        ref={popoverRef}
                        id={tipId}
                        role="tooltip"
                        className="info-tip-popover"
                        style={{
                            position: "fixed",
                            top: position?.top ?? -9999,
                            left: position?.left ?? -9999,
                        }}
                    >
                        {content}
                    </span>,
                    document.body,
                )
                : null}
    </span>
    );
}
