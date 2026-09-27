import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { useCamera } from '../../context/CameraContext';

interface ConnectCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraAdded: () => void;
}

export const ConnectCameraModal: React.FC<ConnectCameraModalProps> = ({ isOpen, onClose, onCameraAdded }) => {
  const { startCamera } = useCamera();
  const [activeTab, setActiveTab] = useState<'hardware' | 'ip' | 'file'>('hardware');
  const [hardwareCameras, setHardwareCameras] = useState<Array<{ index: number; name: string; resolution: string; fps: number }>>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    code?: string;
    message?: string;
    error?: string;
    resolution?: string;
    fps?: number;
    codec?: string;
    latency_ms?: number;
    troubleshooting?: string;
  } | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  // IP Camera Form
  const [ipForm, setIpForm] = useState({
    id: `CAM-IP-${Math.floor(100 + Math.random() * 900)}`,
    name: 'Perimeter IP Sensor',
    ip_or_url: 'rtsp://admin:password@192.168.1.100:554/h264',
    location: 'Border Post Beta-2',
    is_thermal: false
  });

  // Video File Upload Form
  const [fileForm, setFileForm] = useState({
    id: `CAM-VID-${Math.floor(100 + Math.random() * 900)}`,
    name: 'Tactical Recon Footage',
    location: 'Sector 4 Buffer Zone',
    file: null as File | null
  });

  // Scan hardware cameras when opened
  useEffect(() => {
    if (isOpen && activeTab === 'hardware') {
      scanHardware();
    }
  }, [isOpen, activeTab]);

  const scanHardware = async () => {
    try {
      setScanning(true);
      const res = await api.scanHardwareCameras();
      setHardwareCameras(res.detected_cameras || []);
    } catch (e) {
      console.error('Scan error', e);
    } finally {
      setScanning(false);
    }
  };

  const handleConnectHardware = async (cam: { index: number; name: string }) => {
    try {
      setConnecting(true);
      await startCamera(String(cam.index));
      try {
        await api.connectHardwareCamera(cam.index, cam.name, `Local Device Port ${cam.index}`);
      } catch (e) {
        console.log('Hardware camera registered on client');
      }
      onCameraAdded();
      onClose();
    } catch (e: any) {
      alert(e?.message || 'Failed to connect camera');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectLaptopWebcam = async () => {
    try {
      setConnecting(true);
      await startCamera();
      try {
        await api.connectHardwareCamera(0, 'Integrated Laptop Webcam', 'Built-in Camera (Index 0)');
      } catch (e) {
        console.log('Laptop camera registered on client');
      }
      onCameraAdded();
      onClose();
    } catch (e: any) {
      alert(e?.message || 'Failed to connect laptop camera');
    } finally {
      setConnecting(false);
    }
  };

  const handleTestIpConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testCameraConnection(ipForm.ip_or_url);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        code: 'NETWORK_ERROR',
        message: e?.response?.data?.detail || 'Failed to communicate with diagnostic test engine.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConnectIpCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConnecting(true);
      await api.connectIpCamera(ipForm.id, ipForm.name, ipForm.ip_or_url, ipForm.location);
      onCameraAdded();
      onClose();
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (typeof detail === 'object' && detail?.message) {
        setTestResult(detail);
      } else {
        alert(detail || 'Failed to connect IP camera');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileForm.file) {
      alert('Please select a video file (.mp4, .avi, .mkv)');
      return;
    }
    try {
      setConnecting(true);
      const formData = new FormData();
      formData.append('file', fileForm.file);
      formData.append('camera_id', fileForm.id);
      formData.append('name', fileForm.name);
      formData.append('location', fileForm.location);

      await api.uploadVideoCamera(formData);
      onCameraAdded();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to upload video stream');
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-sky-600 dark:text-sky-400">videocam</span>
            <h3 className="font-bold text-[15px] text-slate-900 dark:text-white">Connect Camera Sensor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-[#0f172a]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">usb</span>
            <span>USB / Webcam</span>
          </button>
          <button
            onClick={() => setActiveTab('ip')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ip'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-[#0f172a]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">router</span>
            <span>IP Camera (RTSP)</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-[#0f172a]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">video_file</span>
            <span>Upload Video</span>
          </button>
        </div>

        {/* Tab 1: Hardware Cameras */}
        {activeTab === 'hardware' && (
          <div className="p-5 flex flex-col gap-4">
            {/* Quick 1-Click Laptop Camera Action */}
            <div className="p-3.5 rounded-lg border-2 border-sky-500/60 bg-sky-50/80 dark:bg-sky-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">laptop_chromebook</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-slate-900 dark:text-white">Use Laptop Camera</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-300 font-mono text-[9px] font-bold">1-CLICK</span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono block">
                    Directly connects integrated webcam (Device 0) with real-time YOLO AI tracking
                  </span>
                </div>
              </div>
              <button
                onClick={handleConnectLaptopWebcam}
                disabled={connecting}
                className="px-3.5 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-mono text-[11px] font-bold uppercase transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[15px]">videocam</span>
                <span>{connecting ? 'Activating...' : 'Activate Camera'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Detected Hardware USB Ports:
              </span>
              <button
                onClick={scanHardware}
                disabled={scanning}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-400 font-mono text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className={`material-symbols-outlined text-[14px] ${scanning ? 'animate-spin' : ''}`}>refresh</span>
                {scanning ? 'Scanning...' : 'Rescan Hardware'}
              </button>
            </div>

            {hardwareCameras.length === 0 && !scanning && (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded font-mono text-[12px] text-slate-500">
                No physical USB cameras detected. Plug in a webcam and click 'Rescan Hardware', or connect an IP camera.
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {hardwareCameras.map((cam) => (
                <div
                  key={cam.index}
                  className="p-3.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px] text-slate-900 dark:text-white">{cam.name}</span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        Resolution: {cam.resolution} | Device Port #{cam.index}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnectHardware(cam)}
                    disabled={connecting}
                    className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
                  >
                    {connecting ? 'Connecting...' : 'Connect Sensor'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: IP Camera Form with Diagnostics */}
        {activeTab === 'ip' && (
          <form onSubmit={handleConnectIpCamera} className="p-5 flex flex-col gap-3 font-mono text-[12px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Camera Sensor ID:</label>
                <input
                  type="text"
                  value={ipForm.id}
                  onChange={e => setIpForm({ ...ipForm, id: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-[13px]"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Camera Name / Label:</label>
                <input
                  type="text"
                  value={ipForm.name}
                  onChange={e => setIpForm({ ...ipForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-[13px]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">
                RTSP / HTTP Stream URL (Credentials Redacted in API):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="rtsp://admin:pass@192.168.1.100:554/h264"
                  value={ipForm.ip_or_url}
                  onChange={e => {
                    setIpForm({ ...ipForm, ip_or_url: e.target.value });
                    setTestResult(null);
                  }}
                  className="flex-1 px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px]"
                  required
                />
                <button
                  type="button"
                  onClick={handleTestIpConnection}
                  disabled={testing || !ipForm.ip_or_url}
                  className="px-3.5 py-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-400 font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className={`material-symbols-outlined text-[15px] ${testing ? 'animate-spin' : ''}`}>
                    {testing ? 'sync' : 'network_check'}
                  </span>
                  <span>{testing ? 'Testing...' : 'Test Diagnostics'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Result Box */}
            {testResult && (
              <div
                className={`p-3 rounded font-mono text-[11px] border flex flex-col gap-1.5 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      {testResult.success ? 'check_circle' : 'error'}
                    </span>
                    {testResult.code || (testResult.success ? 'CAMERA_CONNECTED' : 'CONNECTION_FAILED')}
                  </span>
                  {testResult.latency_ms !== undefined && (
                    <span className="text-[10px] opacity-80">Latency: {testResult.latency_ms} ms</span>
                  )}
                </div>
                <p className="text-[11px] leading-tight">{testResult.message || testResult.error}</p>
                {testResult.resolution && (
                  <div className="flex items-center gap-2 text-[10px] opacity-90">
                    <span>Resolution: {testResult.resolution}</span>
                    <span>•</span>
                    <span>FPS: {testResult.fps || 25}</span>
                    <span>•</span>
                    <span>Codec: {testResult.codec || 'H264'}</span>
                  </div>
                )}
                {testResult.troubleshooting && (
                  <div className="mt-1 pt-1.5 border-t border-rose-200 dark:border-rose-900/60 text-[10px] text-rose-700 dark:text-rose-300">
                    <span className="font-bold">Troubleshooting: </span>
                    {testResult.troubleshooting}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Perimeter Sector / Post:</label>
              <input
                type="text"
                value={ipForm.location}
                onChange={e => setIpForm({ ...ipForm, location: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connecting}
                className="px-4 py-2 rounded bg-sky-700 hover:bg-sky-800 text-white font-bold uppercase transition-colors cursor-pointer"
              >
                {connecting ? 'Saving...' : 'Save & Connect Stream'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Upload Video File */}
        {activeTab === 'file' && (
          <form onSubmit={handleUploadVideo} className="p-5 flex flex-col gap-3 font-mono text-[12px]">
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded border border-sky-200 dark:border-sky-900 text-sky-800 dark:text-sky-300 text-[11px]">
              Upload recorded tactical footage (MP4 / AVI / MKV). The AI engine will loop and process this file with real-time YOLO object detection, tracking, and event correlation.
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Sensor Identifier:</label>
              <input
                type="text"
                value={fileForm.id}
                onChange={e => setFileForm({ ...fileForm, id: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Stream Name:</label>
              <input
                type="text"
                value={fileForm.name}
                onChange={e => setFileForm({ ...fileForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">Select Video File (.mp4, .avi, .mkv):</label>
              <input
                type="file"
                accept=".mp4,.avi,.mkv,.mov"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setFileForm({ ...fileForm, file: e.target.files[0] });
                  }
                }}
                className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[11px] file:bg-sky-600 file:text-white cursor-pointer"
                required
              />
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connecting}
                className="px-4 py-2 rounded bg-sky-700 hover:bg-sky-800 text-white font-bold uppercase transition-colors cursor-pointer"
              >
                {connecting ? 'Uploading...' : 'Upload & Start Stream'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
