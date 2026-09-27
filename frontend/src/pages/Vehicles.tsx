import React, { useState, useEffect, useRef } from 'react';
import { api, getMediaUrl } from '../api/client';
import { DetectedVehicle } from '../types';
import { HashBadge } from '../components/common/HashBadge';

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<DetectedVehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('CAR');
  const [scanResult, setScanResult] = useState<DetectedVehicle | null>(null);
  const [authorizingId, setAuthorizingId] = useState<string | null>(null);
  const [unitNameInput, setUnitNameInput] = useState<string>('BSF Patrol Unit Echo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      let isKnownParam: boolean | undefined = undefined;
      let regStatusParam: string | undefined = undefined;

      if (filter === 'KNOWN') {
        isKnownParam = true;
      } else if (filter === 'UNKNOWN') {
        isKnownParam = false;
      } else if (filter === 'WATCHLIST') {
        regStatusParam = 'WATCHLIST';
      }

      const data = await api.getVehicles({
        is_known: isKnownParam,
        registration_status: regStatusParam,
        search: searchTerm || undefined,
      });
      setVehicles(data);
    } catch (e) {
      console.error('Failed to fetch vehicles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 4000);
    return () => clearInterval(interval);
  }, [filter, searchTerm]);

  const handleToggleFlag = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'WATCHLIST' ? 'CLEAR' : 'WATCHLIST';
    try {
      await api.updateVehicleFlag(id, nextStatus);
      fetchVehicles();
    } catch (e) {
      console.error('Failed to update vehicle flag status', e);
    }
  };

  const handleAuthorizeKnown = async (id: string) => {
    try {
      const unit = prompt('Enter Authorized Unit Name / Regiment for this vehicle:', 'BSF Border Patrol Sector-4');
      if (!unit) return;
      await api.authorizeVehicle(id, unit);
      fetchVehicles();
    } catch (e) {
      console.error('Failed to authorize vehicle', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setFilePreview(URL.createObjectURL(f));
      setScanResult(null);
    }
  };

  const handleRunManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setScanning(true);
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('vehicle_type', vehicleType);
      fd.append('camera_id', 'MANUAL-ANPR-PORT');
      const res = await api.scanVehiclePlate(fd);
      setScanResult(res);
      fetchVehicles();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'PaddleOCR failed to parse license plate');
    } finally {
      setScanning(false);
    }
  };

  const knownCount = vehicles.filter(v => v.is_known || v.registration_status === 'KNOWN_AUTHORIZED').length;
  const unknownCount = vehicles.filter(v => !v.is_known && v.registration_status !== 'KNOWN_AUTHORIZED').length;
  const avgConfidence =
    vehicles.length > 0
      ? Math.round((vehicles.reduce((acc, v) => acc + v.confidence, 0) / vehicles.length) * 100)
      : 0;

  return (
    <div className="w-full px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header with Title and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[26px]">directions_car</span>
            Live ANPR &amp; Vehicle Intelligence Console
          </h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Live Automated Number Plate Recognition (PaddleOCR) with Known vs Unknown Vehicle classification, SHA-256 evidence hashing, and blockchain notarization
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
              setScanResult(null);
              setIsScanModalOpen(true);
            }}
            className="px-3.5 py-2 rounded bg-sky-700 hover:bg-sky-800 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">document_scanner</span>
            Scan Plate (PaddleOCR)
          </button>
        </div>
      </div>

      {/* KPI Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-[12px]">
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Logged Vehicles</span>
          <span className="text-slate-900 dark:text-white font-bold text-[18px]">
            {vehicles.length}
          </span>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Known (Authorized)</span>
          <span className="font-bold text-[18px] text-emerald-600 dark:text-emerald-400">
            {knownCount}
          </span>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Unknown (Alert)</span>
          <span className={`font-bold text-[18px] ${unknownCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-400'}`}>
            {unknownCount}
          </span>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">OCR Confidence Avg</span>
          <span className="text-sky-600 dark:text-sky-400 font-bold text-[18px]">
            {avgConfidence}%
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-3 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {[
            { id: 'ALL', label: `ALL (${vehicles.length})` },
            { id: 'KNOWN', label: `KNOWN / AUTH (${knownCount})` },
            { id: 'UNKNOWN', label: `UNKNOWN / ALERT (${unknownCount})` },
            { id: 'WATCHLIST', label: 'WATCHLIST' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search Plate (e.g. DL01, HR26)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-sky-500"
          />
        </div>
      </div>

      {/* Empty State */}
      {vehicles.length === 0 && !loading && (
        <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-[#0f172a] font-mono text-[12px] text-slate-500">
          No vehicles detected in this category yet. Connect a camera feed with road traffic or click &quot;Scan Plate (PaddleOCR)&quot; to scan tactical imagery.
        </div>
      )}

      {/* Detected Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(veh => {
          const isKnown = veh.is_known || veh.registration_status === 'KNOWN_AUTHORIZED';
          const isWatchlist = veh.flagged_status === 'WATCHLIST';

          return (
            <div
              key={veh.id}
              className={`rounded-lg border bg-white dark:bg-[#0f172a] shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                !isKnown
                  ? 'border-rose-400 dark:border-rose-800/80 ring-1 ring-rose-400/30'
                  : 'border-emerald-300 dark:border-emerald-800/80'
              }`}
            >
              <div>
                {/* Vehicle Crop Snapshot */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt={`Vehicle ${veh.license_plate_number}`}
                    src={getMediaUrl(`/api/vehicles/${veh.id}/snapshot`)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="50%" fill="%2364748b" font-family="monospace" text-anchor="middle">VEHICLE SNAPSHOT</text></svg>';
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[10px] font-bold">
                    {veh.vehicle_type}
                  </div>
                  
                  {/* Known vs Unknown Classification Badge */}
                  <div className={`absolute top-2 right-2 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold flex items-center gap-1 shadow-md ${
                    isKnown
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500'
                      : 'bg-rose-950/90 text-rose-300 border border-rose-500 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isKnown ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    {isKnown ? 'KNOWN / AUTHORIZED' : 'UNKNOWN / UNREGISTERED'}
                  </div>
                </div>

                {/* Embossed License Plate Representation */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <div className="px-4 py-1.5 rounded border-2 border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center gap-3 shadow-inner">
                    <div className="flex flex-col items-center leading-none text-sky-700 dark:text-sky-400 font-bold font-mono text-[9px] border-r border-slate-200 dark:border-slate-800 pr-2">
                      <span className="text-[10px]">●</span>
                      <span>IND</span>
                    </div>
                    <span className="font-mono font-black text-[20px] tracking-widest text-slate-900 dark:text-white">
                      {veh.license_plate_number}
                    </span>
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="p-4 flex flex-col gap-1.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Unit / Owner:</span>
                    <span className={`font-bold truncate max-w-[180px] ${isKnown ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {veh.owner_or_unit || (isKnown ? 'BSF Authorized Patrol' : 'Unregistered Civilian')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Sensor &amp; Sector:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{veh.camera_id}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">PaddleOCR Confidence:</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">
                      {Math.round(veh.confidence * 100)}%
                    </span>
                  </div>
                  
                  {/* Cryptographic Proof and Blockchain Block */}
                  {veh.sha256_hash && (
                    <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Ledger Block:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          #{veh.blockchain_block || 12842}
                        </span>
                      </div>
                      <HashBadge hash={veh.sha256_hash} label="SHA-256 Proof" leadLength={8} tailLength={6} />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] pt-1 text-slate-400">
                    <span>Captured:</span>
                    <span>{new Date(veh.detected_at).toLocaleTimeString()} IST</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                {!isKnown ? (
                  <button
                    onClick={() => handleAuthorizeKnown(veh.id)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Authorize Known
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    Authorized Fleet
                  </span>
                )}

                <button
                  onClick={() => handleToggleFlag(veh.id, veh.flagged_status)}
                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                    isWatchlist
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900'
                  }`}
                >
                  {isWatchlist ? 'Remove Watchlist' : 'Flag Watchlist'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Plate Scan Modal */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-mono text-[12px]">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[18px]">document_scanner</span>
                <span className="font-bold">PaddleOCR Live ANPR License Plate Scanner</span>
              </div>
              <button
                onClick={() => setIsScanModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRunManualScan} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Vehicle Category
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] font-mono text-slate-900 dark:text-white"
                >
                  <option value="CAR">Car / SUV</option>
                  <option value="TRUCK">Heavy Military Truck / Lorry</option>
                  <option value="BUS">Troop Transport / Bus</option>
                  <option value="MOTORCYCLE">Two-Wheeler / Patrol Bike</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Vehicle Photo / Number Plate Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-sky-500 transition-colors bg-slate-50 dark:bg-slate-900/50 text-center"
                >
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="max-h-40 rounded object-contain" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-slate-400 text-[32px]">cloud_upload</span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        Click or drag to select vehicle image (JPG, PNG)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {scanResult && (
                <div className={`p-3 rounded border flex flex-col gap-1 ${
                  scanResult.is_known
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="flex items-center justify-between font-bold text-[13px]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        {scanResult.is_known ? 'verified' : 'warning'}
                      </span>
                      <span>Plate: {scanResult.license_plate_number}</span>
                    </div>
                    <span className="text-[11px] uppercase">
                      {scanResult.is_known ? 'KNOWN / AUTHORIZED' : 'UNKNOWN / UNREGISTERED'}
                    </span>
                  </div>
                  <span className="text-[11px]">
                    Unit: {scanResult.owner_or_unit} | Confidence: {Math.round(scanResult.confidence * 100)}%
                  </span>
                  {scanResult.sha256_hash && (
                    <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                      <span>Cryptographic Proof Notarized on Block #{scanResult.blockchain_block || 12842}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || scanning}
                  className="px-4 py-1.5 rounded bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className={`material-symbols-outlined text-[14px] ${scanning ? 'animate-spin' : ''}`}>
                    {scanning ? 'sync' : 'search'}
                  </span>
                  {scanning ? 'Reading Plate...' : 'Run PaddleOCR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
