import React from 'react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  onLogout,
  isOpen = false,
  onClose
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'radar', badge: null, dot: true },
    { id: 'live-cameras', label: 'Live Cameras', icon: 'videocam', badge: null, greenDot: true },
    { id: 'vehicles', label: 'ANPR Vehicles', icon: 'directions_car', badge: 'PaddleOCR' },
    { id: 'incidents', label: 'Incidents', icon: 'crisis_alert', badge: null },
    { id: 'evidence', label: 'Evidence', icon: 'fingerprint', badge: null },
    { id: 'alerts', label: 'Alerts', icon: 'warning', badge: null },
    { id: 'cameras', label: 'Cameras', icon: 'grid_view', badge: null },
    { id: 'blockchain', label: 'Blockchain', icon: 'link', badge: null },
    { id: 'audit-trail', label: 'Audit Trail', icon: 'verified_user', badge: null },
    { id: 'system-health', label: 'System Health', icon: 'monitoring', badge: null },
    { id: 'settings', label: 'Settings', icon: 'settings', badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Institutional Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col justify-between shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Official IBVAP Branding Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-700/80 p-1 shadow-sm overflow-hidden">
                <img
                  src="/image.png"
                  alt="IBVAP Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    // Fallback to stylized tactical badge if image is loading
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[16px] tracking-tight text-slate-900 dark:text-white">
                    IBVAP
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-mono text-[9px] font-bold border border-sky-200 dark:border-sky-800">
                    C4ISR
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Border Intelligence &amp; Evidence
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              title="Close Navigation"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5 px-3 py-3 overflow-y-auto max-h-[calc(100vh-180px)]">
            {navItems.map((item) => {
              const isActive = currentPath === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 font-semibold border-l-4 border-sky-600 dark:border-sky-500 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[19px] ${
                        isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[13px]">{item.label}</span>
                  </div>

                  {item.dot && isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
                  )}
                  {item.greenDot && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card */}
        <div className="p-3 m-3 rounded bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-slate-900 dark:text-white truncate">
              Camp Control Officer
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[9px] font-semibold">
              BSF
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 truncate">
            Duty Officer (BSF Sec-IV)
          </p>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                Online · Secure
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Terminate Session"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
