import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import ObservationInfoButton from "@/features/observation-tool/components/ObservationInfoButton";

interface ObservationSelectableTagSectionProps {
  title: string;
  subtitle?: string;
  tags: string[];
  isActive: (tag: string) => boolean;
  onToggle: (tag: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  activeTone?: "teacher" | "student";
  renderTagContent?: (tag: string, index: number) => ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export default function ObservationSelectableTagSection({
  title,
  subtitle,
  tags,
  isActive,
  onToggle,
  onAdd,
  addLabel = "Add tag",
  activeTone = "teacher",
  renderTagContent,
  collapsible = false,
  defaultOpen = true,
}: ObservationSelectableTagSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const selectedCount = tags.reduce((count, tag) => count + (isActive(tag) ? 1 : 0), 0);
  const toggleOpen = () => setIsOpen((previous) => !previous);
  const handleToggleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleOpen();
    }
  };

  return (
    <section className={`observation-section-card${collapsible ? " observation-section-card--collapsible" : ""}`}>
      {collapsible ? (
        <div className="observation-section-toggle">
          <div
            className="observation-section-toggle-copy"
            role="button"
            tabIndex={0}
            onClick={toggleOpen}
            onKeyDown={handleToggleKeyDown}
            aria-expanded={isOpen}
          >
            <div className="observation-section-title-row">
              <h2 className="observation-section-title">{title}</h2>
              {subtitle && <ObservationInfoButton content={subtitle} label={`About ${title}`} />}
            </div>
          </div>

          <div className="observation-section-toggle-meta">
            {selectedCount > 0 && <span className="observation-section-count">{selectedCount} selected</span>}
            <button
              type="button"
              className="observation-section-collapse-button"
              onClick={toggleOpen}
              aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
              aria-expanded={isOpen}
            >
              <span className="observation-section-toggle-icon-shell" aria-hidden="true">
                {isOpen ? (
                  <ChevronUp className="observation-section-toggle-icon" />
                ) : (
                  <ChevronDown className="observation-section-toggle-icon" />
                )}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="observation-section-header">
          <div className="observation-section-title-row">
            <h2 className="observation-section-title">{title}</h2>
            {subtitle && <ObservationInfoButton content={subtitle} label={`About ${title}`} />}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="observation-chip-wrap">
          {tags.map((tag, index) => {
            const active = isActive(tag);
            const activeClassName =
              activeTone === "student"
                ? "observation-chip observation-chip--student-active"
                : "observation-chip observation-chip--active";

            return (
              <button
                key={`${title}-${tag}-${index}`}
                type="button"
                className={active ? activeClassName : "observation-chip"}
                onClick={() => onToggle(tag)}
              >
                {renderTagContent ? renderTagContent(tag, index) : tag}
              </button>
            );
          })}

          {onAdd && (
            <button
              type="button"
              className="observation-chip observation-chip--add"
              onClick={onAdd}
              aria-label={`${addLabel} in ${title}`}
            >
              <Plus className="h-4 w-4" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
