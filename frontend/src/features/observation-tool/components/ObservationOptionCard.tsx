import type { LucideIcon } from "lucide-react";

interface ObservationOptionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  tone: "cyan" | "green" | "yellow" | "blue";
}

export default function ObservationOptionCard({
  icon: Icon,
  title,
  description,
  onClick,
  tone,
}: ObservationOptionCardProps) {
  return (
    <button type="button" className="observation-option-card" onClick={onClick}>
      <span className={`observation-option-icon observation-option-icon--${tone}`}>
        <Icon className="h-7 w-7" />
      </span>
      <span className="observation-option-copy-block">
        <span className="observation-option-title">{title}</span>
        <span className="observation-option-copy">{description}</span>
      </span>
    </button>
  );
}
