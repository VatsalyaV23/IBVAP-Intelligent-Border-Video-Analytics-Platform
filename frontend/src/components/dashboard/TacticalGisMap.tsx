import React from 'react';

export const TacticalGisMap: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-[#0f172a] rounded p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px] text-sky-700 dark:text-sky-400">map</span>
          <span className="font-bold text-[13px] text-slate-900 dark:text-white uppercase tracking-tight">
            Sector B 2D Tactical GIS Overlay
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-medium border border-slate-200 dark:border-slate-700">
            LAT 32.7266° N | LON 74.8570° E
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Breach Point
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span> Camera Cones
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Patrol Delta
          </span>
        </div>
      </div>

      {/* Tactical Vector Canvas */}
      <div className="relative w-full h-72 bg-slate-950 rounded overflow-hidden p-2 border border-slate-800">
        <svg
          className="absolute inset-0 w-full h-full text-slate-800"
          height="100%"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern height="40" id="grid-pattern" patternUnits="userSpaceOnUse" width="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" opacity="0.25" stroke="currentColor" strokeWidth="0.5"></path>
            </pattern>
          </defs>
          <rect fill="url(#grid-pattern)" height="100%" width="100%"></rect>

          {/* Zero Line Demarcation */}
          <line opacity="0.9" stroke="#f87171" strokeDasharray="8,4" strokeWidth="2" x1="20" x2="880" y1="50" y2="50"></line>
          <text fill="#fca5a5" fontFamily="ui-monospace, monospace" fontSize="10" fontWeight="700" letterSpacing="1" x="30" y="42">
            ZERO LINE // INTERNATIONAL BORDER (IB)
          </text>

          {/* Buffer Zone */}
          <rect fill="#38bdf8" fillOpacity="0.06" height="60" width="860" x="20" y="52"></rect>
          <text fill="#7dd3fc" fontFamily="ui-monospace, monospace" fontSize="9" opacity="0.8" x="30" y="90">
            RESTRICTED BUFFER ZONE DELTA (150 METERS)
          </text>

          {/* Secondary Fence Line */}
          <line stroke="#94a3b8" strokeDasharray="4,2" strokeWidth="1.5" x1="20" x2="880" y1="112" y2="112"></line>
          <text fill="#cbd5e1" fontFamily="ui-monospace, monospace" fontSize="9" x="710" y="125">
            BSF PERIMETER FENCE B-2
          </text>

          {/* Patrol Route Path */}
          <path d="M 40 180 Q 220 160, 420 190 T 820 170" fill="none" opacity="0.8" stroke="#34d399" strokeDasharray="5,5" strokeWidth="1.5"></path>
          <text fill="#34d399" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="500" x="640" y="200">
            PATROL ROUTE DELTA (ACTIVE QRT)
          </text>

          {/* Camera Cones */}
          <polygon fill="#38bdf8" fillOpacity="0.15" points="120,220 70,112 170,112" stroke="#38bdf8" strokeOpacity="0.6" strokeWidth="1"></polygon>
          <circle cx="120" cy="220" fill="#38bdf8" r="4"></circle>
          <text fill="#f1f5f9" fontFamily="ui-monospace, monospace" fontSize="9" x="100" y="235">POST-ALPHA</text>

          <polygon fill="#38bdf8" fillOpacity="0.15" points="340,220 290,112 390,112" stroke="#38bdf8" strokeOpacity="0.6" strokeWidth="1"></polygon>
          <circle cx="340" cy="220" fill="#38bdf8" r="4"></circle>
          <text fill="#f1f5f9" fontFamily="ui-monospace, monospace" fontSize="9" x="320" y="235">POST-BRAVO</text>

          <polygon fill="#818cf8" fillOpacity="0.12" points="560,240 460,50 680,50" stroke="#818cf8" strokeOpacity="0.5" strokeWidth="1"></polygon>
          <circle cx="560" cy="240" fill="#818cf8" r="5"></circle>
          <text fill="#f1f5f9" fontFamily="ui-monospace, monospace" fontSize="9" x="540" y="255">WATCHTOWER-1</text>

          {/* Critical Perimeter Sector Cone */}
          <polygon fill="#ef4444" fillOpacity="0.25" points="760,210 680,100 810,100" stroke="#ef4444" strokeWidth="1.2"></polygon>
          <circle cx="760" cy="210" fill="#ef4444" r="4"></circle>
          <text fill="#fca5a5" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="600" x="740" y="225">SECTOR-04</text>

          {/* Outpost Structure */}
          <rect fill="#1e293b" height="30" stroke="#38bdf8" strokeWidth="1.5" width="40" x="220" y="195"></rect>
          <text fill="#38bdf8" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="700" x="225" y="214">BOP-A3</text>

          {/* BREACH POINT */}
          <g transform="translate(730, 85)">
            <circle className="animate-ping" cx="0" cy="0" fill="#dc2626" fillOpacity="0.6" r="16"></circle>
            <circle cx="0" cy="0" fill="#ef4444" r="7"></circle>
            <circle cx="0" cy="0" fill="#ffffff" r="2.5"></circle>
          </g>
        </svg>

        {/* Floating Tactical HUD Tooltip */}
        <div className="absolute top-4 right-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded shadow border border-rose-300 dark:border-rose-800 flex flex-col gap-0.5 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="font-mono text-[11px] font-bold text-rose-700 dark:text-rose-400">INC-2026-00421</span>
          </div>
          <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200 font-semibold">
            SECTOR B / ZONE 04 (GRID 73-08)
          </span>
          <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">
            BREACH DELAY: 00:00:56s | 2 TARGETS
          </span>
        </div>
      </div>
    </div>
  );
};
