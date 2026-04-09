// Fetches the code snapshot URL chain used by the embedded Snap viewer.
import { API_BASE_URL } from "@/config";

type FetchVisualizationCodeUrlsParams = {
  sessionId: string | number;
  userId?: string | number | null;
  students: string[];
  prefix: string;
  start: string;
  end: string;
};

export async function fetchVisualizationCodeUrls({
  sessionId,
  userId,
  students,
  prefix,
  start,
  end,
}: FetchVisualizationCodeUrlsParams) {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const queryString = new URLSearchParams({
    session_id: String(sessionId),
    user_id: String(resolvedUserId ?? ""),
    students: students.join(","),
    prefix,
    start,
    end,
    onlySnapshots: "1",
  });

  const response = await fetch(
    `${API_BASE_URL}/visualization/code-urls?${queryString.toString()}`,
    { cache: "no-store" },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? "Failed to fetch code snapshots");
  }

  return data;
}
