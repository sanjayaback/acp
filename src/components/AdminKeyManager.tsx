import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Copy, Check, Lock, Sparkles, RefreshCw, Layers, Calendar, AlertCircle } from 'lucide-react';
import { KeyDurationOption } from '../types';
import { generateLicenseKey, verifyLicenseKey } from '../utils/license';

interface AdminKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ADMIN_PASSCODE = 'admin123';

export const AdminKeyManager: React.FC<AdminKeyManagerProps> = ({ isOpen, onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Generator State
  const [selectedDuration, setSelectedDuration] = useState<KeyDurationOption>('30d');
  const [clientLabel, setClientLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState<{ key: string; expiresAt: string | null; planName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Key Inspector State
  const [inspectKeyInput, setInspectKeyInput] = useState('');
  const [inspectResult, setInspectResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (passcode.trim() === DEFAULT_ADMIN_PASSCODE || passcode.trim() === 'sanjayaback') {
      setIsAuthenticated(true);
    } else {
      setAuthError('Invalid Admin Passcode. Default is: admin123');
    }
  };

  const handleGenerateKey = () => {
    const newKeyInfo = generateLicenseKey(selectedDuration, clientLabel);
    setGeneratedKey(newKeyInfo);
    setCopied(false);
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInspectKey = () => {
    if (!inspectKeyInput.trim()) return;
    const res = verifyLicenseKey(inspectKeyInput);
    setInspectResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Owner Key Generator Portal</h3>
              <p className="text-[11px] text-purple-200/80">Generate Customer Activation Keys & Manage Expiration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-sm font-semibold p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isAuthenticated ? (
            /* Admin Auth Form */
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="text-center py-3">
                <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-semibold text-slate-100 text-sm">Owner Passcode Required</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your admin passcode to access key generation tools.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Passcode</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode (default: admin123)"
                  className="w-full bg-[#07080A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Key Generator</span>
              </button>
            </form>
          ) : (
            /* Admin Key Generator Workspace */
            <div className="space-y-6">
              {/* Key Generator Form */}
              <div className="bg-[#07080A] border border-white/10 p-4 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Customer Activation Key</span>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Select License Expiration Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '7d', label: '7 Days Pass' },
                      { id: '30d', label: '30 Days License' },
                      { id: '90d', label: '90 Days Pass' },
                      { id: '365d', label: '1 Year Pass' },
                      { id: 'lifetime', label: 'Lifetime' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedDuration(opt.id as KeyDurationOption)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                          selectedDuration === opt.id
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-semibold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Customer / Client Note (Optional)</label>
                  <input
                    type="text"
                    value={clientLabel}
                    onChange={(e) => setClientLabel(e.target.value)}
                    placeholder="e.g. Client John - VIP Studio"
                    className="w-full bg-[#0F1115] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Generate New Activation Key</span>
                </button>
              </div>

              {/* Output Generated Key Box */}
              {generatedKey && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Generated Key Ready
                    </span>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      {generatedKey.planName}
                    </span>
                  </div>

                  <div className="p-3 bg-[#07080A] border border-emerald-500/30 rounded-lg flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-emerald-300 font-bold select-all tracking-wider">
                      {generatedKey.key}
                    </span>
                    <button
                      onClick={handleCopyKey}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Expiration Date:{' '}
                      <strong className="text-slate-200">
                        {generatedKey.expiresAt ? new Date(generatedKey.expiresAt).toLocaleString() : 'Never (Lifetime)'}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Key Inspector Utility */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Key Inspector & Validator
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inspectKeyInput}
                    onChange={(e) => setInspectKeyInput(e.target.value)}
                    placeholder="Paste key to verify (e.g. ACP-30D-...)"
                    className="flex-1 bg-[#07080A] border border-white/15 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-600"
                  />
                  <button
                    onClick={handleInspectKey}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Inspect
                  </button>
                </div>

                {inspectResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-mono border ${
                      inspectResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div>{inspectResult.message}</div>
                    {inspectResult.license && (
                      <div className="mt-1 text-[11px] opacity-80">
                        Plan: {inspectResult.license.planName} | Expires:{' '}
                        {inspectResult.license.expiresAt
                          ? new Date(inspectResult.license.expiresAt).toLocaleDateString()
                          : 'Lifetime'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
