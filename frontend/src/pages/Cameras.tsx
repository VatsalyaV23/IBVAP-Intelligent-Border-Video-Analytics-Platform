import React, { useState, useEffect } from 'react';
import { api, getMediaUrl } from '../api/client';
import { Camera } from '../types';
import { ConnectCameraModal } from '../components/camera/ConnectCameraModal';

export const Cameras: React.FC = () => {
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
      console.error(e);
    }
  };

  const scanHardware = async () => {
    try {
      setScanning(true);
      const res = await api.scanHardwareCameras();
      setHardwareDevices(res.detected_cameras || []);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    scanHardware();
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
      await api.connectHardwareCamera(index, name, `Hardware Port ${index}`);
      fetchCameras();
      scanHardware();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to connect');
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

  return (
    <div className="w-full px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header section with responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-600 text-[24px]">videocam</span>
            Active Camera Sensor Inventory
          </h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Manage physical USB webcams, RTSP IP video feeds, and uploaded perimeter footage with IBVAP AI
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              try {
                await api.connectHardwareCamera(0, 'Integrated Laptop Webcam', 'Built-in Camera (Index 0)');
                await fetchCameras();
              } catch (e: any) {
                alert(e?.response?.data?.detail || 'Failed to connect laptop camera');
              }
            }}
            className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">laptop_chromebook</span>
            Use Laptop Camera
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded bg-sky-700 hover:bg-sky-800 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Connect Camera / Upload Video
          </button>
        </div>
      </div>

      {/* Auto-detected Hardware Ports Strip */}
      <div className="p-4 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">usb</span>
            <span className="font-bold text-[13px] text-slate-900 dark:text-white">
              Local Hardware Ports &amp; Physical Webcams
            </span>
          </div>
          <button
            onClick={scanHardware}
            disabled={scanning}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className={`material-symbols-outlined text-[13px] ${scanning ? 'animate-spin' : ''}`}>refresh</span>
            {scanning ? 'Scanning...' : 'Rescan Ports'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-[11px]">
          {hardwareDevices.map(d => {
            const isAlreadyConnected = cameras.some(c => c.stream_url === String(d.index));
            return (
              <div
                key={d.index}
                className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-bold text-slate-900 dark:text-white truncate">{d.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Port Index #{d.index} · {d.resolution}
                  </span>
                </div>
                {isAlreadyConnected ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                    ● CONNECTED
                  </span>
                ) : (
                  <button
                    onClick={() => handleQuickConnect(d.index, d.name)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase transition-colors cursor-pointer shrink-0"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
          {hardwareDevices.length === 0 && !scanning && (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 text-slate-500 dark:text-slate-400 text-[11px] py-2">
              No physical USB webcams found on local ports. Connect a USB camera or configure an RTSP IP camera above.
            </div>
          )}
        </div>
      </div>

      {/* Connected Cameras Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[14px] text-slate-900 dark:text-white flex items-center gap-2">
            Active Surveillance Feeds
            <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[11px]">
              {cameras.length}
            </span>
          </h3>
        </div>
        
        {cameras.length === 0 && (
          <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-[#0f172a] font-mono text-[12px] text-slate-500">
            No active cameras connected. Click &quot;Use Laptop Camera&quot; or &quot;Connect Camera / Upload Video&quot; to begin.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map(cam => (
            <div
              key={cam.id}
              className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* 16:9 Aspect Video Stream Display */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt={`Preview ${cam.id}`}
                    src={`${getMediaUrl(`/api/cameras/${cam.id}/stream`)}?t=${mountKey}`}
                    onError={(e) => {
                      setTimeout(() => {
                        if (e.currentTarget) {
                          e.currentTarget.src = getMediaUrl(`/api/cameras/${cam.id}/stream?t=${Date.now()}`);
                        }
                      }, 2000);
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-bold">
                    {cam.id}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-600/40 font-mono text-[10px] flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${cam.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                    {cam.is_active ? 'ACTIVE' : 'STANDBY'}
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-4 flex flex-col gap-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{cam.name}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{cam.stream_type}</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{cam.location}</span>
                  
                  <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                    <span className="text-slate-400">Stream Source:</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold truncate max-w-[180px]" title={cam.stream_url || ''}>
                      {cam.stream_url || cam.stream_type}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Resolution &amp; FPS:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{cam.resolution} @ {cam.fps} FPS</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleReconnect(cam.id)}
                    disabled={reconnectingId === cam.id}
                    className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reconnect stream"
                  >
                    <span className={`material-symbols-outlined text-[12px] ${reconnectingId === cam.id ? 'animate-spin' : ''}`}>
                      sync
                    </span>
                    {reconnectingId === cam.id ? 'Reconnecting...' : 'Reconnect'}
                  </button>
                  <button
                    onClick={() => handleOpenTelemetry(cam)}
                    className="px-2 py-1 rounded bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-sky-200 dark:border-sky-800"
                    title="View diagnostics and health telemetry"
                  >
                    <span className="material-symbols-outlined text-[12px]">speed</span>
                    Diagnostics
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(cam.id)}
                    disabled={togglingId === cam.id}
                    className={`px-2 py-1 rounded font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                      cam.is_active
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {cam.is_active ? 'Pause Feed' : 'Resume Feed'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(cam.id)}
                    className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry & Diagnostics Modal */}
      {activeTelemetry.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-mono text-[12px]">
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
                      {activeTelemetry.data?.state || 'STREAMING'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">Real-time FPS:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeTelemetry.data?.fps ?? 0} FPS
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">Resolution:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeTelemetry.data?.resolution || '1280x720'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400">Latency:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeTelemetry.data?.latency_ms ?? 24} ms
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
