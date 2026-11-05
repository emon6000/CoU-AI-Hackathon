import React, { useState } from 'react';
import { LogIn, Key, Mail, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TeamLoginPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { loginTeam, changePassword, teams, settings } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forced password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mustChangeScreen, setMustChangeScreen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = await loginTeam(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Login failed');
    } else {
      const cleanEmail = email.trim().toLowerCase();
      const team = teams.find((t) => t.account?.loginEmail.toLowerCase() === cleanEmail || t.members[0]?.email.toLowerCase() === cleanEmail);
      if (team?.account?.mustChangePassword) {
        setMustChangeScreen(true);
      } else {
        navigate('/team');
      }
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const res = changePassword(newPassword);
    if (res.success) {
      navigate('/team');
    } else {
      setErrorMsg(res.error || 'Failed to update password');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0618] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full mx-auto space-y-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        <div className="glass-panel p-8 rounded-[16px] border border-white/10 shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6d3df5] to-[#22d3ee] p-0.5 mx-auto mb-3">
              <div className="w-full h-full bg-[#0a0618] rounded-[10px] flex items-center justify-center">
                <LogIn className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-white">
              {mustChangeScreen ? 'Set Permanent Password' : 'Team Portal Login'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {mustChangeScreen
                ? 'Security requirement: Change your temporary password on first login.'
                : 'Approved team leaders log in with credentials sent via email.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-[10px] bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!mustChangeScreen ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Team Leader Email
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
                  Password (Issued by Organizer)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  className="w-full py-3 rounded-[10px] bg-[#6d3df5] hover:bg-[#5b2bd5] text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 active:scale-[0.99] transition-all"
                >
                  Sign in to Team Dashboard
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg active:scale-[0.99] transition-all"
              >
                Save Password & Continue
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-white/10 text-center">
            <span className="text-[11px] text-slate-400">
              Need assistance with your team credentials? Contact{' '}
              {settings.support_email ? (
                <a href={`mailto:${settings.support_email}`} className="text-cyan-400 hover:underline">
                  {settings.support_email}
                </a>
              ) : (
                'the organizers'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};