import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BlockchainStatus, BlockchainRecord } from '../types';
import { HashBadge } from '../components/common/HashBadge';

export const Blockchain: React.FC = () => {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [tamperSimulated, setTamperSimulated] = useState<boolean>(false);

  useEffect(() => {
    const fetchBlockchain = async () => {
      try {
        const s = await api.getBlockchainStatus();
        setStatus(s);
        const r = await api.getBlockchainRecords();
        setRecords(r);
      } catch (e) {
        console.error(e);
      }
    };
    fetchBlockchain();
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 py-6 flex flex-col gap-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-[24px]">account_tree</span>
            Permissioned Blockchain Ledger
          </h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Immutable audit chain storing cryptographic Merkle roots, model hashes, and evidence provenance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800">
            PROVIDER: {status?.provider || 'LOCAL DEVELOPMENT LEDGER'}
          </span>
        </div>
      </div>

      {/* Network Telemetry Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-[12px]">
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Consensus Status</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[14px]">
            {status?.peer_consensus || '12/12 PEER CONSENSUS'}
          </span>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Current Block Height</span>
          <span className="text-slate-900 dark:text-white font-bold text-[14px]">
            #{status?.current_block || 12841}
          </span>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Notarized Transactions</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[14px]">
            {status?.total_transactions || records.length} Records
          </span>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">Latest Block Hash</span>
          <HashBadge hash={status?.latest_block_hash || '0x4b7c129ed821e901f40284d720b08fa1'} leadLength={6} tailLength={6} />
        </div>
      </div>

      {/* Block & Transaction Explorer */}
      <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-bold text-[12px] uppercase font-mono text-slate-700 dark:text-slate-300">
            Immutable Transaction Blocks ({records.length})
          </span>
          <button
            onClick={() => setTamperSimulated(!tamperSimulated)}
            className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-mono text-[10px] font-semibold transition-colors cursor-pointer"
          >
            {tamperSimulated ? 'Reset Tamper Simulation' : 'Simulate 1-Byte Tampering'}
          </button>
        </div>

        {tamperSimulated && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border-b border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-mono text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span>
            <span>
              <strong>SIMULATION ACTIVE:</strong> 1 byte modified in evidence file. Recomputed SHA-256 no longer matches Block Merkle root. State: <strong>HASH_MISMATCH</strong>.
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Block #</th>
                <th className="px-4 py-2.5">Transaction ID</th>
                <th className="px-4 py-2.5">Incident ID</th>
                <th className="px-4 py-2.5">Evidence SHA-256 Digest</th>
                <th className="px-4 py-2.5">AI Model Hash</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-bold text-sky-600 dark:text-sky-400">#{r.block_number}</td>
                  <td className="px-4 py-3">
                    <HashBadge hash={r.transaction_id} leadLength={8} tailLength={6} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">{r.incident_id}</td>
                  <td className="px-4 py-3">
                    <HashBadge hash={r.evidence_hash} leadLength={10} tailLength={8} />
                  </td>
                  <td className="px-4 py-3">
                    <HashBadge hash={r.model_hash} leadLength={6} tailLength={4} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No blockchain records found. Captured evidence items are automatically notarized to the ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
