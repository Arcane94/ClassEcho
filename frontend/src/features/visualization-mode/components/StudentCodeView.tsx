// Embeds the Snap runtime and renders the selected student code snapshot.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { API_BASE_URL } from "@/config";

import {
  fetchVisualizationCodeSnapshot,
  type VisualizationCodeSnapshot,
} from "../services/fetchVisualizationCodeSnapshot";

type Entry = {
  rowId: number;
  serverTime: string;
  projectID: string;
  assignmentID: string;
  userID: string;
  hasCode?: boolean;
  message?: string;
};

type Props = {
  sessionId: string | number;
  userId?: string | number | null;
  studentNumber: string;
  tNow: Date;
  entries: Entry[];
  loadingEntries?: boolean;
  reloadToken?: number;
};

const VIEWER_MESSAGE_SOURCE = "snapclass-code-viewer";
const SNAP_RUNTIME_VIEWER_URL = `${API_BASE_URL}/isnap-runtime/snapclass-viewer.html`;

function parseMysqlDatetimeLocal(value: string): number | null {
  if (!value) return null;
  const isoLike = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(isoLike);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

function pickBestEntry(entries: Entry[], t: Date): Entry | null {
  if (!entries || entries.length === 0) return null;

  const times = entries.map((entry) => parseMysqlDatetimeLocal(entry.serverTime));
  if (times.every((time) => time == null)) return entries[entries.length - 1];

  const target = t.getTime();
  let low = 0;
  let high = entries.length - 1;
  let bestLessOrEqual = -1;

  const findNearestValid = (idx: number, dir: 1 | -1) => {
    let current = idx;
    while (current >= 0 && current < times.length) {
      if (times[current] != null) return current;
      current += dir;
    }
    return -1;
  };

  while (low <= high) {
    const mid = (low + high) >> 1;
    let resolvedMid = mid;

    if (times[resolvedMid] == null) {
      const left = findNearestValid(resolvedMid, -1);
      const right = findNearestValid(resolvedMid, 1);
      if (left === -1 && right === -1) break;
      if (left !== -1 && right !== -1) {
        resolvedMid = mid - left <= right - mid ? left : right;
      } else {
        resolvedMid = left !== -1 ? left : right;
      }
    }

    const resolvedTime = times[resolvedMid] as number;
    if (resolvedTime <= target) {
      bestLessOrEqual = resolvedMid;
      low = resolvedMid + 1;
    } else {
      high = resolvedMid - 1;
    }
  }

  if (bestLessOrEqual === -1) {
    const firstValid = times.findIndex((time) => time != null);
    return firstValid === -1 ? entries[0] : entries[firstValid];
  }

  const currentIndex = bestLessOrEqual;
  const currentTime = times[currentIndex] as number;

  let nextIndex = currentIndex + 1;
  while (nextIndex < entries.length && times[nextIndex] == null) nextIndex += 1;
  if (nextIndex >= entries.length) return entries[currentIndex];

  const nextTime = times[nextIndex] as number;
  const currentDiff = Math.abs(target - currentTime);
  const nextDiff = Math.abs(nextTime - target);
  return nextDiff < currentDiff ? entries[nextIndex] : entries[currentIndex];
}

export function StudentCodeView({
  sessionId,
  userId,
  studentNumber,
  tNow,
  entries,
  loadingEntries,
  reloadToken = 0,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const snapshotCacheRef = useRef<Map<number, VisualizationCodeSnapshot | null>>(new Map());

  const [runtimeReady, setRuntimeReady] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const safeEntries = useMemo(() => (Array.isArray(entries) ? entries : []), [entries]);
  const chosen = useMemo(() => pickBestEntry(safeEntries, tNow), [safeEntries, tNow]);
  const viewerSrc = useMemo(
    () => `${SNAP_RUNTIME_VIEWER_URL}?reload=${reloadToken}`,
    [reloadToken],
  );

  const postSnapshot = useCallback((snapshot: VisualizationCodeSnapshot) => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        source: VIEWER_MESSAGE_SOURCE,
        type: "load-snapshot",
        payload: snapshot,
      },
      API_BASE_URL,
    );
  }, []);

  useEffect(() => {
    snapshotCacheRef.current.clear();
    setRuntimeReady(false);
    setSnapshotError(null);
  }, [reloadToken]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const data = event.data as { source?: string; type?: string } | null;
      if (data?.source !== VIEWER_MESSAGE_SOURCE || data.type !== "ready") {
        return;
      }

      setRuntimeReady(true);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!runtimeReady || !chosen) {
      return;
    }

    const cachedSnapshot = snapshotCacheRef.current.get(chosen.rowId);
    if (cachedSnapshot !== undefined) {
      if (cachedSnapshot) {
        postSnapshot(cachedSnapshot);
        setSnapshotError(null);
      } else {
        setSnapshotError("No code snapshot is available for this moment.");
      }
      return;
    }

    let cancelled = false;
    setSnapshotLoading(true);
    setSnapshotError(null);

    void fetchVisualizationCodeSnapshot({ sessionId, userId, rowId: chosen.rowId })
      .then((snapshot) => {
        if (cancelled) return;
        snapshotCacheRef.current.set(chosen.rowId, snapshot);

        if (!snapshot) {
          setSnapshotError("No code snapshot is available for this moment.");
          return;
        }

        postSnapshot(snapshot);
        setSnapshotError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        snapshotCacheRef.current.delete(chosen.rowId);
        setSnapshotError(
          error instanceof Error ? error.message : "Failed to load the code snapshot.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setSnapshotLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chosen, postSnapshot, runtimeReady, sessionId, userId]);

  if (loadingEntries) {
    return (
      <div style={{ height: "100%", width: "100%" }}>
        <div className="placeholder">Refreshing code entries...</div>
      </div>
    );
  }

  if (safeEntries.length === 0) {
    return (
      <div style={{ height: "100%", width: "100%" }}>
        <div className="placeholder">
          No code snapshots found for student {studentNumber} in this period.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <iframe
        ref={iframeRef}
        title={`Snap code viewer for student ${studentNumber}`}
        src={viewerSrc}
        allowFullScreen
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
      />

      {(!runtimeReady || snapshotLoading || snapshotError) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(247, 250, 252, 0.88)",
            padding: "1rem",
          }}
        >
          <div className="placeholder">
            {snapshotError
              ? snapshotError
              : !runtimeReady
                ? "Loading code viewer..."
                : "Loading code snapshot..."}
          </div>
        </div>
      )}
    </div>
  );
}
