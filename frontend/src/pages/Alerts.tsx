import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Alert } from '../types';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await api.getAlerts();
        setAlerts(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="w-full px-6 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">Alert Escalation &amp; Dispatch</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Role-based hierarchical escalation timers with automatic duty officer routing
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono text-[11px] font-semibold border border-rose-200 dark:border-rose-900">
          ESCALATION TIMEOUT: 85 SECONDS
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 bg-white dark:bg-[#0f172a] rounded border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">notifications_paused</span>
          </div>
          <div>
            <h4 className="font-bold text-[14px] text-slate-900 dark:text-white">Zero Active Tactical Alerts</h4>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-md mt-1">
              Perimeter nominal. When camera AI detects human intrusion, vehicles, or anomalous movement, alerts are automatically pushed here with escalating response tiers.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map(a => (
            <div
              key={a.id}
              className="bg-white dark:bg-[#0f172a] rounded border border-rose-200 dark:border-rose-900/60 shadow-sm p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">{a.id}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-mono text-[10px] font-bold">
                    {a.priority}
                  </span>
                </div>
                <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                  Target Incident: {a.incident_id}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Current Tier: Level {a.current_tier} (Duty Officer BSF) | Recipient: {a.recipient_role}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded border border-slate-100 dark:border-slate-800 font-mono text-[10px] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Escalation Timer Remaining:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold text-[12px]">{a.timeout_seconds}s</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
