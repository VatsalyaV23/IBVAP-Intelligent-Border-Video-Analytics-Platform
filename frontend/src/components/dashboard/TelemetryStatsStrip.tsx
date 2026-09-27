import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export const TelemetryStatsStrip: React.FC = () => {
  const [stats, setStats] = useState({
    camerasOnline: 0,
    camerasTotal: 0,
    activeIncidents: 0,
    criticalAlerts: 0,
    evidenceCount: 0,
    blockchainBlocks: 1
  });

  const fetchStats = async () => {
    try {
      const [cams, incs, alts, evs, chain] = await Promise.all([
        api.getCameras().catch(() => []),
        api.getIncidents().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getEvidence().catch(() => []),
        api.getBlockchainStatus().catch(() => null)
      ]);

      setStats({
        camerasOnline: cams.filter((c: any) => c.health?.status === 'ONLINE' || c.is_active).length,
        camerasTotal: cams.length,
        activeIncidents: incs.filter((i: any) => i.status !== 'RESOLVED').length,
        criticalAlerts: alts.filter((a: any) => a.priority === 'CRITICAL' && a.status === 'ACTIVE').length,
        evidenceCount: evs.length,
        blockchainBlocks: chain?.current_block || 1
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* Stat 1: Cameras Online */}
      <div className="p-3.5 rounded bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400">
            Cameras Online
          </span>
          <span className="material-symbols-outlined text-[17px] text-emerald-600 dark:text-emerald-400">videocam</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[22px] font-bold text-slate-900 dark:text-white">
            {stats.camerasOnline}
            <span className="text-slate-400 dark:text-slate-500 text-[16px] font-normal">/{stats.camerasTotal || stats.camerasOnline}</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold border border-emerald-100 dark:border-emerald-800">
            {stats.camerasTotal > 0 ? 'LIVE' : 'IDLE'}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: stats.camerasTotal > 0 ? `${(stats.camerasOnline / stats.camerasTotal) * 100}%` : '0%' }}
          ></div>
        </div>
      </div>

      {/* Stat 2: Active Incidents */}
      <div className="p-3.5 rounded bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400">
            Active Incidents
          </span>
          <span className="material-symbols-outlined text-[17px] text-sky-600 dark:text-sky-400">crisis_alert</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className={`font-mono text-[22px] font-bold ${stats.activeIncidents > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {String(stats.activeIncidents).padStart(2, '0')}
          </span>
          <span className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-medium border ${
            stats.activeIncidents > 0
              ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
            {stats.activeIncidents > 0 ? 'THREAT' : 'SECURE'}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${stats.activeIncidents > 0 ? 'bg-rose-500 w-full' : 'bg-emerald-500 w-0'}`}
          ></div>
        </div>
      </div>

      {/* Stat 3: Critical Alerts */}
      <div className="p-3.5 rounded bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400">
            Critical Alerts
          </span>
          <span className="material-symbols-outlined text-[17px] text-rose-600 dark:text-rose-400">notifications_active</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className={`font-mono text-[22px] font-bold ${stats.criticalAlerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {String(stats.criticalAlerts).padStart(2, '0')}
          </span>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {stats.criticalAlerts > 0 ? 'ESCALATING' : 'NORMAL'}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className={`h-full rounded-full ${stats.criticalAlerts > 0 ? 'bg-rose-500 w-full animate-pulse' : 'bg-slate-300 dark:bg-slate-700 w-0'}`}></div>
        </div>
      </div>

      {/* Stat 4: Evidence Anchored */}
      <div className="p-3.5 rounded bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400">
            Evidence Captured
          </span>
          <span className="material-symbols-outlined text-[17px] text-emerald-600 dark:text-emerald-400">verified</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[22px] font-bold text-slate-900 dark:text-white">
            {stats.evidenceCount}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
            SHA-256
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-emerald-500 h-full w-full rounded-full"></div>
        </div>
      </div>

      {/* Stat 5: AI Infer Device */}
      <div className="p-3.5 rounded bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400">
            AI Engine
          </span>
          <span className="material-symbols-outlined text-[17px] text-sky-600 dark:text-sky-400">memory</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[17px] font-bold text-slate-900 dark:text-white">
            YOLOv8
          </span>
          <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-bold">
            ACTIVE
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-sky-500 h-full w-full rounded-full"></div>
        </div>
      </div>

      {/* Stat 6: Blockchain Height */}
      <div className="p-3.5 rounded bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400">
            Ledger Blocks
          </span>
          <span className="material-symbols-outlined text-[17px] text-amber-600 dark:text-amber-400">deployed_code</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[22px] font-bold text-slate-900 dark:text-white">
            #{stats.blockchainBlocks}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
            SEALED
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-amber-500 h-full w-full rounded-full"></div>
        </div>
      </div>
    </section>
  );
};
