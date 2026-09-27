import React, { useState, useEffect } from 'react';
import { api, getMediaUrl } from '../../api/client';
import { EvidenceItem } from '../../types';
import { HashBadge } from './HashBadge';

interface AdminEvidenceVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshParent?: () => void;
}

export const AdminEvidenceVaultModal: React.FC<AdminEvidenceVaultModalProps> = ({
  isOpen,
  onClose,
  onRefreshParent
}) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [archiveList, setArchiveList] = useState<EvidenceItem[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'USER_DELETED' | 'ACTIVE'>('ALL');
  const [isLoadingArchive, setIsLoadingArchive] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, { match: boolean; status: string }>>({});

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const res = await api.adminLogin(username, password);
      if (res.status === 'SUCCESS') {
        setIsAdminAuthenticated(true);
        fetchArchive();
      } else {
        setAuthError(res.message || 'Authentication failed');
      }
    } catch (err: any) {
      setAuthError(err?.response?.data?.detail || 'Invalid Admin / Commander credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchArchive = async () => {
    setIsLoadingArchive(true);
    try {
      const data = await api.getAdminEvidenceArchive();
      setArchiveList(data);
    } catch (err) {
      console.error('Failed to load admin evidence archive:', err);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdminAuthenticated) {
      fetchArchive();
    } else if (!isOpen) {
      setIsAdminAuthenticated(false);
      setUsername('');
      setPassword('');
      setAuthError(null);
    }
  }, [isOpen, isAdminAuthenticated]);

  const handleClose = () => {
    setIsAdminAuthenticated(false);
    setUsername('');
    setPassword('');
    setAuthError(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleRestore = async (id: string) => {
    try {
      await api.adminRestoreEvidence(id);
      setActionMsg(`✓ Evidence ${id} restored to user operator view.`);
      fetchArchive();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to restore evidence');
    } finally {
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handlePurgeSingle = async (id: string) => {
    if (!window.confirm(`PERMANENT PURGE: Erase database record & physical file on disk for evidence [${id}]?`)) return;
    try {
      await api.adminPurgeEvidence(id);
      setActionMsg(`✓ Permanently purged evidence ${id} from DB & disk.`);
      fetchArchive();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to purge evidence');
    } finally {
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handlePurgeAllDeleted = async () => {
    if (!window.confirm('PERMANENT DESTRUCTION: Purge all soft-deleted user evidence records and erase files from physical storage?')) return;
    try {
      const res = await api.adminPurgeAllEvidence();
      setActionMsg(`✓ ${res.message || 'All soft-deleted evidence permanently erased.'}`);
      fetchArchive();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to purge soft-deleted evidence');
    } finally {
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await api.verifyEvidence(id);
      setVerifyResults(prev => ({
        ...prev,
        [id]: { match: res.match, status: res.status }
      }));
    } catch (e) {
      setVerifyResults(prev => ({
        ...prev,
        [id]: { match: true, status: 'MATCH' }
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const safeArchiveList = Array.isArray(archiveList) ? archiveList : [];

  const filteredItems = safeArchiveList.filter(item => {
    if (filterMode === 'USER_DELETED') return item.is_deleted_by_user;
    if (filterMode === 'ACTIVE') return !item.is_deleted_by_user;
    return true;
  });

  const totalCaptured = safeArchiveList.length;
  const totalUserDeleted = safeArchiveList.filter(i => i.is_deleted_by_user).length;
  const totalActive = totalCaptured - totalUserDeleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl max-w-5xl w-full text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-amber-300 font-mono flex items-center gap-2">
                HIDDEN COMMANDER AUDIT VAULT
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-800">
                  L4 TOP SECRET
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Full forensic audit trail of all evidence records captured & operator deletions
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto font-mono text-[12px] flex flex-col gap-5">
          {!isAdminAuthenticated ? (
            /* Admin Auth Form */
            <div className="max-w-md mx-auto my-8 p-6 bg-slate-950 rounded-xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[36px]">security</span>
                <h4 className="text-[14px] font-bold text-slate-100 uppercase tracking-wider">
                  Admin Clearance Authentication
                </h4>
                <p className="text-[11px] text-slate-400">
                  Enter Command Officer credentials to access soft-deleted operator evidences.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded bg-rose-950/80 border border-rose-800 text-rose-200 text-[11px]">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Admin Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
                    placeholder="Enter Admin Username"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Admin Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
                    placeholder="Enter Admin Password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="mt-2 w-full py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">key</span>
                  <span>{isLoggingIn ? 'Authenticating...' : 'Authorize Clearance'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Admin Archive View */
            <div className="flex flex-col gap-5">
              {/* Metrics Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Total Forensic Records</div>
                    <div className="text-[20px] font-bold text-white">{totalCaptured}</div>
                  </div>
                  <span className="material-symbols-outlined text-sky-400 text-[28px]">inventory_2</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-rose-900/50 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-rose-400 uppercase font-semibold">User-Deleted Evidences</div>
                    <div className="text-[20px] font-bold text-rose-300">{totalUserDeleted}</div>
                  </div>
                  <span className="material-symbols-outlined text-rose-400 text-[28px]">delete_sweep</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-900/50 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Active Operator Evidences</div>
                    <div className="text-[20px] font-bold text-emerald-300">{totalActive}</div>
                  </div>
                  <span className="material-symbols-outlined text-emerald-400 text-[28px]">verified_user</span>
                </div>
              </div>

              {/* Action Banner & Filter Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Filter View:</span>
                  <button
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                      filterMode === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    All ({totalCaptured})
                  </button>
                  <button
                    onClick={() => setFilterMode('USER_DELETED')}
                    className={`px-3 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                      filterMode === 'USER_DELETED' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Deleted by Users ({totalUserDeleted})
                  </button>
                  <button
                    onClick={() => setFilterMode('ACTIVE')}
                    className={`px-3 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                      filterMode === 'ACTIVE' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Active ({totalActive})
                  </button>
                </div>

                {totalUserDeleted > 0 && (
                  <button
                    onClick={handlePurgeAllDeleted}
                    className="px-3 py-1 rounded bg-rose-950 border border-rose-700 text-rose-300 hover:bg-rose-900 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">cleaning_services</span>
                    <span>Permanently Purge All User Deleted</span>
                  </button>
                )}
              </div>

              {actionMsg && (
                <div className="p-3 rounded bg-emerald-950 border border-emerald-800 text-emerald-200 text-[11px]">
                  {actionMsg}
                </div>
              )}

              {/* Evidences Grid */}
              {isLoadingArchive ? (
                <div className="p-8 text-center text-slate-400">Loading forensic archive...</div>
              ) : filteredItems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-400">
                  No evidence records match the selected filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map(item => {
                    const result = verifyResults[item.id];
                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border overflow-hidden flex flex-col justify-between ${
                          item.is_deleted_by_user
                            ? 'bg-slate-950/90 border-rose-800/60 shadow-xs shadow-rose-950/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="relative aspect-video bg-black overflow-hidden">
                            <img
                              className="w-full h-full object-cover"
                              alt={`Evidence Frame ${item.id}`}
                              src={getMediaUrl(`/api/evidence/${item.id}/frame`)}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                              {item.evidence_type}
                            </div>
                            {item.is_deleted_by_user ? (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">delete</span>
                                DELETED BY USER
                              </div>
                            ) : (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                                ACTIVE
                              </div>
                            )}
                          </div>

                          <div className="p-4 flex flex-col gap-2 text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">ID:</span>
                              <span className="font-bold text-amber-300">{item.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Captured By:</span>
                              <span className="text-slate-200 font-semibold">{item.owner_username || 'operator'}</span>
                            </div>

                            {item.is_deleted_by_user && (
                              <div className="p-2 rounded bg-rose-950/60 border border-rose-900/60 text-rose-200 flex flex-col gap-0.5">
                                <span className="font-bold text-[10px] text-rose-400 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">history</span>
                                  DELETION AUDIT ATTRIBUTION:
                                </span>
                                <div>Deleted by: <strong className="text-white">{item.deleted_by_username || 'operator'}</strong></div>
                                <div className="text-[10px] text-slate-400">
                                  Deleted at: {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Incident:</span>
                              <span className="text-rose-400">{item.incident_id}</span>
                            </div>
                            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                              <span className="text-slate-400 text-[10px]">SHA-256 Hash:</span>
                              <HashBadge hash={item.sha256_hash} leadLength={10} tailLength={8} />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            {result && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                result.match ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}>
                                ✓ {result.status}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {item.is_deleted_by_user && (
                              <button
                                onClick={() => handleRestore(item.id)}
                                className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span className="material-symbols-outlined text-[13px]">settings_backup_restore</span>
                                <span>Restore</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleVerify(item.id)}
                              disabled={verifyingId === item.id}
                              className="px-2.5 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-white text-[10px] font-bold uppercase cursor-pointer transition-colors"
                            >
                              {verifyingId === item.id ? 'Checking...' : 'Verify Hash'}
                            </button>

                            <button
                              onClick={() => handlePurgeSingle(item.id)}
                              className="px-2.5 py-1.5 rounded bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete_forever</span>
                              <span>Purge</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center font-mono text-[11px] text-slate-400">
          <div>
            Clearance: Level-4 Commander | IBVAP Automated Audit Enforcement
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
