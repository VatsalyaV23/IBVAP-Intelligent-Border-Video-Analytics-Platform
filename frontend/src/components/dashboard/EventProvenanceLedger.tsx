import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Incident } from '../../types';

export const EventProvenanceLedger: React.FC = () => {
  const [incident, setIncident] = useState<Incident | null>(null);

  const fetchTimeline = async () => {
    try {
      const incidents = await api.getIncidents();
      if (incidents && incidents.length > 0) {
        setIncident(incidents[0]);
      } else {
        setIncident(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 3000);
    return () => clearInterval(interval);
  }, []);

  const timeline = incident?.timeline || [];

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <span className="font-bold text-[12px] text-slate-900 dark:text-white uppercase tracking-tight">
          Event Provenance Ledger
        </span>
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {timeline.length > 0 ? `${timeline.length} AUDITED EVENTS` : 'IDLE'}
        </span>
      </div>

      {timeline.length === 0 ? (
        <div className="py-6 px-2 flex flex-col items-center justify-center text-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-[24px] text-slate-400 dark:text-slate-600">
            account_tree
          </span>
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Ledger Standby — No Movement Events
          </p>
          <p className="text-[10px] max-w-xs text-slate-500 dark:text-slate-400">
            Real-time event provenance, tracking vectors, and cryptographic proof hashes will record here automatically when motion is detected.
          </p>
        </div>
      ) : (
        <div className="relative pl-5 space-y-3 font-mono text-[11px] before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
          {timeline.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              <span className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                idx === timeline.length - 1
                  ? 'bg-rose-600 animate-ping'
                  : 'bg-sky-600 dark:bg-sky-400'
              }`}></span>
              <div className="flex items-baseline justify-between">
                <span className="text-sky-700 dark:text-sky-400 font-bold">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                  {item.source}
                </span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-tight mt-0.5">
                {item.action}: <span className="text-slate-600 dark:text-slate-400 font-normal">{item.details || 'Event logged'}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
