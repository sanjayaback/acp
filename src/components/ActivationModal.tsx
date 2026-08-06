import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, Clock, CheckCircle2, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import { LicenseInfo } from '../types';
import { verifyLicenseKey, saveLicense, clearStoredLicense } from '../utils/license';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLicense: LicenseInfo | null;
  onLicenseUpdated: (license: LicenseInfo | null) => void;
  onOpenAdminPortal?: () => void;
  isLockout?: boolean; // True if app functionality is locked due to missing/expired key
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  currentLicense,
  onLicenseUpdated,
  onOpenAdminPortal,
  isLockout = false,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const result = verifyLicenseKey(inputKey);

    if (!result.success || !result.license) {
      setErrorMsg(result.message);
      setIsSubmitting(false);
      return;
    }

    // Save and notify parent
    saveLicense(result.license);
    onLicenseUpdated(result.license);
    setSuccessMsg(result.message);
    setInputKey('');
    setIsSubmitting(false);

    if (!isLockout) {
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleDeactivate = () => {
    clearStoredLicense();
    onLicenseUpdated(null);
    setSuccessMsg('');
    setErrorMsg('License key removed.');
  };

  const isExpired = currentLicense?.isExpired;
  const isValid = currentLicense?.isValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Software Activation</h3>
              <p className="text-xs text-indigo-100/80">AutoClip AI Enterprise License System</p>
            </div>
          </div>

          {!isLockout && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-sm font-semibold p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Current License Card */}
          {currentLicense && (
            <div
              className={`p-4 rounded-xl border ${
                isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    {isValid ? 'License Active' : 'License Expired'}
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded text-white">
                  {currentLicense.planName}
                </span>
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-300 border-t border-white/10 pt-2.5 mt-2">
                <div className="truncate text-slate-400">Key: <span className="text-white">{currentLicense.key}</span></div>
                {currentLicense.isLifetime ? (
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lifetime Access (Never Expires)
                  </div>
                ) : (
                  <>
                    <div>Expires: {currentLicense.expiresAt ? new Date(currentLicense.expiresAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</div>
                    <div className="flex items-center gap-1 text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        Time Remaining:{' '}
                        <strong className={isValid ? 'text-emerald-400' : 'text-rose-400'}>
                          {currentLicense.timeRemainingText || `${currentLicense.daysRemaining ?? 0} days`}
                        </strong>
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleDeactivate}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors underline"
                >
                  Deactivate / Remove Key
                </button>
              </div>
            </div>
          )}

          {/* Lockout Warning Banner */}
          {isLockout && !isValid && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Activation Required</strong>
                Please enter a valid activation key to unlock video uploading and social clip exporting.
              </div>
            </div>
          )}

          {/* Key Input Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Activation Key (Format: ACP-XXXX-XXXX-XXXX-XXXX)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="e.g. ACP-30D-66B2F500-A49F-E8D1"
                  className="w-full bg-[#07080A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Activate Software</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {!isLockout && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Link to Admin Portal */}
          {onOpenAdminPortal && (
            <div className="pt-2 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPortal();
                }}
                className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors font-mono"
              >
                ⚙️ Owner Key Portal (Admin Access)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
