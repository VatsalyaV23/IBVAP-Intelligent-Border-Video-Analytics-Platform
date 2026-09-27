import React, { useEffect, useRef } from 'react';
import { useCamera } from '../../context/CameraContext';

interface SystemCameraFeedProps {
  onClose?: () => void;
}

export const SystemCameraFeed: React.FC<SystemCameraFeedProps> = ({ onClose }) => {
  const {
    status,
    errorMessage,
    devices,
    selectedDeviceId,
    fps,
    resolution,
    detections,
    latestPlate,
    startCamera,
    stopCamera,
    handleDeviceSwitch,
    attachVideoElement,
    detachVideoElement,
    attachOverlayCanvasElement
  } = useCamera();

  const personCount = detections.filter(d => d.class === 'person').length;
  const vehicleCount = detections.filter(d => ['car', 'truck', 'bus', 'motorcycle'].includes(d.class)).length;

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      attachVideoElement(videoRef.current);
    }
    if (overlayCanvasRef.current) {
      attachOverlayCanvasElement(overlayCanvasRef.current);
    }

    // Auto-start ONLY if status is initial Disconnected, never if user explicitly Stopped
    if (status === 'Disconnected') {
      startCamera(selectedDeviceId);
    }

    return () => {
      if (videoRef.current) {
        detachVideoElement(videoRef.current);
      }
      attachOverlayCanvasElement(null);
    };
  }, [selectedDeviceId]);

  const handleStopClick = () => {
    stopCamera();
  };

  return (
    <div className="rounded-lg overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col w-full">
      {/* Sensor Control Header */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status === 'Connected'
                ? 'bg-emerald-500 animate-pulse'
                : status === 'Connecting' || status === 'Requesting Permission'
                ? 'bg-amber-500 animate-ping'
                : 'bg-rose-500'
            }`}
          ></span>
          <span className="font-mono text-[12px] font-bold text-slate-900 dark:text-white truncate">
            SYSTEM-CAM [Physical Laptop Webcam]
          </span>
        </div>

        {/* Camera Selector & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceSwitch(e.target.value)}
              disabled={status === 'Connecting' || status === 'Requesting Permission'}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px] cursor-pointer"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          )}

          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            STATUS: {status.toUpperCase()}
          </span>

          {status === 'Connected' ? (
            <button
              onClick={handleStopClick}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[13px]">videocam_off</span>
              Stop Camera
            </button>
          ) : (
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[13px]">videocam</span>
              Start Camera
            </button>
          )}

          {onClose && (
            <button
              onClick={() => {
                if (onClose) onClose();
              }}
              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Close Feed"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Video Player & AI Canvas Overlay */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* Error / Permission Denied Screen */}
        {status !== 'Connected' && status !== 'Connecting' && (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2.5 max-w-md">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 text-rose-400 flex items-center justify-center border border-rose-800">
              <span className="material-symbols-outlined text-[28px]">
                {status === 'Permission Denied' ? 'lock' : 'videocam_off'}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-[14px] text-white font-mono">
                {status === 'Permission Denied'
                  ? 'Camera Permission Denied'
                  : status === 'Camera Unavailable'
                  ? 'Camera Unavailable'
                  : status === 'Stopped'
                  ? 'Physical Camera Stopped'
                  : 'Camera Connection Error'}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                {errorMessage || 'Click "Start Camera" above to grant permission and initiate physical camera stream.'}
              </p>
            </div>
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="mt-2 px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              Try Requesting Camera Permission Again
            </button>
          </div>
        )}

        {/* Live HTML5 Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${status === 'Connected' ? 'block' : 'hidden'}`}
        />

        {/* AI Bounding Box Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${status === 'Connected' ? 'block' : 'hidden'}`}
        />

        {/* Telemetry HUD Overlay */}
        {status === 'Connected' && (
          <div className="absolute inset-0 p-2.5 flex flex-col justify-between pointer-events-none">
            <div className="flex items-center justify-between text-white/90 font-mono text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
              <span>SRC: PHYSICAL WEBCAM ({resolution})</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">👤 {personCount} | 🚗 {vehicleCount}</span>
                <span className="text-sky-400 font-bold">YOLOv8 Active | {fps} FPS</span>
              </div>
            </div>

            {latestPlate && (
              <div className="self-center bg-black/85 border border-slate-700 backdrop-blur-md px-3 py-1 rounded flex items-center gap-2 font-mono text-[11px] text-white">
                <span className="text-sky-400 font-bold">LIVE PLATE:</span>
                <span className="font-black text-amber-300 tracking-wider">{latestPlate.license_plate}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${latestPlate.is_known ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {latestPlate.is_known ? 'KNOWN AUTH' : 'UNKNOWN ALERT'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-300 font-mono text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
              <span>{new Date().toLocaleTimeString()} IST</span>
              <span className="text-sky-400">REAL LAPTOP CAMERA STREAM ACTIVE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
