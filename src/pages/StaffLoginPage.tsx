import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StaffLoginPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { loginStaff } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Check rate limit lockout (5 failed logins -> 15 min lock per spec Section 13)
    if (lockedUntil && Date.now() < lockedUntil) {
      const remainingMin = Math.ceil((lockedUntil - Date.now()) / (1000 * 60));
      setErrorMsg(`Too many failed attempts. Account locked for ${remainingMin} more minutes.`);
      return;
    }

    const res = loginStaff(email, password);
    if (!res.success) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setLockedUntil(Date.now() + 15 * 60 * 1000);
        setErrorMsg('Security lockout triggered: 5 consecutive failed logins. Try again in 15 minutes.');
      } else {
        setErrorMsg(`${res.error || 'Invalid credentials'}. (${5 - attempts} attempts remaining)`);
      }
    } else {
      setFailedAttempts(0);
      setLockedUntil(null);
      if (res.role === 'judge') {
        navigate('/judge');
      } else {
        navigate('/admin');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070411] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        <div className="glass-panel p-8 rounded-[16px] border border-purple-500/30 bg-[#0d0722] shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-400/40 p-0.5 mx-auto mb-3 flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-white">
              Organizing Staff Portal
            </h1>
            <p className="text-xs text-purple-300/80 mt-1">
              Restricted access for Super Admins, Moderators, and Juries.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-[10px] bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-[10px] bg-gradient-to-r from-[#6d3df5] to-[#5123d4] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 active:scale-[0.99] transition-all"
              >
                Authenticate & Enter Workspace
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-white/10 text-center">
            <span className="text-[11px] text-slate-400">
              Authorized university personnel only. All access attempts are recorded in the security audit trail.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
