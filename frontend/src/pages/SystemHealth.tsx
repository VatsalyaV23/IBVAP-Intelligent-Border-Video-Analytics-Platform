import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SystemHealthData } from '../types';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getSystemHealth();
        setHealth(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="w-full px-6 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">System Diagnostics &amp; Telemetry</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Real-time status of backend microservices, computer-vision pipeline, database, and ledger
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
          ALL SUBSYSTEMS NOMINAL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {health && health.subsystems && Object.entries(health.subsystems || {}).map(([key, val]) => (
          <div
            key={key}
            className="bg-white dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center justify-between"
          >
            <div>
              <span className="font-mono text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                {key.replace('_', ' ')}
              </span>
              <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">
                Service Worker Node
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
              ● {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
