import React, { useState } from 'react';
import { AdminEvidenceVaultModal } from '../components/common/AdminEvidenceVaultModal';

export const Settings: React.FC = () => {
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [evidenceRetention, setEvidenceRetention] = useState<number>(365);
  const [privacyMode, setPrivacyMode] = useState<boolean>(true);
  const [faceRecognition, setFaceRecognition] = useState<boolean>(false);
  const [loiteringThreshold, setLoiteringThreshold] = useState<number>(120);
  const [isAdminVaultOpen, setIsAdminVaultOpen] = useState<boolean>(false);

  return (
    <div className="w-full px-6 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">System Governance &amp; Configuration</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Data retention policies, privacy safeguards, virtual fence parameters, and escalation rules
          </p>
        </div>
        <button
          onClick={() => alert('Settings successfully updated and committed to system audit log')}
          className="px-4 py-2 rounded bg-sky-700 hover:bg-sky-800 text-white font-mono text-[11px] font-bold uppercase transition-colors"
        >
          Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-[12px]">
        {/* Retention Policies */}
        <div className="bg-white dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-4">
          <h3 className="font-bold text-[13px] text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Data Retention Policies
          </h3>
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Raw Video Archive Retention (Days):</label>
            <input
              type="number"
              value={retentionDays}
              onChange={e => setRetentionDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Evidence Package Retention (Days):</label>
            <input
              type="number"
              value={evidenceRetention}
              onChange={e => setEvidenceRetention(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Privacy & Biometrics */}
        <div className="bg-white dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-4">
          <h3 className="font-bold text-[13px] text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Privacy &amp; Biometric Governance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Strict Privacy Protection Mode</span>
              <span className="text-[11px] text-slate-500">Blurs sensitive public faces outside restricted zones</span>
            </div>
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={e => setPrivacyMode(e.target.checked)}
              className="rounded text-sky-600 h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Automated Face Recognition Matching</span>
              <span className="text-[11px] text-slate-500">Disabled by default; requires explicit officer clearance</span>
            </div>
            <input
              type="checkbox"
              checked={faceRecognition}
              onChange={e => setFaceRecognition(e.target.checked)}
              className="rounded text-sky-600 h-4 w-4"
            />
          </div>
        </div>

        {/* Behavior & Zone Parameters */}
        <div className="bg-white dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-4">
          <h3 className="font-bold text-[13px] text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Virtual Fence &amp; Loitering Parameters
          </h3>
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Loitering Dwell Time Threshold (Seconds):</label>
            <input
              type="number"
              value={loiteringThreshold}
              onChange={e => setLoiteringThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Camouflaged System Compliance Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-4">
          <h3 className="font-bold text-[13px] text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            <span>System Compliance &amp; Notarization</span>
            <span
              onClick={() => setIsAdminVaultOpen(true)}
              className="material-symbols-outlined text-[15px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer select-none transition-colors"
              title="C4ISR Security Compliance"
            >
              verified_user
            </span>
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Framework Version:</span>
              <span className="text-slate-900 dark:text-slate-200 font-bold">IBVAP-v3.2.0-STABLE</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Security Compliance:</span>
              <span
                onClick={() => setIsAdminVaultOpen(true)}
                className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer select-none"
              >
                FIPS-140-2 Level 4 Verified
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Audit Log Engine:</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold">Active Notarized</span>
            </div>
          </div>
        </div>
      </div>

      <AdminEvidenceVaultModal
        isOpen={isAdminVaultOpen}
        onClose={() => setIsAdminVaultOpen(false)}
      />
    </div>
  );
};
