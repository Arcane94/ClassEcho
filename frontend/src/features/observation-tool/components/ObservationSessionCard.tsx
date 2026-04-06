import { CalendarDays, Hash, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { SessionData } from "@/services/fetchSessionById";
import { formatToMonthDayHourMinute } from "@/utils/formatToMonthDayHourMinute";

interface ObservationSessionCardProps {
  session: SessionData;
  contextLabel: string;
  actions?: ReactNode;
}

function getDisplayTime(session: SessionData) {
  const rawTime = session.local_time || session.server_time;

  if (!rawTime) {
    return "Time unavailable";
  }

  try {
    return formatToMonthDayHourMinute(rawTime);
  } catch {
    return rawTime;
  }
}

export default function ObservationSessionCard({
  session,
  contextLabel,
  actions,
}: ObservationSessionCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const sessionTitle = session.lesson_name || "Untitled Session";
  const teacherName = session.teacher_name || "Teacher not set";
  const description = session.lesson_description?.trim() || "No description provided for this session yet.";
  const canToggleDescription = Boolean(session.lesson_description?.trim() && description.length > 120);

  return (
    <article className="observation-session-card">
      <div className="observation-session-card-main">
        <div className="observation-session-card-top">
          <div className="observation-session-card-heading">
            <span className="observation-session-card-kicker">{contextLabel}</span>
            <h2 className="observation-session-card-title">{sessionTitle}</h2>
          </div>
        </div>

        <div className="observation-session-card-meta">
          <span className="observation-session-meta-pill">
            <UserRound className="h-3.5 w-3.5" />
            {teacherName}
          </span>
          <span className="observation-session-meta-pill">
            <CalendarDays className="h-3.5 w-3.5" />
            {getDisplayTime(session)}
          </span>
          {session.join_code && (
            <span className="observation-session-meta-pill observation-session-meta-pill--code">
              <Hash className="h-3.5 w-3.5" />
              {session.join_code}
            </span>
          )}
        </div>

        <div className="observation-session-card-description-block">
          <p
            className={`observation-session-card-description${
              canToggleDescription && !isDescriptionExpanded ? " observation-session-card-description--clamped" : ""
            }`}
          >
            {description}
          </p>
          {canToggleDescription && (
            <button
              type="button"
              className="observation-session-card-description-toggle"
              onClick={() => setIsDescriptionExpanded((current) => !current)}
            >
              {isDescriptionExpanded ? "See less" : "See more"}
            </button>
          )}
        </div>
      </div>

      {actions ? <div className="observation-session-card-actions">{actions}</div> : null}
    </article>
  );
}
