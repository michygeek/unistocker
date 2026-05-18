"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

interface ScannerControls {
  stop: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [status, setStatus] = useState<"requesting" | "scanning" | "error">("requesting");
  const [errorMsg, setErrorMsg] = useState("");

  const startScanning = async (deviceId?: string) => {
    if (!videoRef.current) return;
    try {
      controlsRef.current?.stop();
      controlsRef.current = null;

      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      setStatus("scanning");

      controlsRef.current = await reader.decodeFromVideoDevice(
        deviceId ?? undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            onScan(result.getText());
          }
          // NotFoundException fires every frame when no code is visible — ignore silently
          if (err && (err as { name?: string }).name !== "NotFoundException") {
            console.warn("Scanner error:", (err as { message?: string }).message);
          }
        }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Camera error";
      setErrorMsg(
        msg.toLowerCase().includes("permission")
          ? "Camera permission denied. Please allow camera access and try again."
          : msg
      );
      setStatus("error");
    }
  };

  useEffect(() => {
    let active = true;

    navigator.mediaDevices
      .enumerateDevices()
      .then((all) => {
        if (!active) return;
        const videoDevices = all.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);
        const backIndex = videoDevices.findIndex((d) =>
          /back|rear|environment/i.test(d.label)
        );
        const idx = backIndex >= 0 ? backIndex : 0;
        setCameraIndex(idx);
        startScanning(videoDevices[idx]?.deviceId);
      })
      .catch(() => {
        if (!active) return;
        startScanning();
      });

    return () => {
      active = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const next = (cameraIndex + 1) % cameras.length;
    setCameraIndex(next);
    startScanning(cameras[next].deviceId);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">Scan Barcode / QR Code</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {status === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse 55% 45% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)"
              }} />
              <div className="relative w-56 h-36">
                {(["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2",
                   "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"] as const
                ).map((cls, i) => (
                  <div key={i} className={`absolute w-5 h-5 border-indigo-400 ${cls}`} />
                ))}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-indigo-400/80"
                  style={{ animation: "lp-scan 2s ease-in-out infinite" }}
                />
              </div>
            </div>
          )}

          {status === "requesting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
              <div className="text-center">
                <Camera size={32} className="text-gray-600 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-gray-400">Starting camera…</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950 p-6">
              <div className="text-center">
                <p className="text-sm text-red-400 mb-3">{errorMsg}</p>
                <button
                  onClick={() => startScanning(cameras[cameraIndex]?.deviceId)}
                  className="text-xs text-indigo-400 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-800">
          <p className="text-xs text-gray-400">
            {status === "scanning"
              ? "Point camera at barcode or QR code"
              : status === "error"
              ? "Camera unavailable"
              : "Initializing…"}
          </p>
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              <RefreshCw size={13} />
              Flip camera
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lp-scan {
          0%   { top: 6px; }
          50%  { top: calc(100% - 6px); }
          100% { top: 6px; }
        }
      `}</style>
    </div>
  );
}
