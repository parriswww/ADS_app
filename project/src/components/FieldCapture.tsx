import { useRef, useState } from "react";
import {
  Camera,
  Upload,
  Mic,
  Square,
  Send,
  X,
  Image as ImageIcon,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Check,
  Focus,
} from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useVoiceDictation } from "@/hooks/useVoiceDictation";
import { CameraOverlay } from "@/components/CameraOverlay";
import type { CapturedPhoto, AldenPayload } from "@/types";
import { fileToDataUrl, generateId } from "@/utils/media";
import { playShutterSound } from "@/utils/audio";

interface FieldCaptureProps {
  onSend: (payload: AldenPayload) => Promise<{ ok: boolean; error?: string }>;
  showToast: (state: "idle" | "syncing" | "success" | "error", text: string) => number;
  updateToast: (id: number, state: "idle" | "syncing" | "success" | "error", text: string) => void;
}

export function FieldCapture({ onSend, showToast, updateToast }: FieldCaptureProps) {
  const camera = useCamera({ facingMode: "environment" });
  const voice = useVoiceDictation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  const openCamera = async () => {
    setCameraOpen(true);
    await camera.start();
  };

  const closeCamera = () => {
    camera.stop();
    setCameraOpen(false);
  };

  const takeShot = () => {
    const video = document.querySelector("video");
    if (!video) return;
    const dataUrl = camera.capture(video as HTMLVideoElement);
    if (dataUrl) {
      setPhoto({ id: generateId(), dataUrl, name: "invoice" });
      playShutterSound();
      setFlashKey((k) => k + 1);
      closeCamera();
    }
  };

  const retake = () => {
    setPhoto(null);
    openCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPhoto({ id: generateId(), dataUrl, name: file.name });
    e.target.value = "";
  };

  const handleSend = async () => {
    if (sending) return;
    if (!photo && !voice.transcript.trim()) {
      showToast("error", "Add a photo or voice note before sending.");
      return;
    }
    setSending(true);
    voice.stop();
    const ts = new Date().toISOString();
    const payload: AldenPayload = {
      timestamp: ts,
      mode: "field",
      dictation_text: voice.transcript.trim(),
      images: photo
        ? [{ filename: `invoice_capture_${ts}.jpg`, base64_data: photo.dataUrl }]
        : [],
      device_info: "Mobile PWA",
    };
    const toastId = showToast("syncing", "Syncing to Alden...");
    const result = await onSend(payload);
    if (result.ok) {
      updateToast(toastId, "success", `Synced successfully at ${new Date().toLocaleTimeString()}.`);
      setPhoto(null);
      voice.reset();
      setVoiceOpen(false);
    } else {
      updateToast(toastId, "error", result.error ?? "Network error. Please try again.");
    }
    setSending(false);
  };

  const hasContent = photo || voice.transcript.trim();

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            onClick={openCamera}
            icon={<Camera className="h-5 w-5" />}
            title="Snap Receipt"
            subtitle="Camera capture"
            accent
          />
          <ActionButton
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="h-5 w-5" />}
            title="Upload File"
            subtitle="From library"
          />
        </div>
        <ActionButton
          onClick={() => setVoiceOpen(true)}
          icon={<Mic className="h-6 w-6" />}
          title="Record Voice Note"
          subtitle="Real-time speech-to-text"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Photo preview with retake */}
      {photo && (
        <div className="animate-scale-in overflow-hidden rounded-2xl border border-ald-border bg-ald-card">
          <div className="relative">
            <img src={photo.dataUrl} alt="Captured receipt" className="w-full" />
            <button
              onClick={() => setPhoto(null)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform active:scale-90"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5">
            <ImageIcon className="h-4 w-4 text-ald-muted" />
            <span className="text-xs text-ald-muted">Invoice photo attached</span>
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-ald-success">
              <Check className="h-3.5 w-3.5" /> Ready
            </span>
          </div>
          <button
            onClick={retake}
            className="flex w-full items-center justify-center gap-2 border-t border-ald-border py-2.5 text-sm font-medium text-ald-accent transition-colors hover:bg-ald-surface"
          >
            <RotateCcw className="h-4 w-4" /> Retake Photo
          </button>
        </div>
      )}

      {/* Voice dictation box */}
      {voiceOpen && (
        <VoiceBox
          voice={voice}
          onClose={() => {
            voice.stop();
            setVoiceOpen(false);
          }}
        />
      )}

      {/* Summary / status */}
      {hasContent && (
        <div className="rounded-xl border border-ald-border bg-ald-card px-4 py-3">
          <p className="text-xs font-medium text-ald-muted">Current record</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {photo && <Tag label="1 Photo" />}
            {voice.transcript.trim() && <Tag label="Voice Note" />}
          </div>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending || !hasContent}
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-ald-accent py-4 text-base font-semibold text-white shadow-lg shadow-ald-accent/20 transition-all active:scale-[0.98] hover:bg-ald-accent-hi disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="h-5 w-5" />
        {sending ? "Syncing to Alden..." : "Send to Alden"}
      </button>

      {/* Camera overlay */}
      {cameraOpen && (
        <CameraOverlay
          stream={camera.stream}
          error={camera.error}
          onClose={closeCamera}
          onCapture={takeShot}
          captureLabel="Capture receipt"
          showAlignmentBox
          showFocusNote
          flashKey={flashKey}
        />
      )}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-ald-accent/15 px-2 py-1 text-xs font-medium text-ald-accent">
      {label}
    </span>
  );
}

