// Compact upload control used for CSV and other file-based inputs.
import { useId, useRef, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { InfoTip } from "./InfoTip";

type UploadChipProps = {
    title: string;
    tip: string;
    selectedFileName: string | null;
    onFileSelect: (file: File) => void;
    tipAlign?: "left" | "center" | "right";
};

export function UploadChip({
    title,
    tip,
    selectedFileName,
    onFileSelect,
    tipAlign = "center",
}: UploadChipProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const inputId = useId();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onFileSelect(file);
        event.target.value = "";
    };

    return (
        <div className="chip">
            <div className="chip-inner">
                <span className="chip-title-row">
                    <span className="chip-title">{title}</span>
                    <InfoTip content={tip} label={`Explain ${title}`} align={tipAlign} />
                </span>

                <input
                    id={inputId}
                    ref={inputRef}
                    className="file-input-hidden"
                    type="file"
                    accept=".csv"
                    onChange={handleChange}
                />
                <button
                    type="button"
                    className="file-trigger"
                    onClick={() => inputRef.current?.click()}
                    aria-controls={inputId}
                >
                    <Upload size={14} strokeWidth={2} aria-hidden="true" />
                    <span>Select</span>
                </button>
                <span
                    className={selectedFileName ? "chip-file-name" : "chip-file-name chip-file-placeholder"}
                    title={selectedFileName ?? "No file selected"}
                >
                    {selectedFileName ?? "No file selected"}
                </span>
            </div>
        </div>
    );
}
