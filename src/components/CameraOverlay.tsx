import { useEffect, useRef, useState } from "react";
import { X, Camera as CameraIcon, AlertTriangle, Focus, Zap } from "lucide-react";

interface CameraOverlayProps {
  stream: MediaStream | null;
  error: string | null;
  onClose: () => void;
  onCapture: () => void;
  captureLabel?: string;
  showAlignmentBox?: boolean;
  showFocusNote?: boolean;
  flashKey?: number;
  rowHopperActive?: boolean;
  motionStable?: boolean;
  queueCount?: number;
  cooldownActive?: boolean;
}

export function CameraOverlay({
  stream,
  error,
  onClose,
  onCapture,
  captureLabel = "Capture",
  showAlignmentBox = false,
  showFocusNote = false,
  flashKey = 0,
  rowHopperActive = false,
  motionStable = false,
  queueCount = 0,
  cooldownActive = false,
}: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Flash overlay */}
      {flashKey > 0 && (
        <div
          key={flashKey}
          className="pointer-events-none absolute inset-0 z-[55] bg-white animate-flash"
        />
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-transform active:scale-90"
          aria-label="Close camera"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Queue counter */}
        {queueCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-ald-success px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            {queueCount} queued
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-full bg-ald-error/90 px-3 py-1.5 text-xs font-medium text-white">
            <AlertTriangle className="h-3.5 w-3.5" />
            Permission needed
          </div>
        )}
      </div>

      {/* Camera viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-ald-warning" />
            <p className="text-sm font-medium text-white">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {/* Alignment / framing guide */}
        {!error && (showAlignmentBox || showFocusNote) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`relative h-[62%] w-[82%] rounded-2xl border-2 transition-colors duration-300 ${
                rowHopperActive
                  ? motionStable && !cooldownActive
                    ? "border-ald-success"
                    : cooldownActive
                      ? "border-ald-warning/60"
                      : "border-white/40"
                  : "border-white/30"
              }`}
            >
              {/* Corner brackets */}
              {[
                "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
              ].map((cls) => (
                <div
                  key={cls}
                  className={`absolute h-7 w-7 ${cls}`}
                  style={{ borderColor: "inherit" }}
                />
              ))}

              {/* Focus note */}
              {showFocusNote && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 transform">
                  <div className="flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2 backdrop-blur-md">
                    <Focus className="h-4 w-4 text-ald-accent-hi" />
                    <span className="text-xs font-medium text-white">
                      Hold steady — make the text as clear as possible
                    </span>
                  </div>
                </div>
              )}

              {/* Row Hopper status */}
              {rowHopperActive && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 transform">
                  <div
                    className={`flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-md ${
                      motionStable && !cooldownActive
                        ? "bg-ald-success/80"
                        : cooldownActive
                          ? "bg-ald-warning/80"
                          : "bg-white/15"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-semibold text-white">
                      {cooldownActive
                        ? "Cooldown — move to next receipt"
                        : motionStable
                          ? "Steady — capturing..."
                          : "Align receipt in box"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Capture button */}
      <div className="flex items-center justify-center py-6">
        <button
          onClick={onCapture}
          disabled={!!error || !stream || cooldownActive}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/10 backdrop-blur-sm transition-all active:scale-90 disabled:opacity-40"
          aria-label={captureLabel}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <CameraIcon className="h-7 w-7 text-black" />
          </div>
        </button>
      </div>
    </div>
  );
}
