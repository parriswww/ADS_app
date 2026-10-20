import { useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import type { ToastMessage } from "@/types";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-3"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (toast.state === "syncing") return;
  }, [toast.state]);

  const config = {
    syncing: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-ald-accent" />,
      border: "border-ald-accent/40",
      bg: "bg-ald-card",
    },
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-ald-success" />,
      border: "border-ald-success/40",
      bg: "bg-ald-card",
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-ald-error" />,
      border: "border-ald-error/40",
      bg: "bg-ald-card",
    },
    idle: {
      icon: null,
      border: "border-ald-border",
      bg: "bg-ald-card",
    },
  }[toast.state];

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border ${config.border} ${config.bg} px-4 py-3 shadow-lg animate-slide-up`}
    >
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <p className="flex-1 text-sm leading-snug text-ald-text">{toast.text}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-ald-muted transition-colors hover:text-ald-text"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
