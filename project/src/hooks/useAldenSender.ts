import { useCallback } from "react";
import type { AldenPayload } from "@/types";

export interface SendOptions {
  webhookUrl: string;
  fallbackWebhookUrl: string;
  payload: AldenPayload;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

export function useAldenSender() {
  const send = useCallback(async (opts: SendOptions): Promise<SendResult> => {
    const targets = [opts.webhookUrl, opts.fallbackWebhookUrl]
      .map((u) => u.trim())
      .filter(Boolean);

    if (targets.length === 0) {
      return { ok: false, error: "No webhook URL configured. Open Settings to add your Make.com webhook URL." };
    }

    let lastError = "";
    for (const url of targets) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts.payload),
          redirect: "follow",
        });
        if (res.ok) return { ok: true };
        lastError = `Endpoint returned status ${res.status}`;
      } catch (err) {
        lastError = (err as Error).message || "Network request failed";
      }
    }

    return { ok: false, error: lastError || "Network error" };
  }, []);

  return { send };
}