function ActionButton({
  onClick,
  icon,
  title,
  subtitle,
  accent = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all active:scale-[0.98] ${
        accent
          ? "border-ald-accent/30 bg-ald-accent/10 hover:bg-ald-accent/15"
          : "border-ald-border bg-ald-card hover:bg-ald-surface"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          accent ? "bg-ald-accent/20 text-ald-accent" : "bg-ald-border text-ald-text"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-ald-text">{title}</p>
        <p className="text-[11px] text-ald-muted">{subtitle}</p>
      </div>
    </button>
  );
}

function VoiceBox({
  voice,
  onClose,
}: {
  voice: ReturnType<typeof useVoiceDictation>;
  onClose: () => void;
}) {
  if (!voice.supported) {
    return (
      <div className="rounded-2xl border border-ald-error/30 bg-ald-error/10 p-4 animate-scale-in">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-ald-error" />
          <div>
            <p className="text-sm font-medium text-ald-text">Voice dictation unavailable</p>
            <p className="mt-1 text-xs text-ald-muted">
              Your browser doesn't support speech recognition. Try Chrome on Android or Safari on iOS.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-3 rounded-lg border border-ald-border bg-ald-surface px-3 py-1.5 text-xs text-ald-muted"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ald-border bg-ald-card p-4 animate-scale-in">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-ald-accent" />
          <span className="text-sm font-medium text-ald-text">Voice Note</span>
          {voice.listening && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-ald-error">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-ald-error" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ald-error" />
              </span>
              Recording
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-ald-muted transition-colors hover:text-ald-text"
          aria-label="Close voice box"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {voice.error && (
        <p className="mb-2 text-xs text-ald-error">{voice.error}</p>
      )}

      {/* Live transcription display */}
      {(voice.listening || voice.interim) && (
        <div className="mb-2 rounded-lg bg-ald-surface px-3 py-2">
          <p className="text-xs text-ald-muted mb-1 flex items-center gap-1">
            <Focus className="h-3 w-3" /> Live transcript
          </p>
          <p className="text-sm text-ald-text">
            {voice.transcript}
            {voice.interim && <span className="text-ald-muted"> {voice.interim}</span>}
          </p>
        </div>
      )}

      {/* Editable text area */}
      <textarea
        value={voice.transcript}
        onChange={(e) => voice.setTranscript(e.target.value)}
        placeholder="Tap start and speak, or edit text here..."
        rows={4}
        className="w-full resize-none rounded-xl border border-ald-border bg-ald-bg px-3 py-2.5 text-sm text-ald-text placeholder:text-ald-muted focus:border-ald-accent focus:outline-none focus:ring-1 focus:ring-ald-accent"
      />

      <div className="mt-3 flex items-center gap-2">
        {!voice.listening ? (
          <button
            onClick={voice.start}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ald-accent py-2.5 text-sm font-medium text-white transition-all active:scale-95"
          >
            <Mic className="h-4 w-4" /> Start Recording
          </button>
        ) : (
          <button
            onClick={voice.stop}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ald-error py-2.5 text-sm font-medium text-white transition-all active:scale-95"
          >
            <Square className="h-4 w-4" /> Stop Recording
          </button>
        )}
        <button
          onClick={voice.reset}
          className="flex items-center justify-center gap-2 rounded-xl border border-ald-border bg-ald-surface px-4 py-2.5 text-sm font-medium text-ald-muted transition-all active:scale-95 hover:text-ald-text"
          aria-label="Clear text"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            voice.stop();
            voice.reset();
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-ald-border bg-ald-surface px-4 py-2.5 text-sm font-medium text-ald-muted transition-all active:scale-95 hover:text-ald-text"
          aria-label="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
