import { useState } from "react";

interface AddTagProps {
  onClose: () => void;
  onAddTag: (key: string, value: string) => void;
  modalHeader: string;
  tagSection: string;
}

export default function AddTagModal({ onClose, tagSection, onAddTag, modalHeader }: AddTagProps) {
  const [tagName, setTagName] = useState("");

  const handleSubmit = () => {
    if (tagName.trim() !== "") {
      onAddTag(tagSection, tagName.trim());
      setTagName("");
    }

    onClose();
  };

  return (
    <div className="observation-modal-overlay">
      <div className="observation-modal">
        <h2 className="observation-modal-title">{modalHeader}</h2>
        <p className="observation-modal-copy">Add a tag for this session.</p>

        <div style={{ marginTop: "1rem" }}>
          <label className="observation-field">
            <span className="observation-field-label">Tag Name</span>
            <input
              type="text"
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="Enter tag text"
              className="observation-field-input"
              autoFocus
            />
          </label>
        </div>

        <div className="observation-modal-actions">
          <button type="button" onClick={onClose} className="observation-button observation-button--secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="observation-button observation-button--accent">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
