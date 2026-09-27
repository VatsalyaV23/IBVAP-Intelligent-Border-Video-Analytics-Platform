import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ConnectCameraModal } from '../camera/ConnectCameraModal';

interface TopHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: (t: 'light' | 'dark') => void;
  unreadAlerts?: number;
  onToggleMobileSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  theme,
  onToggleTheme,
  onToggleMobileSidebar
}) => {
  const [clockStr, setClockStr] = useState<string>('');
  const [camerasOnline, setCamerasOnline] = useState<number>(0);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const d = pad(now.getDate());
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const mon = months[now.getMonth()];
      const y = now.getFullYear();
      const h = pad(now.getHours());
      const m = pad(now.getMinutes());
      const s = pad(now.getSeconds());
      setClockStr(`${d} ${mon} ${y} | ${h}:${m}:${s} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateHeaderStats = async () => {
    try {
      const [cams, alts] = await Promise.all([
        api.getCameras().catch(() => []),
        api.getAlerts().catch(() => [])
      ]);
      setCamerasOnline(cams.length);
      setUnreadAlerts(alts.filter((a: any) => a.status === 'ACTIVE' || a.status === 'PENDING_ACK').length);
    } catch (e) {
      // Backend offline
    }
  };

  useEffect(() => {
    updateHeaderStats();
    const interval = setInterval(updateHeaderStats, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 lg:left-72 left-0 right-0 h-16 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md z-40 border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
      <div className="h-16 w-full px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger Button (mobile/tablet) + Logo/Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Hamburger Menu Toggle */}
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          {/* Mobile Mini Logo */}
          <div className="lg:hidden flex items-center gap-1.5 shrink-0">
            <img src="/image.png" alt="IBVAP Logo" className="h-7 w-7 object-contain rounded" />
            <span className="font-bold text-[14px] text-slate-900 dark:text-white">IBVAP</span>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:flex flex-col min-w-0">
            <h1 className="text-[15px] xl:text-[16px] text-slate-900 dark:text-white font-bold tracking-tight truncate">
              Border Surveillance Command Center
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              BSF SECTOR-4 // C4ISR TACTICAL NETWORK
            </span>
          </div>
        </div>

        {/* Center: Real-time IST Clock */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-sky-600 dark:text-sky-400">schedule</span>
            <span className="font-mono text-[10px] sm:text-[12px] font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              {clockStr || '19 SEP 2026 | 02:14:38 IST'}
            </span>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Connect Camera Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-sky-700 hover:bg-sky-800 text-white font-mono text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            <span className="hidden sm:inline">Connect Camera</span>
          </button>

          {/* Theme Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800 p-0.5 shadow-inner">
            <button
              onClick={() => onToggleTheme('light')}
              aria-label="Switch to light mode"
              className={`flex items-center justify-center p-1 sm:px-2 sm:py-1 rounded text-[11px] font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-400 bg-transparent hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-amber-500">light_mode</span>
              <span className="hidden md:inline ml-1">Light</span>
            </button>
            <button
              onClick={() => onToggleTheme('dark')}
              aria-label="Switch to dark mode"
              className={`flex items-center justify-center p-1 sm:px-2 sm:py-1 rounded text-[11px] font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-sky-400">dark_mode</span>
              <span className="hidden md:inline ml-1">Dark</span>
            </button>
          </div>

          {/* Active Alerts Bell */}
          <button
            className="relative p-1.5 sm:p-2 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Active Alerts"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[19px]">notifications</span>
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold animate-pulse">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Officer Clearance Profile (desktop only) */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex flex-col text-right">
              <span className="font-mono text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase">
                CLEARANCE: L4
              </span>
              <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">DEF-9812-IN</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-semibold text-xs border border-slate-700">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
          </div>
        </div>
      </div>

      <ConnectCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCameraAdded={updateHeaderStats}
      />
    </header>
  );
};
