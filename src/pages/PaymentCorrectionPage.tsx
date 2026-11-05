import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PaymentCorrectionPage: React.FC<{
  token: string;
  navigate: (route: string) => void;
}> = ({ token, navigate }) => {
  const { correctionTokens, teams, submitPaymentCorrection } = useApp();

  const tokenRecord = correctionTokens.find((t) => t.token === token);
  const team = tokenRecord ? teams.find((t) => t.id === tokenRecord.teamId) : null;

  const [senderNo, setSenderNo] = useState(team?.payment.senderNo || '');
  const [trxId, setTrxId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setSenderNo(team.payment.senderNo);
    }
  }, [team]);

  if (!tokenRecord) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
        <div className="glass-panel p-8 rounded-[16px] max-w-md text-center border border-red-500/40">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">Invalid Correction Link</h2>
          <p className="text-xs text-slate-300 mb-6">
            This payment correction token does not exist or has already been consumed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-[10px] bg-white/10 text-white font-semibold text-xs"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (tokenRecord.usedAt) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
        <div className="glass-panel p-8 rounded-[16px] max-w-md text-center border border-amber-500/40">
          <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">Link Already Used</h2>
          <p className="text-xs text-slate-300 mb-6">
            This one-time correction link has already been used to update transaction details on{' '}
            {new Date(tokenRecord.usedAt).toLocaleString()}. Your submission is now back in the pending verification queue.
          </p>
          <button
            onClick={() => navigate('/teams')}
            className="px-5 py-2.5 rounded-[10px] bg-purple-600 text-white font-semibold text-xs"
          >
            View Teams Roster
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!senderNo.trim() || !trxId.trim()) {
      setErrorMsg('Please enter both the sender phone number and the new transaction ID.');
      return;
    }

    const res = submitPaymentCorrection(token, senderNo.trim(), trxId.trim().toUpperCase());
    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.error || 'Failed to update payment information');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
        <div className="glass-panel p-8 sm:p-12 rounded-[20px] max-w-lg text-center border border-emerald-500/40 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Payment Correction Received</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Thank you! Your payment details for team <strong className="text-white">{team?.teamName}</strong> have been updated with new Transaction ID <strong className="text-amber-400">{trxId.toUpperCase()}</strong>.
          </p>
          <p className="text-xs text-slate-400">
            Our organizers will re-verify the transaction and email login credentials once approved.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/teams')}
              className="px-6 py-2.5 rounded-[10px] bg-[#6d3df5] text-white font-bold text-xs"
            >
              Check Teams List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0618] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        <div className="glass-panel p-6 sm:p-8 rounded-[16px] border border-amber-500/30 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">
                Payment Correction
              </h1>
              <p className="text-xs text-slate-400">
                Team: <strong className="text-cyan-300">{team?.teamName}</strong> ({team?.university})
              </p>
            </div>
          </div>

          {/* Organizer Note */}
          <div className="p-4 rounded-[12px] bg-red-950/40 border border-red-500/30 text-xs text-red-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span>Organizer Verification Note:</span>
            </div>
            <p className="pl-5 text-slate-200">
              {tokenRecord.reason || 'Transaction ID not matching bank statement. Please recheck.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-[10px] bg-red-950/70 border border-red-500/50 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Method
              </label>
              <div className="px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-xs font-semibold text-purple-200 capitalize">
                {team?.payment.method} ({team?.payment.amount} BDT)
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sender Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={senderNo}
                onChange={(e) => setSenderNo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corrected Transaction ID (TrxID) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <span className="text-[10px] text-slate-400">
                Check your SMS receipt from {team?.payment.method}.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-[10px] bg-[#ffb020] hover:bg-[#ffa000] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
              >
                Submit Corrected Payment Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
