import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Alert } from '../../types';

export const EscalationCascade: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);

  const fetchAlerts = async () => {
    try {
      const alerts = await api.getAlerts();
      const active = alerts.find(a => a.status === 'ACTIVE' || a.status === 'PENDING_ACK');
      setActiveAlert(active || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const tier = activeAlert?.current_tier || 0;

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-[12px] text-slate-900 dark:text-white uppercase tracking-tight">
          Escalation Cascade
        </span>
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">
          {activeAlert ? `TIER ${tier}/4 ACTIVE` : 'STANDBY'}
        </span>
      </div>

      {!activeAlert ? (
        <div className="py-2 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● PERIMETER NOMINAL</span>
          <p className="text-[10px] mt-0.5">Automated duty officer escalation timers will trigger upon critical incident breach.</p>
        </div>
      ) : (
        <div className="flex items-center justify-between text-center font-mono text-[11px] pt-1">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              tier >= 1
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {tier >= 1 ? <span className="material-symbols-outlined text-[12px]">check</span> : '1'}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-[9px] font-semibold">AI DETECT</span>
          </div>
          <span className={`h-0.5 w-6 mb-3 ${tier >= 2 ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}></span>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              tier >= 2
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {tier >= 2 ? <span className="material-symbols-outlined text-[12px]">check</span> : '2'}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-[9px] font-semibold">INCIDENT</span>
          </div>
          <span className={`h-0.5 w-6 mb-3 ${tier >= 3 ? 'bg-rose-400' : 'bg-slate-200 dark:bg-slate-700'}`}></span>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              tier >= 3
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {tier >= 3 ? '!' : '3'}
            </span>
            <span className="text-rose-700 dark:text-rose-400 font-bold text-[9px]">DUTY OFF</span>
          </div>
          <span className="h-0.5 w-6 bg-slate-200 dark:bg-slate-700 mb-3"></span>

          {/* Step 4 */}
          <div className="flex flex-col items-center gap-1 opacity-50">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px]">
              4
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[9px]">SECTOR</span>
          </div>
        </div>
      )}
    </div>
  );
};
