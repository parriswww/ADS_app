import { History, CheckCircle2, AlertCircle, Trash2, Camera, Layers } from "lucide-react";
import type { HistoryEntry } from "@/types";

interface SessionHistoryProps {
  history: HistoryEntry[];
  onClear: () => void;
}

export function SessionHistory({ history, onClear }: SessionHistoryProps) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-ald-accent" />
          <h2 className="text-base font-semibold text-ald-text">Session History</h2>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ald-muted transition-colors hover:text-ald-error"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ald-border bg-ald-card/50 py-12">
          <History className="mb-3 h-10 w-10 text-ald-muted" />
          <p className="text-sm font-medium text-ald-muted">No submissions yet</p>
          <p className="mt-1 text-xs text-ald-muted">Sent records will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-xl border border-ald-border bg-ald-card p-3 animate-scale-in"
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  entry.status === "success"
                    ? "bg-ald-success/15 text-ald-success"
                    : "bg-ald-error/15 text-ald-error"
                }`}
              >
                {entry.status === "success" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {entry.mode === "field" ? (
                    <Camera className="h-3.5 w-3.5 text-ald-muted" />
                  ) : (
                    <Layers className="h-3.5 w-3.5 text-ald-muted" />
                  )}
                  <span className="text-xs font-medium text-ald-text">
                    {entry.mode === "field" ? "Field Capture" : "Batch Scan"}
                  </span>
                  <span className="text-[11px] text-ald-muted">
                    {entry.imageCount} {entry.imageCount === 1 ? "photo" : "photos"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-ald-muted">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
                {entry.dictationPreview && (
                  <p className="mt-1 truncate text-xs text-ald-text">
                    "{entry.dictationPreview}"
                  </p>
                )}
                {entry.error && (
                  <p className="mt-1 text-[11px] text-ald-error">{entry.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
