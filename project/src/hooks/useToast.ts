import { useCallback, useRef, useState } from "react";
import type { ToastMessage, ToastState } from "@/types";

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (state: ToastState, text: string, autoDismissMs?: number) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, state, text }]);
      if (state === "success" || state === "error") {
        const ms = autoDismissMs ?? (state === "success" ? 3000 : 5000);
        window.setTimeout(() => dismiss(id), ms);
      }
      return id;
    },
    [dismiss]
  );

  const updateToast = useCallback(
    (id: number, state: ToastState, text: string, autoDismissMs?: number) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, state, text } : t))
      );
      if (state === "success" || state === "error") {
        const ms = autoDismissMs ?? (state === "success" ? 3000 : 5000);
        window.setTimeout(() => dismiss(id), ms);
      }
    },
    [dismiss]
  );

  return { toasts, showToast, updateToast, dismiss };
}
