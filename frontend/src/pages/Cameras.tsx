import React, { useState, useEffect } from 'react';
import { api, getMediaUrl } from '../api/client';
import { Camera } from '../types';
import { ConnectCameraModal } from '../components/camera/ConnectCameraModal';
import { SystemCameraFeed } from '../components/camera/SystemCameraFeed';
import { useCamera } from '../context/CameraContext';

export const Cameras: React.FC = () => {
  const { startCamera, stopCamera, isSystemCamActive, status: systemStatus, fps: systemFps, resolution: systemRes, detections: systemDetections } = useCamera();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hardwareDevices, setHardwareDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<{
    isOpen: boolean;
    camera: Camera | null;
    data: any | null;
    loading: boolean;
  }>({
    isOpen: false,
    camera: null,
    data: null,
    loading: false,
  });
  const [mountKey] = useState<number>(() => Date.now());

  const fetchCameras = async () => {
    try {
      const data = await api.getCameras();
      setCameras(data);
    } catch (e) {
      console.error('Error fetching cameras:', e);
    }
  };

  const scanHardware = async () => {
    try {
      setScanning(true);
      const res = await api.scanHardwareCameras();
      setHardwareDevices(res.detected_cameras || []);
    } catch (e) {
      console.error('Error scanning hardware:', e);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    scanHardware();
    const interval = setInterval(fetchCameras, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async (id: string) => {
    if (window.confirm(`Disconnect camera sensor ${id}?`)) {
      try {
        await api.removeCamera(id);
        fetchCameras();
        scanHardware();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleQuickConnect = async (index: number, name: string) => {
    try {
      await startCamera(String(index));
      try {
        await api.connectHardwareCamera(index, name, `Hardware Port ${index}`);
      } catch (err) {
        console.log('Hardware camera registered on client');
      }
      fetchCameras();
      scanHardware();
    } catch (e: any) {
      alert(e?.message || 'Failed to connect physical webcam.');
    }
  };

  const handleReconnect = async (id: string) => {
    try {
      setReconnectingId(id);
      await api.reconnectCamera(id);
      await fetchCameras();
    } catch (e: any) {
      alert(e?.response?.data?.detail || `Failed to reconnect camera ${id}`);
    } finally {
      setReconnectingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      setTogglingId(id);
      await api.toggleCamera(id);
      await fetchCameras();
    } catch (e: any) {
      alert(e?.response?.data?.detail || `Failed to toggle camera ${id}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenTelemetry = async (cam: Camera) => {
    setActiveTelemetry({
      isOpen: true,
      camera: cam,
      data: null,
      loading: true,
    });
    try {
      const telem = await api.getCameraTelemetry(cam.id);
      setActiveTelemetry({
        isOpen: true,
        camera: cam,
        data: telem,
        loading: false,
      });
    } catch (e) {
      setActiveTelemetry({
        isOpen: true,
        camera: cam,
        data: { error: 'Failed to fetch real-time telemetry from backend stream manager.' },
        loading: false,
      });
    }
  };

  const systemPersonCount = systemDetections.filter(d => d.class === 'person').length;
  const systemVehicleCount = systemDetections.filter(d => ['car', 'truck', 'bus', 'motorcycle'].includes(d.class)).length;

  return (
    <div className="w-full px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-[1600px] mx-auto font-sans">
      {/* Header section with responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-600 text-[24px]">videocam</span>
            Surveillance Camera Inventory
          </h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Real-time multi-camera monitoring, YOLOv8 computer vision detection, and evidence logging
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isSystemCamActive ? (
            <button
              onClick={async () => {
                try {
                  await startCamera();
                  try {
                    await api.connectHardwareCamera(0, 'Integrated Laptop Webcam', 'Built-in Camera (Index 0)');
                  } catch (e) {
                    // Client fallback
                  }
                  await fetchCameras();
                } catch (err: any) {
                  alert(err?.message || 'Failed to connect laptop camera');
                }
              }}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">videocam</span>
              Start Laptop Camera
            </button>
          ) : (
            <button
              onClick={() => stopCamera()}
              className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">videocam_off</span>
              Stop Laptop Camera
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-sky-700 hover:bg-sky-800 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            Connect Camera / Video
          </button>
        </div>
      </div>

      {/* Auto-detected Hardware Ports Strip */}
      <div className="p-3 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">usb</span>
            <span className="font-bold text-[12px] text-slate-900 dark:text-white">
              Hardware Video Devices &amp; USB Ports
            </span>
          </div>
          <button
            onClick={scanHardware}
            disabled={scanning}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className={`material-symbols-outlined text-[12px] ${scanning ? 'animate-spin' : ''}`}>refresh</span>
            {scanning ? 'Scanning...' : 'Rescan Ports'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 font-mono text-[11px]">
          {hardwareDevices.map(d => {
            const isAlreadyConnected = cameras.some(c => c.stream_url === String(d.index)) || (d.index === 0 && isSystemCamActive);
            return (
              <div
                key={d.index}
                className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{d.name}</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400">
                    Port #{d.index} · {d.resolution}
                  </span>
                </div>
                {isAlreadyConnected ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                    ● ACTIVE
                  </span>
                ) : (
                  <button
                    onClick={() => handleQuickConnect(d.index, d.name)}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase transition-colors cursor-pointer shrink-0"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
          {hardwareDevices.length === 0 && !scanning && (
            <div className="col-span-full text-slate-500 dark:text-slate-400 text-[11px] py-1">
              No extra physical USB webcams detected. Standard built-in camera index available.
            </div>
          )}
        </div>
      </div>

      {/* Multi-Camera Responsive Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[14px] text-slate-900 dark:text-white flex items-center gap-2">
            Surveillance Feeds Grid
            <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[11px]">
              {cameras.length + (isSystemCamActive ? 1 : 0)} Active
            </span>
          </h3>
        </div>

        {/* Responsive Grid Layout: Exactly 3 camera cards per row on laptop/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* CARD 1: Physical Laptop Webcam Feed when System Cam Active */}
          {isSystemCamActive && (
            <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-sky-500/50 dark:border-sky-500/40 shadow-xs overflow-hidden flex flex-col justify-between font-mono text-[11px]">
              <div>
                {/* Card Header Bar */}
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span className="font-bold text-slate-900 dark:text-white truncate">SYSTEM-CAM</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase">
                    {systemStatus.toUpperCase()}
                  </span>
                </div>

                {/* System Camera Stream Container */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <SystemCameraFeed bare />
                </div>

                {/* Real-time YOLO Telemetry Metrics */}
                <div className="p-2.5 font-mono text-[10px] grid grid-cols-2 gap-1.5 bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">👤 Persons:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{systemPersonCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">🚗 Vehicles:</span>
                    <span className="font-bold text-amber-500">{systemVehicleCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">⚡ FPS:</span>
                    <span className="font-bold text-sky-400">{systemFps} FPS</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 truncate">
                    <span className="text-slate-400">📐 Res:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{systemRes}</span>
                  </div>
                </div>
              </div>

              {/* System Camera Action Bar */}
              <div className="p-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-[10px]">
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  STREAMING LIVE
                </span>
                <button
                  onClick={() => stopCamera()}
                  className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[11px]">videocam_off</span>
                  Stop Camera
                </button>
              </div>
            </div>
          )}

          {/* BACKEND CAMERAS CARDS */}
          {cameras.map(cam => {
            const isRec = reconnectingId === cam.id;
            const isTog = togglingId === cam.id;

            return (
              <div
                key={cam.id}
                className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Card Header Bar */}
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cam.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                      <span className="font-bold text-slate-900 dark:text-white truncate" title={cam.name}>{cam.id}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                      cam.is_active
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                    }`}>
                      {cam.is_active ? 'ONLINE' : 'STANDBY'}
                    </span>
                  </div>

                  {/* Video Player Display */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                    {cam.is_active ? (
                      <img
                        className="w-full h-full object-cover"
                        alt={`Feed ${cam.id}`}
                        src={`${getMediaUrl(`/api/cameras/${cam.id}/stream`)}?t=${mountKey}`}
                        onError={(e) => {
                          setTimeout(() => {
                            if (e.currentTarget) {
                              e.currentTarget.src = getMediaUrl(`/api/cameras/${cam.id}/stream?t=${Date.now()}`);
                            }
                          }, 2500);
                        }}
                      />
                    ) : (
                      <div className="p-4 text-center flex flex-col items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[28px] text-slate-600">videocam_off</span>
                        <span className="font-mono text-[11px] text-slate-400 font-bold">FEED STANDBY</span>
                        <button
                          onClick={() => handleToggle(cam.id)}
                          disabled={isTog}
                          className="mt-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {isTog ? 'Starting...' : 'Start Camera Feed'}
                        </button>
                      </div>
                    )}

                    {/* HUD Processing Status Badge */}
                    {cam.is_active && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-emerald-400 border border-emerald-600/40 font-mono text-[9px] font-bold backdrop-blur-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        YOLOv8 Active | {cam.fps} FPS
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] truncate max-w-[70%]">
                      {cam.name}
                    </div>
                  </div>

                  {/* YOLO Counts & Telemetry Grid */}
                  <div className="p-2.5 font-mono text-[10px] grid grid-cols-2 gap-1.5 bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">👤 Persons:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{cam.person_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">🚗 Vehicles:</span>
                      <span className="font-bold text-amber-500">{cam.vehicle_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">📁 Evidence:</span>
                      <span className="font-bold text-sky-400">{cam.evidence_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 truncate">
                      <span className="text-slate-400">🕒 Last:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                        {cam.last_detection_time ? new Date(cam.last_detection_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls Bar */}
                <div className="p-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-1.5 font-mono text-[10px]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(cam.id)}
                      disabled={isTog}
                      className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        cam.is_active
                          ? 'bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title={cam.is_active ? "Stop this camera feed" : "Start this camera feed"}
                    >
                      <span className="material-symbols-outlined text-[11px]">
                        {cam.is_active ? 'videocam_off' : 'videocam'}
                      </span>
                      {isTog ? 'Saving...' : cam.is_active ? 'Stop Camera' : 'Start Camera'}
                    </button>

                    <button
                      onClick={() => handleOpenTelemetry(cam)}
                      className="px-2 py-1 rounded bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold flex items-center gap-1 cursor-pointer border border-sky-200 dark:border-sky-800"
                      title="View camera metrics and diagnostics"
                    >
                      <span className="material-symbols-outlined text-[11px]">visibility</span>
                      View
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReconnect(cam.id)}
                      disabled={isRec}
                      className="px-1.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold flex items-center cursor-pointer"
                      title="Reconnect camera stream"
                    >
                      <span className={`material-symbols-outlined text-[12px] ${isRec ? 'animate-spin' : ''}`}>sync</span>
                    </button>

                    <button
                      onClick={() => handleDisconnect(cam.id)}
                      className="px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                      title="Remove camera"
                    >
                      <span className="material-symbols-outlined text-[12px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {cameras.length === 0 && !isSystemCamActive && (
          <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-[#0f172a] font-mono text-[12px] text-slate-500">
            No active cameras connected. Click &quot;Start Laptop Camera&quot; or &quot;Connect Camera / Video&quot; above to initialize feeds.
          </div>
        )}
      </div>

      {/* Telemetry & Diagnostics Modal */}
      {activeTelemetry.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono text-[12px]">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-[18px]">network_check</span>
                <span className="font-bold">Diagnostics: {activeTelemetry.camera?.id}</span>
              </div>
              <button
                onClick={() => setActiveTelemetry({ isOpen: false, camera: null, data: null, loading: false })}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {activeTelemetry.loading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-sky-600">sync</span>
                  <span>Fetching live stream metrics...</span>
                </div>
              ) : activeTelemetry.data?.error ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-900">
                  {activeTelemetry.data.error}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">Stream State:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {activeTelemetry.data?.status || 'STREAMING'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">Real-time FPS:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeTelemetry.data?.current_fps ?? 0} FPS
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">Resolution:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeTelemetry.data?.resolution || '640x480'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">Reconnection Attempts:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeTelemetry.data?.reconnect_count ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">AI Model Status:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      YOLOv8 Active (Human/Vehicle/Zone)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveTelemetry({ isOpen: false, camera: null, data: null, loading: false })}
                className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-[11px] font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <ConnectCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCameraAdded={() => {
          fetchCameras();
          scanHardware();
        }}
      />
    </div>
  );
};
