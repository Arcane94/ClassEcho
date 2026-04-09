// Fetches a single Snap code snapshot for a given replay point.
import { API_BASE_URL } from "@/config";

type FetchVisualizationCodeSnapshotParams = {
  sessionId: string | number;
  userId?: string | number | null;
  rowId: number;
};

export type VisualizationCodeSnapshot = {
  rowId: number;
  serverTime: string;
  projectID: string;
  assignmentID: string;
  userID: string;
  code: string;
  spriteName: string | null;
};

export async function fetchVisualizationCodeSnapshot({
  sessionId,
  userId,
  rowId,
}: FetchVisualizationCodeSnapshotParams): Promise<VisualizationCodeSnapshot | null> {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const queryString = new URLSearchParams({
    session_id: String(sessionId),
    user_id: String(resolvedUserId ?? ""),
    rowId: String(rowId),
  });

  const response = await fetch(
    `${API_BASE_URL}/visualization/code-snapshot?${queryString.toString()}`,
    { cache: "no-store" },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error ?? "Failed to fetch code snapshot");
  }

  return data.snapshot ?? null;
}
