// Fetches emoji reaction intervals for the visualization timeline.
import { API_BASE_URL } from "@/config";

type FetchVisualizationEmojiReactionsParams = {
  sessionId: string | number;
  userId?: string | number | null;
  students: string[];
  prefix: string;
  start: string;
  end: string;
};

export async function fetchVisualizationEmojiReactions({
  sessionId,
  userId,
  students,
  prefix,
  start,
  end,
}: FetchVisualizationEmojiReactionsParams) {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const queryString = new URLSearchParams({
    session_id: String(sessionId),
    user_id: String(resolvedUserId ?? ""),
    students: students.join(","),
    prefix,
    start,
    end,
  });

  const response = await fetch(
    `${API_BASE_URL}/visualization/emoji-reactions?${queryString.toString()}`,
    { cache: "no-store" },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? "Failed to fetch emoji reactions");
  }

  return data;
}
