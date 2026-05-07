// Section editor for adding, removing, and reorganizing tags tied to a session.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";

import ObservationInfoButton from "@/features/observation-mode/components/ObservationInfoButton";

interface ObservationTagEditorSectionProps {
  title: string;
  subtitle?: string;
  tags: string[];
  tone?: "cyan" | "green" | "yellow" | "blue" | "rose";
  titleError?: string;
  onTitleChange?: (value: string) => void;
  onAdd: () => void;
  addLabel?: string;
  onResetToDefault?: () => void;
  resetLabel?: string;
  onClearTags?: () => void;
  clearLabel?: string;
  onRemove: (tag: string) => void;
  onEdit?: (tag: string) => void;
  onDeleteSection?: () => void;
  deleteSectionLabel?: string;
  infoText?: string;
}

export default function ObservationTagEditorSection({
  title,
  subtitle,
  tags,
  tone = "cyan",
  titleError,
  onTitleChange,
  onAdd,
  addLabel = "Add tag",
  onResetToDefault,
  resetLabel = "Reset",
  onClearTags,
  clearLabel = "Clear",
  onRemove,
  onEdit,
  onDeleteSection,
  deleteSectionLabel = "Delete",
  infoText,
}: ObservationTagEditorSectionProps) {
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const titleMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInputWidth, setTitleInputWidth] = useState<number>();
  const measuredTitle = title || "Category name";

  useLayoutEffect(() => {
    if (!onTitleChange || !isEditingTitle || !titleMeasureRef.current) {
      return;
    }

    setTitleInputWidth(Math.ceil(titleMeasureRef.current.getBoundingClientRect().width) + 2);
  }, [isEditingTitle, measuredTitle, onTitleChange]);

  useEffect(() => {
    if (!isEditingTitle || !titleInputRef.current) {
      return;
    }

    titleInputRef.current.focus();
    const cursorIndex = title.length;
    titleInputRef.current.setSelectionRange(cursorIndex, cursorIndex);
  }, [isEditingTitle, title]);

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
        <div className="observation-editor-section-header-main">
          <div className="observation-section-title-row">
            {onTitleChange ? (
              <>
                {isEditingTitle ? (
                  <div className="observation-editor-section-title-input-shell">
                    <span
                      ref={titleMeasureRef}
                      className="observation-editor-section-title-measure"
                      aria-hidden="true"
                    >
                      {measuredTitle}
                    </span>
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={title}
                      onChange={(event) => onTitleChange(event.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === "Escape") {
                          setIsEditingTitle(false);
                        }
                      }}
                      className="observation-editor-section-title-input"
                      aria-label="Category name"
                      aria-invalid={Boolean(titleError)}
                      placeholder="Category name"
                      style={titleInputWidth ? { width: `${titleInputWidth}px` } : undefined}
                    />
                  </div>
                ) : (
                  <h2 className={`observation-editor-section-title${title.trim() ? "" : " observation-editor-section-title--placeholder"}`}>
                    {title.trim() || "Untitled category"}
                  </h2>
                )}
                <button
                  type="button"
                  className="observation-section-title-edit-button"
                  onClick={() => setIsEditingTitle(true)}
                  aria-label={`Edit ${title.trim() || "category"} name`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <h2 className="observation-editor-section-title">{title}</h2>
            )}
            {infoText && <ObservationInfoButton content={infoText} label={`About ${title}`} />}
          </div>
          {subtitle && <p className="observation-editor-section-copy">{subtitle}</p>}
          {titleError && <p className="observation-field-helper observation-field-helper--error">{titleError}</p>}
        </div>

        {onDeleteSection && (
          <button
            type="button"
            className="observation-inline-button observation-inline-button--reset-inline observation-inline-button--danger observation-inline-button--delete-corner"
            onClick={onDeleteSection}
            aria-label={`${deleteSectionLabel} ${title}`}
          >
            <Trash2 className="h-4 w-4" />
            <span className="observation-inline-button-label observation-inline-button-label--hide-mobile">{deleteSectionLabel}</span>
          </button>
        )}
      </div>

      <div className="observation-editor-section-actions">
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
