import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AuditLog } from '../types';

export const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="w-full px-6 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">Immutable Audit Trail</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Append-only legal evidence log of officer actions, acknowledgements, verifications, and system states
          </p>
        </div>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IBVAP_Audit_Report_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
          }}
          className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">download</span> Export JSON Audit Manifest
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Timestamp (IST)</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">User / Officer</th>
                <th className="px-4 py-2.5">Resource Target</th>
                <th className="px-4 py-2.5">IP Address</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-sky-700 dark:text-sky-400">{log.action}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{log.username}</td>
                  <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">{log.resource_id || log.resource_type}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{log.ip_address}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-sm">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
