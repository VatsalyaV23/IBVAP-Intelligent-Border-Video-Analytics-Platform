import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Camera } from '../types';
import { TacticalSensorMatrix } from '../components/dashboard/TacticalSensorMatrix';

export const LiveCameras: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>('ALL');

  const fetchCams = async () => {
    try {
      const data = await api.getCameras();
      setCameras(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCams();
    const interval = setInterval(fetchCams, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 py-6 flex flex-col gap-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-600 text-[24px]">sensors</span>
            Live Multi-Camera Surveillance
          </h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Real-time tactical video feeds with AI bounding boxes, object tracking vectors, and motion analytics
          </p>
        </div>
        {cameras.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCam('ALL')}
              className={`px-3 py-1 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                selectedCam === 'ALL'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              ALL ({cameras.length})
            </button>
            {cameras.map(cam => (
              <button
                key={cam.id}
                onClick={() => setSelectedCam(cam.id)}
                className={`px-3 py-1 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  selectedCam === cam.id
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cam.id}
              </button>
            ))}
          </div>
        )}
      </div>

      <TacticalSensorMatrix selectedCam={selectedCam} />
    </div>
  );
};
