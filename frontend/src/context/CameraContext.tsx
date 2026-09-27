import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

export interface CameraDeviceOption {
  deviceId: string;
  label: string;
}

export interface DetectionItem {
  class: string;
  confidence: number;
  tracking_id: string;
  bbox: [number, number, number, number];
}

export interface PlateScannedInfo {
  license_plate: string;
  confidence: number;
  is_known: boolean;
  owner_or_unit: string;
  plate_bbox?: [number, number, number, number];
}

export interface CameraContextType {
  status: 'Disconnected' | 'Requesting Permission' | 'Permission Denied' | 'Connecting' | 'Connected' | 'Camera Error' | 'Camera Unavailable' | 'Stopped';
  errorMessage: string | null;
  devices: CameraDeviceOption[];
  selectedDeviceId: string;
  fps: number;
  resolution: string;
  detections: DetectionItem[];
  latestPlate: PlateScannedInfo | null;
  isSystemCamActive: boolean;
  stream: MediaStream | null;
  startCamera: (deviceIdToUse?: string) => Promise<void>;
  stopCamera: () => void;
  handleDeviceSwitch: (newDeviceId: string) => void;
  attachVideoElement: (videoEl: HTMLVideoElement | null) => void;
  detachVideoElement: (videoEl: HTMLVideoElement | null) => void;
  attachOverlayCanvasElement: (canvasEl: HTMLCanvasElement | null) => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const [isSystemCamActive, setIsSystemCamActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoElementsRef = useRef<Set<HTMLVideoElement>>(new Set());
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<boolean>(false);
  const frameCounterRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(Date.now());

  // Enumerate physical video devices
  const enumerateVideoDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
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

  const attachVideoElement = (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    videoElementsRef.current.add(videoEl);
    activeVideoRef.current = videoEl;
    if (streamRef.current) {
      try {
        if (videoEl.srcObject !== streamRef.current) {
          videoEl.srcObject = streamRef.current;
        }
        videoEl.play().catch(() => {});
      } catch (e) {
        console.error('Error attaching stream to video element:', e);
      }
    }
  };

  const detachVideoElement = (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    videoElementsRef.current.delete(videoEl);
    if (activeVideoRef.current === videoEl) {
      activeVideoRef.current = Array.from(videoElementsRef.current)[0] || null;
    }
  };

  const attachOverlayCanvasElement = (canvasEl: HTMLCanvasElement | null) => {
    overlayCanvasRef.current = canvasEl;
  };

  const stopCameraStreamInternal = () => {
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
    setStream(null);
    videoElementsRef.current.forEach(v => {
      v.srcObject = null;
    });
    processingRef.current = false;
    setDetections([]);
    setFps(0);
  };

  const stopCamera = () => {
    stopCameraStreamInternal();
    setIsSystemCamActive(false);
    setStatus('Stopped');
  };

  const startInferenceLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (processingRef.current) return;

      const video = activeVideoRef.current || Array.from(videoElementsRef.current)[0];
      if (!video || video.readyState < 2) return;

      const rawW = video.videoWidth || 640;
      const rawH = video.videoHeight || 480;

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

            frameCounterRef.current += 1;
            const now = Date.now();
            const elapsed = (now - lastFpsTimeRef.current) / 1000;
            if (elapsed >= 1.0) {
              setFps(Math.round(frameCounterRef.current / elapsed));
              frameCounterRef.current = 0;
              lastFpsTimeRef.current = now;
            }

            drawDetectionsOverlay(result.detections || [], result.plate_scanned, targetW, targetH);
          }
        } catch (e) {
          // Silent frame drop recovery
        } finally {
          processingRef.current = false;
        }
      }, 'image/jpeg', 0.70);
    }, 180);
  };

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

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

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

  const startCamera = async (deviceIdToUse?: string) => {
    // If stream is already connected and using same device, don't restart tracks
    if (streamRef.current && streamRef.current.active && (!deviceIdToUse || deviceIdToUse === selectedDeviceId)) {
      setIsSystemCamActive(true);
      setStatus('Connected');
      videoElementsRef.current.forEach(v => {
        if (v.srcObject !== streamRef.current) {
          v.srcObject = streamRef.current;
        }
        v.play().catch(() => {});
      });
      return;
    }

    stopCameraStreamInternal();
    setErrorMessage(null);
    setStatus('Requesting Permission');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('Camera Unavailable');
      setErrorMessage('Browser mediaDevices API is not supported in this environment (requires HTTPS or localhost).');
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
      setStream(mediaStream);
      setIsSystemCamActive(true);

      videoElementsRef.current.forEach(v => {
        v.srcObject = mediaStream;
        v.play().catch(() => {});
      });

      setStatus('Connected');
      await enumerateVideoDevices();

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setResolution(`${settings.width}x${settings.height}`);
        }
      }

      startInferenceLoop();
    } catch (err: any) {
      stopCameraStreamInternal();
      setIsSystemCamActive(false);
      console.error('Camera access error:', err);

      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setStatus('Permission Denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setStatus('Camera Unavailable');
        setErrorMessage('No physical camera device was detected on your system.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setStatus('Camera Error');
        setErrorMessage('Camera is currently in use by another application or operating system process.');
      } else if (errName === 'SecurityError') {
        setStatus('Camera Error');
        setErrorMessage('Security restriction: Camera access requires HTTPS or localhost.');
      } else {
        setStatus('Camera Error');
        setErrorMessage(err?.message || 'Failed to connect to physical webcam.');
      }
    }
  };

  const handleDeviceSwitch = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  useEffect(() => {
    enumerateVideoDevices();
  }, []);

  return (
    <CameraContext.Provider
      value={{
        status,
        errorMessage,
        devices,
        selectedDeviceId,
        fps,
        resolution,
        detections,
        latestPlate,
        isSystemCamActive,
        stream,
        startCamera,
        stopCamera,
        handleDeviceSwitch,
        attachVideoElement,
        detachVideoElement,
        attachOverlayCanvasElement
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};
