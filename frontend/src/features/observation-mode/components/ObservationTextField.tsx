// Shared labeled text field used by observation-mode forms and dialogs.
import { useId, type ChangeEventHandler } from "react";
import ObservationInfoButton from "@/features/observation-mode/components/ObservationInfoButton";

interface ObservationTextFieldProps {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  required?: boolean;
  helperText?: string;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
  maxLength?: number;
  className?: string;
  infoText?: string;
}

export default function ObservationTextField({
  label,
  value,
  onChange,
  required = false,
  helperText,
  error,
  placeholder,
  multiline = false,
  rows = 4,
  type = "text",
  maxLength,
  className = "",
  infoText,
}: ObservationTextFieldProps) {
  const fieldId = useId();

  return (
    <div className={`observation-field ${className}`.trim()}>
      <span className="observation-field-label-row">
        <label className="observation-field-label" htmlFor={fieldId}>
          {label}
          {required && <span className="observation-field-required"> *</span>}
        </label>
        {infoText && <ObservationInfoButton content={infoText} label={`About ${label}`} />}
      </span>
      {multiline ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          required={required}
          aria-invalid={Boolean(error)}
          className="observation-field-input observation-field-textarea"
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-invalid={Boolean(error)}
          className="observation-field-input"
        />
      )}
      {error ? (
        <span className="observation-field-helper observation-field-helper--error">{error}</span>
      ) : helperText ? (
        <span className="observation-field-helper">{helperText}</span>
      ) : null}
    </div>
  );
}

