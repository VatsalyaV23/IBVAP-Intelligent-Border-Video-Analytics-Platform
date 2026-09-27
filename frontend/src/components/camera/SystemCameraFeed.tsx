import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

interface SystemCameraFeedProps {
  onClose?: () => void;
}

interface CameraDeviceOption {
  deviceId: string;
  label: string;
}

interface DetectionItem {
  class: string;
  confidence: number;
  tracking_id: string;
  bbox: [number, number, number, number];
}

interface PlateScannedInfo {
  license_plate: string;
  confidence: number;
  is_known: boolean;
  owner_or_unit: string;
  plate_bbox?: [number, number, number, number];
}

export const SystemCameraFeed: React.FC<SystemCameraFeedProps> = ({ onClose }) => {
  const [status, setStatus] = useState<
    'Disconnected' | 'Requesting Permission' | 'Permission Denied' | 'Connecting' | 'Connected' | 'Camera Error' | 'Camera Unavailable' | 'Stopped'
  >('Disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [fps, setFps] = useState<number>(0);
  const [resolution, setResolution] = useState<string>('640x480');
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [latestPlate, setLatestPlate] = useState<PlateScannedInfo | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<boolean>(false);
  const frameCounterRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(Date.now());

  // Enumerate physical video devices
  const enumerateVideoDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter(d => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Physical Camera #${index + 1}`
        }));
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.error('Error enumerating video devices:', e);
    }
  };

  // Stop MediaStream tracks and clean up frame processing loops
  const stopCameraStream = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    processingRef.current = false;
    setDetections([]);
    setFps(0);
  };

  // Start physical laptop camera stream
  const startCamera = async (deviceIdToUse?: string) => {
    stopCameraStream();
    setErrorMessage(null);
    setStatus('Requesting Permission');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('Camera Unavailable');
      setErrorMessage('Browser mediaDevices API is not supported in this environment or context (requires HTTPS or localhost).');
      return;
    }

    const constraints: MediaStreamConstraints = {
      video: deviceIdToUse ? { deviceId: { exact: deviceIdToUse } } : true,
      audio: false
    };

    try {
      setStatus('Connecting');
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStatus('Connected');
      
      // Update device list after permission granted (labels become accessible)
      await enumerateVideoDevices();

      // Get video track resolution
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setResolution(`${settings.width}x${settings.height}`);
        }
      }

      // Start AI frame processing loop
      startInferenceLoop();
    } catch (err: any) {
      stopCameraStream();
      console.error('Camera access error:', err);

      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setStatus('Permission Denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings and try again.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setStatus('Camera Unavailable');
        setErrorMessage('No physical camera device was detected on your system.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setStatus('Camera Error');
        setErrorMessage('Camera is currently in use by another application or operating system process.');
      } else if (errName === 'OverconstrainedError') {
        setStatus('Camera Error');
        setErrorMessage('Selected camera resolution or device constraint is not supported by your hardware.');
      } else if (errName === 'SecurityError') {
        setStatus('Camera Error');
        setErrorMessage('Security restriction: Camera access requires HTTPS or localhost.');
      } else {
        setStatus('Camera Error');
        setErrorMessage(err?.message || 'Failed to connect to physical webcam.');
      }
    }
  };

  // Real AI Inference Loop (Sends frames to backend AI pipeline)
  const startInferenceLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (processingRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        return;
      }

      const video = videoRef.current;
      const rawW = video.videoWidth || 640;
      const rawH = video.videoHeight || 480;

      // Scale down large frames to max 640px width for fast 60fps responsiveness
      const targetW = Math.min(rawW, 640);
      const targetH = Math.round(targetW * (rawH / rawW));

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const canvas = offscreenCanvasRef.current;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, targetW, targetH);

      processingRef.current = true;
      canvas.toBlob(async (blob) => {
        if (!blob) {
          processingRef.current = false;
          return;
        }

        try {
          const result = await api.processFrame(blob, 'LAPTOP-CAM-0');
          if (result && result.status === 'SUCCESS') {
            setDetections(result.detections || []);
            if (result.plate_scanned) {
              setLatestPlate(result.plate_scanned);
            }

            // Calculate real FPS
            frameCounterRef.current += 1;
            const now = Date.now();
            const elapsed = (now - lastFpsTimeRef.current) / 1000;
            if (elapsed >= 1.0) {
              setFps(Math.round(frameCounterRef.current / elapsed));
              frameCounterRef.current = 0;
              lastFpsTimeRef.current = now;
            }

            // Draw bounding boxes on overlay canvas
            drawDetectionsOverlay(result.detections || [], result.plate_scanned, targetW, targetH);
          }
        } catch (e) {
          // Silent frame drop recovery
        } finally {
          processingRef.current = false;
        }
      }, 'image/jpeg', 0.70);
    }, 180); // Smooth AI inference
  };

  // Draw dynamic bounding boxes on overlay canvas
  const drawDetectionsOverlay = (
    dets: DetectionItem[],
    plate: PlateScannedInfo | null,
    videoW: number,
    videoH: number
  ) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    canvas.width = videoW;
    canvas.height = videoH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, videoW, videoH);

    dets.forEach((d) => {
      const [x1, y1, x2, y2] = d.bbox;
      const isPerson = d.class === 'person';
      const color = isPerson ? '#00ff80' : '#ffb400';

      // Bounding Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Label background
      const label = `${d.class.toUpperCase()} #${d.tracking_id} ${Math.round(d.confidence * 100)}%`;
      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x1, Math.max(0, y1 - 20), textWidth + 8, 20);
      ctx.fillStyle = color;
      ctx.fillText(label, x1 + 4, Math.max(14, y1 - 6));
    });

    if (plate && plate.license_plate) {
      const isKnown = plate.is_known;
      const plateColor = isKnown ? '#00ff80' : '#f43f5e';
      const statusTag = isKnown ? 'KNOWN AUTH' : 'UNKNOWN ALERT';

      let px1 = videoW * 0.25, py1 = videoH * 0.65, px2 = videoW * 0.75, py2 = videoH * 0.85;
      if (plate.plate_bbox && plate.plate_bbox.length === 4) {
        [px1, py1, px2, py2] = plate.plate_bbox;
      }

      ctx.strokeStyle = plateColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(px1, py1, px2 - px1, py2 - py1);

      const plateLabel = `PLATE: ${plate.license_plate} [${statusTag}] ${Math.round(plate.confidence * 100)}%`;
      ctx.font = 'bold 11px monospace';
      const tagW = ctx.measureText(plateLabel).width + 8;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px1, Math.max(0, py1 - 22), tagW, 22);
      ctx.strokeStyle = plateColor;
      ctx.strokeRect(px1, Math.max(0, py1 - 22), tagW, 22);
      ctx.fillStyle = plateColor;
      ctx.fillText(plateLabel, px1 + 4, Math.max(14, py1 - 6));
    }
  };

  // Mount effect
  useEffect(() => {
    enumerateVideoDevices();
    startCamera();

    return () => {
      stopCameraStream();
    };
  }, []);

  const handleDeviceSwitch = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  const handleStopClick = () => {
    stopCameraStream();
    setStatus('Stopped');
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
                stopCameraStream();
                onClose();
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
              <span className="text-emerald-400 font-bold">
                YOLOv8 DETECT + PADDLEOCR | {fps} FPS
              </span>
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
