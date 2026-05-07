import { useMemo, useState } from "react";

interface TextEntryModalProps {
  onClose: () => void;
  onSubmit: (value: string) => void;
  modalHeader: string;
  modalCopy: string;
  fieldLabel: string;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  validate?: (value: string) => string;
}

export default function TextEntryModal({
  onClose,
  onSubmit,
  modalHeader,
  modalCopy,
  fieldLabel,
  placeholder = "",
  submitLabel = "Apply",
  initialValue = "",
  validate,
}: TextEntryModalProps) {
  const [value, setValue] = useState(initialValue);
  const normalizedValue = value.trim();
  const validationError = useMemo(
    () => (normalizedValue ? validate?.(normalizedValue) ?? "" : ""),
    [normalizedValue, validate],
  );
  const canSubmit = Boolean(normalizedValue) && !validationError;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit(normalizedValue);
    onClose();
  };

  return (
    <div className="observation-modal-overlay">
      <div className="observation-modal">
        <h2 className="observation-modal-title">{modalHeader}</h2>
        <p className="observation-modal-copy">{modalCopy}</p>

        <div style={{ marginTop: "1rem" }}>
          <label className="observation-field">
            <span className="observation-field-label">{fieldLabel}</span>
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              className="observation-field-input"
              autoFocus
            />
            {validationError && <span className="observation-field-helper observation-field-helper--error">{validationError}</span>}
          </label>
        </div>

        <div className="observation-modal-actions">
          <button type="button" onClick={onClose} className="observation-button observation-button--secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="observation-button observation-button--accent" disabled={!canSubmit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
