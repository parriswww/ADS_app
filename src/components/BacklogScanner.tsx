import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Zap,
  Upload,
  X,
  Trash2,
  Send,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useMotionDetection } from "@/hooks/useMotionDetection";
import { CameraOverlay } from "@/components/CameraOverlay";
import type { CapturedPhoto, AldenPayload } from "@/types";
import { fileToDataUrl, generateId } from "@/utils/media";
import { playShutterSound } from "@/utils/audio";

interface BacklogScannerProps {
  onSend: (payload: AldenPayload) => Promise<{ ok: boolean; error?: string }>;
  showToast: (state: "idle" | "syncing" | "success" | "error", text: string) => number;
  updateToast: (id: number, state: "idle" | "syncing" | "success" | "error", text: string) => void;
}

export function BacklogScanner({ onSend, showToast, updateToast }: BacklogScannerProps) {
  const camera = useCamera({ facingMode: "environment" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [rowHopper, setRowHopper] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [sending, setSending] = useState(false);

  const captureFromVideo = useCallback((): string | null => {
    const video = videoRef.current ?? document.querySelector("video");
    if (!video) return null;
    return camera.capture(video as HTMLVideoElement);
  }, [camera]);

  const doCapture = useCallback(() => {
    const dataUrl = captureFromVideo();
    if (!dataUrl) return;
    const timestamp = Date.now();
    setPhotos((prev) => [
      ...prev,
      { id: generateId(), dataUrl, name: `batch_item_${prev.length + 1}_${timestamp}` },
    ]);
    playShutterSound();
    setFlashKey((k) => k + 1);
    setCooldown(true);
    window.setTimeout(() => setCooldown(false), 1500);
  }, [captureFromVideo]);

  const motionState = useMotionDetection(videoRef, {
    enabled: cameraOpen && rowHopper && !cooldown,
    onStable: doCapture,
  });

  // Grab the video element from CameraOverlay after it renders
  useEffect(() => {
    if (!cameraOpen) {
      videoRef.current = null;
      return;
    }
    const findVideo = window.setInterval(() => {
      const v = document.querySelector("video");
      if (v) {
        videoRef.current = v as HTMLVideoElement;
        window.clearInterval(findVideo);
      }
    }, 100);
    return () => window.clearInterval(findVideo);
  }, [cameraOpen]);

  const openCamera = async () => {
    setCameraOpen(true);
    await camera.start();
  };

  const closeCamera = () => {
    camera.stop();
    setCameraOpen(false);
    setRowHopper(false);
    setCooldown(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const urls = await Promise.all(files.map(fileToDataUrl));
    setPhotos((prev) => [
      ...prev,
      ...urls.map((dataUrl, i) => ({
        id: generateId(),
        dataUrl,
        name: files[i].name,
      })),
    ]);
    e.target.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => setPhotos([]);

  const handleProcessBatch = async () => {
    if (sending || photos.length === 0) return;
    setSending(true);
    const ts = new Date().toISOString();
    const payload: AldenPayload = {
      timestamp: ts,
      mode: "backlog_batch",
      dictation_text: "",
      images: photos.map((p, i) => ({
        filename: `batch_item_${i + 1}_${ts}.jpg`,
        base64_data: p.dataUrl,
      })),
      device_info: "Mobile PWA - Batch",
    };
    const count = photos.length;
    const toastId = showToast("syncing", `Processing ${count} ${count === 1 ? "photo" : "photos"} to Alden...`);
    const result = await onSend(payload);
    if (result.ok) {
      updateToast(toastId, "success", `Synced ${count} ${count === 1 ? "photo" : "photos"} successfully at ${new Date().toLocaleTimeString()}.`);
      setPhotos([]);
    } else {
      updateToast(toastId, "error", result.error ?? "Network error. Please try again.");
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Capture actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openCamera}
          className="flex flex-col items-center gap-2 rounded-2xl border border-ald-accent/30 bg-ald-accent/10 p-4 transition-all active:scale-[0.98] hover:bg-ald-accent/15"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ald-accent/20 text-ald-accent">
            <Camera className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ald-text">Row Hopper</p>
            <p className="text-[11px] text-ald-muted">Auto-capture mode</p>
          </div>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border border-ald-border bg-ald-card p-4 transition-all active:scale-[0.98] hover:bg-ald-surface"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ald-border text-ald-text">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ald-text">Upload</p>
            <p className="text-[11px] text-ald-muted">From library</p>
          </div>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Queue header */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ald-text">
              Queue: {photos.length} {photos.length === 1 ? "item" : "items"} ready
            </span>
            <span className="flex items-center gap-1 rounded-md bg-ald-success/15 px-2 py-0.5 text-[11px] font-medium text-ald-success">
              <CheckCircle2 className="h-3 w-3" /> Ready to Sync
            </span>
          </div>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ald-muted transition-colors hover:text-ald-error"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear Queue
          </button>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-ald-border bg-ald-card animate-scale-in"
            >
              <img src={photo.dataUrl} alt={`Scan ${idx + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <span className="text-[10px] font-medium text-white">#{idx + 1}</span>
              </div>
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 active:scale-90"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ald-border bg-ald-card/50 py-12">
          <ImageIcon className="mb-3 h-10 w-10 text-ald-muted" />
          <p className="text-sm font-medium text-ald-muted">No photos in queue</p>
          <p className="mt-1 text-xs text-ald-muted">Open Row Hopper or upload to get started</p>
        </div>
      )}

      {/* Process button */}
      <button
        onClick={handleProcessBatch}
        disabled={sending || photos.length === 0}
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-ald-accent py-4 text-base font-semibold text-white shadow-lg shadow-ald-accent/20 transition-all active:scale-[0.98] hover:bg-ald-accent-hi disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Processing...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Process Batch to Alden
            {photos.length > 0 && (
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-sm">{photos.length}</span>
            )}
          </>
        )}
      </button>

      {/* Camera overlay */}
      {cameraOpen && (
        <>
          <CameraOverlay
            stream={camera.stream}
            error={camera.error}
            onClose={closeCamera}
            onCapture={doCapture}
            captureLabel="Capture photo"
            showAlignmentBox
            showFocusNote
            flashKey={flashKey}
            rowHopperActive={rowHopper}
            motionStable={motionState.stable}
            queueCount={photos.length}
            cooldownActive={cooldown}
          />
          {/* Row Hopper toggle */}
          {!camera.error && (
            <button
              onClick={() => setRowHopper((v) => !v)}
              className={`fixed left-1/2 z-[60] -translate-x-1/2 transform rounded-full px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition-all active:scale-95 ${
                rowHopper
                  ? "bg-ald-warning text-black"
                  : "bg-ald-accent text-white"
              }`}
              style={{ top: "calc(env(safe-area-inset-top) + 4rem)" }}
            >
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                {rowHopper ? "Row Hopper ON" : "Enable Row Hopper"}
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

