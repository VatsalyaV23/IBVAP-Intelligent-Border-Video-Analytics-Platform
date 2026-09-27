import React from 'react';

export const PipelineStepper: React.FC = () => {
  return (
    <section className="w-full bg-white dark:bg-[#0f172a] px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[1240px] gap-2 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
          <span>CCTV Feeds</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
          <span>AI Detection</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
          <span>Object Tracking</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
          <span>Event Intel</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
          <span>Correlation</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        
        {/* ACTIVE PIPELINE STAGE */}
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold shrink-0 border border-sky-200 dark:border-sky-800 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600 dark:bg-sky-400"></span>
          </span>
          <span className="uppercase tracking-wide text-[11px]">Incident Reconstruction &amp; Evidence</span>
          <span className="material-symbols-outlined text-[14px] text-sky-600 dark:text-sky-400">chevron_right</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
          <span>Crypto Hash</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
          <span>Blockchain Ledger</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></span>
          <span>Escalation</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
          <span>Decision</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600">chevron_right</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
          <span>Resolution</span>
        </div>
      </div>
    </section>
  );
};
