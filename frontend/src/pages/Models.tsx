import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AIModel } from '../types';

export const Models: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await api.getModels();
        setModels(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchModels();
  }, []);

  return (
    <div className="w-full px-6 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">AI Model Provenance &amp; Registry</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Registered neural architectures, cryptographic model weights hashes, and inference execution hardware
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono text-[11px] font-semibold border border-sky-200 dark:border-sky-800">
            DEVICE: CUDA / CPU AUTO-FALLBACK
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Model ID</th>
                <th className="px-4 py-2.5">Task Type</th>
                <th className="px-4 py-2.5">Framework</th>
                <th className="px-4 py-2.5">Version</th>
                <th className="px-4 py-2.5">Device</th>
                <th className="px-4 py-2.5">Latency</th>
                <th className="px-4 py-2.5">Model Hash (SHA-256)</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {models.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{m.id}</td>
                  <td className="px-4 py-3 text-sky-700 dark:text-sky-400">{m.task_type}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{m.framework}</td>
                  <td className="px-4 py-3 font-semibold">{m.version}</td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                      {m.device}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.latency_ms}ms</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{m.model_hash.slice(0, 20)}...</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                      ● {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
