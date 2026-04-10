// Section editor for adding, removing, and reorganizing tags tied to a session.
import { Plus, RotateCcw, Trash2, X } from "lucide-react";

import ObservationInfoButton from "@/features/observation-mode/components/ObservationInfoButton";

interface ObservationTagEditorSectionProps {
  title: string;
  subtitle?: string;
  tags: string[];
  tone?: "cyan" | "green" | "yellow" | "blue" | "rose";
  onAdd: () => void;
  addLabel?: string;
  onResetToDefault?: () => void;
  resetLabel?: string;
  onClearTags?: () => void;
  clearLabel?: string;
  onRemove: (tag: string) => void;
  onEdit?: (tag: string) => void;
  infoText?: string;
}

export default function ObservationTagEditorSection({
  title,
  subtitle,
  tags,
  tone = "cyan",
  onAdd,
  addLabel = "Add tag",
  onResetToDefault,
  resetLabel = "Reset",
  onClearTags,
  clearLabel = "Clear",
  onRemove,
  onEdit,
  infoText,
}: ObservationTagEditorSectionProps) {
  const secondaryAction = onClearTags
    ? {
        label: clearLabel,
        onClick: onClearTags,
        icon: Trash2,
      }
    : onResetToDefault
      ? {
          label: resetLabel,
          onClick: onResetToDefault,
          icon: RotateCcw,
        }
      : null;
  const SecondaryActionIcon = secondaryAction?.icon ?? RotateCcw;

  return (
    <section className="observation-editor-section">
      <div className="observation-editor-section-header">
        <div>
          <div className="observation-section-title-row">
            <h2 className="observation-editor-section-title">{title}</h2>
            {infoText && <ObservationInfoButton content={infoText} label={`About ${title}`} />}
            <button
              type="button"
              className="observation-inline-button observation-inline-button--add observation-inline-button--add-inline"
              onClick={onAdd}
              aria-label={`${addLabel} in ${title}`}
            >
              <Plus className="h-4 w-4" />
              {addLabel}
            </button>
            {secondaryAction && (
              <button
                type="button"
                className="observation-inline-button observation-inline-button--reset-inline"
                onClick={secondaryAction.onClick}
                aria-label={`${secondaryAction.label} for ${title}`}
              >
                <SecondaryActionIcon className="h-4 w-4" />
                {secondaryAction.label}
              </button>
            )}
          </div>
          {subtitle && <p className="observation-editor-section-copy">{subtitle}</p>}
        </div>
      </div>

      <div className="observation-chip-wrap">
        {tags.length === 0 && <p className="observation-empty-inline">No tags added yet.</p>}

        {tags.map((tag) => {
          const isLongTag = tag.length > 48;

          return (
            <div
              key={tag}
              className={`observation-editor-chip observation-editor-chip--${tone}${isLongTag ? " observation-editor-chip--long" : ""}`}
            >
            {onEdit ? (
              <button
                type="button"
                className={`observation-editor-chip-label${isLongTag ? " observation-editor-chip-label--long" : ""}`}
                onClick={() => onEdit(tag)}
                title={tag}
              >
                {tag}
              </button>
            ) : (
              <span
                className={`observation-editor-chip-label${isLongTag ? " observation-editor-chip-label--long" : ""}`}
                title={tag}
              >
                {tag}
              </span>
            )}

            <button
              type="button"
              className="observation-editor-chip-remove"
              onClick={() => onRemove(tag)}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-4 w-4" />
            </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
