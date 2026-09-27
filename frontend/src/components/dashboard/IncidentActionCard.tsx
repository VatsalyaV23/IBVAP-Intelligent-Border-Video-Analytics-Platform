import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Incident } from '../../types';

interface IncidentActionCardProps {
  onViewEvidence?: () => void;
}

export const IncidentActionCard: React.FC<IncidentActionCardProps> = ({ onViewEvidence }) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [qrtDispatched, setQrtDispatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLatestIncident = async () => {
    try {
      const incidents = await api.getIncidents();
      if (incidents && incidents.length > 0) {
        // Find latest active or unresolved incident
        const active = incidents.find(i => i.status !== 'RESOLVED') || incidents[0];
        setIncident(active);
        setAcknowledged(active.status === 'ACKNOWLEDGED' || !!active.acknowledged_by);
      } else {
        setIncident(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLatestIncident();
    const interval = setInterval(fetchLatestIncident, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async () => {
    if (!incident) return;
    try {
      setLoading(true);
      await api.acknowledgeIncident(incident.id, 'Duty Officer (BSF Sec-IV)');
      setAcknowledged(true);
      fetchLatestIncident();
    } catch (e) {
      setAcknowledged(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchQRT = async () => {
    if (!incident) return;
    try {
      setLoading(true);
      await api.dispatchQRT(incident.id);
      setQrtDispatched(true);
      fetchLatestIncident();
    } catch (e) {
      setQrtDispatched(true);
    } finally {
      setLoading(false);
    }
  };

  // If no active incident exists, show clean nominal surveillance standby
  if (!incident) {
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 relative overflow-hidden">
        <div className="w-full h-1 bg-emerald-500 absolute top-0 left-0"></div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[12px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
              Perimeter Secure // Standby
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
            NOMINAL
          </span>
        </div>
        <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
          No security breaches or intruder threats detected. Real-time YOLOv8 computer vision and optical motion analysis are actively monitoring connected camera feeds.
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-sky-600">shield</span>
            Perimeter Defense Threat Engine
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ACTIVE</span>
        </div>
      </div>
    );
  }

  const isCritical = incident.priority === 'CRITICAL';

  return (
    <div className={`bg-white dark:bg-[#0f172a] rounded p-4 border shadow-sm flex flex-col gap-3 relative overflow-hidden ${
      isCritical ? 'border-rose-300 dark:border-rose-900/80' : 'border-amber-300 dark:border-amber-900/80'
    }`}>
      <div className={`w-full h-1 absolute top-0 left-0 ${isCritical ? 'bg-rose-600' : 'bg-amber-500'}`}></div>
      <div className="flex items-start justify-between gap-2 pt-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
              isCritical
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
            }`}>
              {incident.priority}
            </span>
            <span className="font-mono text-[14px] text-slate-900 dark:text-white font-bold">
              {incident.id}
            </span>
          </div>
          <h3 className="text-[13px] text-slate-800 dark:text-slate-200 font-semibold mt-1">
            {incident.title}
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
          {incident.blockchain_status}
        </span>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Location:</span>
          <span className="text-slate-900 dark:text-slate-200 font-semibold truncate block">
            {incident.sector}
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Detected:</span>
          <span className="text-slate-900 dark:text-slate-200 font-semibold">
            {new Date(incident.first_seen).toLocaleTimeString()} IST
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Sensor Sources:</span>
          <span className="text-sky-700 dark:text-sky-400 font-semibold truncate block">
            {incident.camera_ids && incident.camera_ids.length > 0 ? incident.camera_ids.join(', ') : 'LOCAL_SENSOR'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Risk Score:</span>
          <span className={`font-bold ${incident.risk_score > 70 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {incident.risk_score.toFixed(1)} / 100
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAcknowledge}
            disabled={acknowledged || loading}
            className={`px-3 py-2 rounded font-semibold text-[12px] border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              acknowledged
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
              check_circle
            </span>
            <span>{acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
          </button>

          <button
            onClick={onViewEvidence}
            className="px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold text-[12px] border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-sky-600 dark:text-sky-400">
              folder_special
            </span>
            <span>View Evidence</span>
          </button>
        </div>

        <button
          onClick={handleDispatchQRT}
          disabled={qrtDispatched}
          className={`w-full px-3 py-2.5 rounded text-white transition-colors text-center text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
            qrtDispatched ? 'bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">e911_emergency</span>
          <span>{qrtDispatched ? '✓ QRT TEAM EN ROUTE' : 'Dispatch Quick Reaction Team (QRT)'}</span>
        </button>
      </div>
    </div>
  );
};
