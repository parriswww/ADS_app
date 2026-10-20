import { useEffect, useRef, useState } from "react";
import { X, Link2, Save, Check } from "lucide-react";
import type { AppSettings } from "@/types";

interface SettingsModalProps {
  open: boolean;
  settings: AppSettings;
  onSave: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
}

export function SettingsModal({ open, settings, onSave, onClose }: SettingsModalProps) {
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl);
  const [fallbackUrl, setFallbackUrl] = useState(settings.fallbackWebhookUrl);
  const [saved, setSaved] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setWebhookUrl(settings.webhookUrl);
      setFallbackUrl(settings.fallbackWebhookUrl);
      setSaved(false);
    }
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ webhookUrl: webhookUrl.trim(), fallbackWebhookUrl: fallbackUrl.trim() });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-t-3xl border border-ald-border bg-ald-surface p-6 animate-slide-up sm:rounded-3xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ald-text">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ald-muted transition-colors hover:bg-ald-card hover:text-ald-text"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ald-text">
              <Link2 className="h-4 w-4 text-ald-accent" />
              Make.com Webhook URL
            </label>
            <input
              type="url"
              inputMode="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hook.us1.make.com/..."
              className="w-full rounded-xl border border-ald-border bg-ald-card px-4 py-3 text-sm text-ald-text placeholder:text-ald-muted focus:border-ald-accent focus:outline-none focus:ring-1 focus:ring-ald-accent"
            />
            <p className="mt-1.5 text-xs text-ald-muted">
              Your primary endpoint. Payloads are POSTed here as JSON.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ald-text">
              Fallback Webhook URL
            </label>
            <input
              type="url"
              inputMode="url"
              value={fallbackUrl}
              onChange={(e) => setFallbackUrl(e.target.value)}
              placeholder="https://hook.us1.make.com/fallback..."
              className="w-full rounded-xl border border-ald-border bg-ald-card px-4 py-3 text-sm text-ald-text placeholder:text-ald-muted focus:border-ald-accent focus:outline-none focus:ring-1 focus:ring-ald-accent"
            />
            <p className="mt-1.5 text-xs text-ald-muted">
              Used automatically if the primary URL fails. Good for testing endpoints.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ald-accent py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-ald-accent-hi"
        >
          {saved ? (
            <>
              <Check className="h-5 w-5" /> Saved
            </>
          ) : (
            <>
              <Save className="h-5 w-5" /> Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
