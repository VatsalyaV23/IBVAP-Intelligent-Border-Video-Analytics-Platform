import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Incident } from '../types';
import { HashBadge } from '../components/common/HashBadge';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await api.getIncidents();
        setIncidents(data);
        if (data.length > 0) setSelectedIncident(data[0]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchIncidents();
  }, []);

  const filtered = incidents.filter(inc => {
    if (filter === 'ALL') return true;
    return inc.priority === filter || inc.status === filter;
  });

  return (
    <div className="w-full px-4 sm:px-6 py-6 flex flex-col gap-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-[24px]">crisis_alert</span>
            Incident Intelligence &amp; Triage
          </h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Automated correlation of multi-sensor detections, zone intrusions, and perimeter breaches
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'ACKNOWLEDGED', 'RESOLVED'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Incidents Table / List */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-[12px] uppercase font-mono text-slate-700 dark:text-slate-300">
              Active Incidents Registry ({filtered.length})
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono text-[12px]">
              No incidents match the active filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    selectedIncident?.id === inc.id
                      ? 'bg-sky-50/70 dark:bg-sky-950/40 border-l-4 border-sky-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">{inc.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        inc.priority === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {inc.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                        {inc.status}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{inc.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      Sector: {inc.sector} | Sensors: {inc.camera_ids.join(', ')} | Risk: {inc.risk_score}%
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {new Date(inc.first_seen).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                      ✓ {inc.blockchain_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Incident Deep Inspection */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {selectedIncident ? (
            <div className="bg-white dark:bg-[#0f172a] rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[15px] font-bold text-slate-900 dark:text-white">
                    {selectedIncident.id}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-mono text-[10px] font-bold">
                    {selectedIncident.priority}
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mt-1">
                  {selectedIncident.title}
                </h3>
              </div>

              {/* Explainable AI Risk Score Breakdown */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Calculated Risk Score:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold text-[14px]">{selectedIncident.risk_score} / 100</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug mt-1 border-t border-slate-200 dark:border-slate-800 pt-1.5">
                  <span className="font-bold text-sky-600 dark:text-sky-400">Explainability:</span> {selectedIncident.explanation || 'Multi-factor perimeter analysis'}
                </p>
              </div>

              {/* Blockchain Evidence Status */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded border border-indigo-200 dark:border-indigo-900/60 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center text-indigo-900 dark:text-indigo-300">
                  <span className="font-bold">Ledger Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {selectedIncident.blockchain_status}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                  <span>Sector Assignment:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedIncident.sector}</span>
                </div>
              </div>

              {/* Timeline Reconstruction */}
              <div>
                <span className="font-mono text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-2">
                  Reconstructed Timeline ({(selectedIncident.timeline || []).length} Steps)
                </span>
                <div className="relative pl-4 space-y-2.5 font-mono text-[11px] before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
                  {(selectedIncident.timeline || []).map((t, idx) => (
                    <div key={idx} className="relative group">
                      <span className="absolute -left-[15px] top-1.5 w-2 h-2 rounded-full bg-sky-500"></span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sky-700 dark:text-sky-400 font-bold">{new Date(t.timestamp).toLocaleTimeString()}</span>
                        <span className="text-slate-400 text-[10px]">{t.source}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">{t.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 font-mono bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 text-[12px]">
              Select an incident from the registry to inspect chronological reconstruction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
