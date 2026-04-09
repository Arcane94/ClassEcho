// Section editor for adding, removing, and reorganizing tags tied to a session.
import { Plus, RotateCcw, X } from "lucide-react";

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
  onRemove,
  onEdit,
  infoText,
}: ObservationTagEditorSectionProps) {
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
            {onResetToDefault && (
              <button
                type="button"
                className="observation-inline-button observation-inline-button--reset-inline"
                onClick={onResetToDefault}
                aria-label={`${resetLabel} for ${title}`}
              >
                <RotateCcw className="h-4 w-4" />
                {resetLabel}
              </button>
            )}
          </div>
          {subtitle && <p className="observation-editor-section-copy">{subtitle}</p>}
        </div>
      </div>

      <div className="observation-chip-wrap">
        {tags.length === 0 && <p className="observation-empty-inline">No tags added yet.</p>}

        {tags.map((tag) => (
          <div key={tag} className={`observation-editor-chip observation-editor-chip--${tone}`}>
            {onEdit ? (
              <button type="button" className="observation-editor-chip-label" onClick={() => onEdit(tag)}>
                {tag}
              </button>
            ) : (
              <span className="observation-editor-chip-label">{tag}</span>
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
        ))}
      </div>
    </section>
  );
}

