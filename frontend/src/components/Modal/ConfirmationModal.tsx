interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "default",
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="observation-modal-overlay">
      <div className="observation-modal">
        <h2 className="observation-modal-title">{title}</h2>
        <p className="observation-modal-copy">{message}</p>

        <div className="observation-modal-actions">
          <button type="button" onClick={onClose} className="observation-button observation-button--secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={confirmTone === "danger" ? "observation-button observation-button--danger" : "observation-button observation-button--accent"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
