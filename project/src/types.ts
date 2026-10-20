export type Tab = "field" | "backlog" | "history";

export type ToastState = "idle" | "syncing" | "success" | "error";

export interface ToastMessage {
  id: number;
  state: ToastState;
  text: string;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  name: string;
}

export interface AppSettings {
  webhookUrl: string;
  fallbackWebhookUrl: string;
}

export interface PayloadImage {
  filename: string;
  base64_data: string;
}

export type AldenMode = "field" | "backlog_batch";

export interface AldenPayload {
  timestamp: string;
  mode: AldenMode;
  dictation_text: string;
  images: PayloadImage[];
  device_info: string;
}

export type Theme = "light" | "dark";

export interface HistoryEntry {
  id: string;
  timestamp: string;
  mode: AldenMode;
  status: "success" | "error";
  imageCount: number;
  dictationPreview: string;
  error?: string;
}
