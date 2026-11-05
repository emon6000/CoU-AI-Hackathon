import React, { useState, useEffect } from 'react';
import {
  Award,
  FileText,
  Upload,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  QrCode,
  Github,
  Video,
  LogOut,
  Sparkles,
  HelpCircle,
  MapPin,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QRCodeSVG } from '../components/common/QRCode';
import { formatDhakaTime } from '../utils/rules';

export const TeamDashboardPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { auth, logout, teams, settings, documents, saveSubmission, reviews, finalResults } = useApp();

  const currentTeam = teams.find((t) => t.id === auth.user?.teamId) || teams[0];

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'submission' | 'results' | 'phase2'>('overview');

  // Submission Form State
  const [abstract, setAbstract] = useState(currentTeam?.submission?.abstract || '');
  const [repoUrl, setRepoUrl] = useState(currentTeam?.submission?.repoUrl || '');
  const [videoUrl, setVideoUrl] = useState(currentTeam?.submission?.videoUrl || '');
  const [submissionMsg, setSubmissionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentTeam?.submission) {
      setAbstract(currentTeam.submission.abstract);
      setRepoUrl(currentTeam.submission.repoUrl);
      setVideoUrl(currentTeam.submission.videoUrl);
    }
  }, [currentTeam]);

  // Check deadline window
  const effectiveDeadline = currentTeam?.deadlineOverride || settings.online_end_at;
  const isSubmissionOpen =
    !effectiveDeadline || Date.now() <= new Date(effectiveDeadline).getTime();

  // Check scenario documents window
  const isDocWindowOpen =
    !settings.online_start_at || Date.now() >= new Date(settings.online_start_at).getTime();

  // Team reviews
  const teamReviews = reviews.filter((r) => r.teamId === currentTeam?.id && r.isFinal);
  const teamFinalResult = finalResults.find((r) => r.teamId === currentTeam?.id);

  const handleSaveSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionMsg(null);

    if (abstract.length > 350) {
      setSubmissionMsg({ type: 'error', text: 'Abstract cannot exceed 350 characters.' });
      return;
    }

    const res = saveSubmission(abstract.trim(), repoUrl.trim(), videoUrl.trim());
    if (res.success) {
      setSubmissionMsg({ type: 'success', text: 'Submission successfully saved! Commit freeze will run at deadline.' });
    } else {
      setSubmissionMsg({ type: 'error', text: res.error || 'Failed to save submission.' });
    }
  };

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-[#0a0618] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No team session found.</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-purple-600 rounded text-xs font-bold">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0618] text-white">
      {/* Team Portal Top Bar */}
      <div className="bg-[#100926] border-b border-purple-900/30 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-500/40">
              <Award className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-base text-white flex items-center gap-2">
                <span>{currentTeam.teamName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                  {currentTeam.status}
                </span>
                {currentTeam.isFinalist && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Finalist
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">{currentTeam.university}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 hidden md:inline">Leader: {currentTeam.members[0]?.fullName}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Clock },
            { id: 'documents', label: 'Scenario Documents', icon: FileText },
            { id: 'submission', label: 'Online Submission', icon: Upload },
            { id: 'results', label: 'Results & Review Marks', icon: Award },
            ...(currentTeam.isFinalist && settings.phase2_open
              ? [{ id: 'phase2', label: 'Phase 2: Offline Finalist Pass', icon: QrCode }]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-[10px] text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                  active
                    ? 'bg-[#6d3df5] text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Team Status */}
              <div className="glass-panel p-6 rounded-[16px] border border-white/10 space-y-3">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Team Verification</div>
                <div className="flex items-center gap-2 text-emerald-400 font-heading font-bold text-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Approved & Active</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Payment of {currentTeam.payment.amount} BDT confirmed via {currentTeam.payment.method}. Transaction ID: {currentTeam.payment.trxId}.
                </p>
              </div>

              {/* Card 2: Current Phase */}
              <div className="glass-panel p-6 rounded-[16px] border border-cyan-500/30 bg-cyan-950/10 space-y-3">
                <div className="text-xs text-cyan-300 uppercase tracking-wider font-semibold">Active Milestone</div>
                <div className="font-heading font-bold text-lg text-white">
                  {settings.phase2_open ? 'Phase 2: Offline Finalist Round' : 'Phase 1: Online Hackathon'}
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Submission Deadline: {formatDhakaTime(effectiveDeadline)}</span>
                </div>
                {currentTeam.deadlineOverride && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded">
                    Admin Extension Granted: {formatDhakaTime(currentTeam.deadlineOverride)}
                  </div>
                )}
              </div>

              {/* Card 3: What to do next */}
              <div className="glass-panel p-6 rounded-[16px] border border-amber-500/30 bg-amber-950/10 space-y-3">
                <div className="text-xs text-amber-300 uppercase tracking-wider font-semibold">What to do next</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Download scenario documents from the Documents tab.<br />
                  2. Push your project code to a public GitHub repo.<br />
                  3. Submit abstract & video before the automated freeze snapshot.
                </p>
              </div>
            </div>

            {/* Roster & Helpline Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 glass-panel p-6 rounded-[16px] border border-white/10 space-y-4">
                <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span>Confirmed Team Members</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentTeam.members.map((m, idx) => (
                    <div key={m.id} className="p-3.5 rounded-[12px] bg-white/5 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{m.fullName}</span>
                        {m.isLeader && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300">{m.department} • {m.year}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {m.studentId} • {m.email}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 glass-panel p-6 rounded-[16px] border border-white/10 space-y-4">
                <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                  <span>Support Helpline</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Encountering technical blocks with GitHub repos or submission links? Reach out directly:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px]">Email Support</span>
                    <span className="font-bold text-cyan-300">{settings.support_email}</span>
                  </div>
                  <div className="p-2.5 rounded bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px]">Emergency Phone</span>
                    <span className="font-bold text-amber-300">{settings.support_phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scenario Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Scenario Documents & Track Briefs</h3>
                <p className="text-xs text-slate-400">
                  Visible and downloadable exclusively to approved participating teams.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Window: {isDocWindowOpen ? 'Unlocked & Active' : 'Locked until ' + formatDhakaTime(settings.online_start_at)}
              </div>
            </div>

            {!isDocWindowOpen ? (
              <div className="p-8 rounded-[16px] glass-panel border border-amber-500/30 text-center">
                <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h4 className="font-bold text-white text-lg mb-1">Documents Window Opens at {formatDhakaTime(settings.online_start_at)}</h4>
                <p className="text-xs text-slate-300">
                  The problem statements and rulebook files will unlock as soon as the online round officially begins.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {documents.filter((d) => d.visible).map((doc) => (
                  <div
                    key={doc.id}
                    className="glass-panel p-6 rounded-[16px] border border-white/10 hover:border-purple-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-900/40 text-cyan-300 flex items-center justify-center mb-4">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 uppercase font-bold">
                        {doc.kind.replace('_', ' ')}
                      </span>
                      <h4 className="font-heading font-bold text-base text-white mt-2 mb-2">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        File: {doc.fileName} ({(doc.sizeBytes / 1000000).toFixed(2)} MB)
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <a
                        href={`data:text/plain;charset=utf-8,AI%20Hackathon%20Document:%20${encodeURIComponent(doc.title)}`}
                        download={doc.fileName}
                        className="w-full py-2.5 px-4 rounded-[8px] bg-[#6d3df5] hover:bg-[#5b2bd5] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Scenario PDF</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Online Submission Form */}
        {activeTab === 'submission' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h3 className="font-heading font-bold text-xl text-white">Online Round Submission</h3>
              <p className="text-xs text-slate-400 mt-1">
                Editable until {formatDhakaTime(effectiveDeadline)}. At the deadline, our snapshot job automatically records the commit SHA.
              </p>
            </div>

            {submissionMsg && (
              <div
                className={`p-4 rounded-[12px] text-xs font-medium flex items-center gap-2 ${
                  submissionMsg.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                    : 'bg-red-950/60 border border-red-500/40 text-red-200'
                }`}
              >
                {submissionMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{submissionMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmission} className="glass-panel p-6 sm:p-8 rounded-[16px] border border-white/10 space-y-6">
              {/* Abstract with Live 350-character counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Project Abstract / Solution Summary <span className="text-red-400">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono font-bold ${
                      abstract.length > 350 ? 'text-red-400' : abstract.length >= 300 ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  >
                    {abstract.length} / 350 characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  className="w-full px-4 py-3 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 leading-relaxed"
                />
                <span className="text-[11px] text-slate-400">
                  Concise abstract evaluated directly in jury overview. Max 350 characters enforced.
                </span>
              </div>

              {/* GitHub Repo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Public GitHub Repository URL <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  Must be public. Place your report, presentation slides, requirements.txt, and code in this repo.
                </span>
              </div>

              {/* Demo Video URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Demo Video URL <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Video className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  YouTube or Google Drive link (ensure permissions are set to Anyone with link can view).
                </span>
              </div>

              {/* Snapshot status */}
              {currentTeam?.submission?.snapshot && (
                <div className="p-4 rounded-[12px] bg-purple-950/40 border border-purple-500/30 text-xs space-y-1.5">
                  <div className="font-bold text-cyan-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Automated Snapshot Recorded</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">
                    Commit SHA: {currentTeam.submission.snapshot.commitSha}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Captured at: {new Date(currentTeam.submission.snapshot.capturedAt).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isSubmissionOpen}
                  className={`w-full py-3.5 rounded-[10px] font-bold text-sm shadow-xl transition-all ${
                    !isSubmissionOpen
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-[#ffb020] hover:bg-[#ffa000] text-slate-950 shadow-amber-500/25 active:scale-[0.99]'
                  }`}
                >
                  {isSubmissionOpen ? 'Save / Update Submission' : 'Submission Window Closed'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Results & Reviews */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading font-bold text-xl text-white">Judging Marks & Evaluation Feedback</h3>
              <p className="text-xs text-slate-400">
                Evaluation results released by the Super Admin organizing committee.
              </p>
            </div>

            {!settings.results_released ? (
              <div className="glass-panel p-8 rounded-[16px] border border-amber-500/30 text-center max-w-lg mx-auto">
                <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h4 className="font-heading font-bold text-lg text-white mb-1">Results Pending Official Release</h4>
                <p className="text-xs text-slate-300">
                  The panel of judges is currently reviewing submissions. Marks will be visible here once the organizing committee releases the final scores.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Score Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-panel p-6 rounded-[16px] border border-cyan-500/30 bg-cyan-950/20 text-center">
                    <div className="text-xs text-cyan-300 uppercase font-semibold">Online Average Score</div>
                    <div className="font-heading font-extrabold text-4xl text-white mt-1">
                      {teamReviews.length > 0
                        ? (teamReviews.reduce((acc, r) => acc + Number(r.score), 0) / teamReviews.length).toFixed(2)
                        : 'N/A'}{' '}
                      <span className="text-sm text-cyan-300 font-normal">/ {settings.max_score}</span>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-[16px] border border-amber-500/30 bg-amber-950/20 text-center">
                    <div className="text-xs text-amber-300 uppercase font-semibold">Finalist Status</div>
                    <div className="font-heading font-extrabold text-2xl text-amber-400 mt-2">
                      {currentTeam.isFinalist ? 'Selected Finalist 🏆' : 'Participant'}
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-[16px] border border-purple-500/30 bg-purple-950/20 text-center">
                    <div className="text-xs text-purple-300 uppercase font-semibold">Evaluations Completed</div>
                    <div className="font-heading font-extrabold text-4xl text-white mt-1">
                      {teamReviews.length} <span className="text-sm text-purple-200 font-normal">Judges</span>
                    </div>
                  </div>
                </div>

                {/* Individual Judge Reviews (Anonymized as Judge A, Judge B) */}
                <div className="space-y-4">
                  <h4 className="font-heading font-bold text-lg text-white">Review Feedback</h4>
                  {teamReviews.length === 0 ? (
                    <div className="p-4 rounded-[12px] glass-panel text-xs text-slate-400">
                      No finalized reviews recorded yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamReviews.map((rev, idx) => {
                        const anonLabel = `Judge ${String.fromCharCode(65 + idx)}`;
                        return (
                          <div key={rev.id} className="glass-panel p-5 rounded-[16px] border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-cyan-300">
                                {settings.anonymous_judges_to_teams ? anonLabel : rev.judgeName || anonLabel}
                              </span>
                              <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30">
                                {rev.score} / {settings.max_score}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                              "{rev.comment}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Phase 2 Offline Finalist Pass with QR Code */}
        {activeTab === 'phase2' && currentTeam.isFinalist && settings.phase2_open && (
          <div className="max-w-2xl mx-auto glass-panel p-8 sm:p-10 rounded-[20px] border border-cyan-400/50 shadow-2xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Official On-Site Finalist Pass
            </div>

            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              Phase 2: Offline Grand Finale
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Present this digital pass and QR code at the check-in reception desk on arrival at the campus.
            </p>

            {/* QR Code Container */}
            <div className="py-4 flex justify-center">
              <QRCodeSVG
                value={`COU-AI-2026:${currentTeam.id}:${currentTeam.teamName}`}
                size={200}
                className="bg-white p-4"
              />
            </div>

            <div className="text-xs font-mono text-purple-300">
              Team Pass Token: COU-HACK-{currentTeam.id.toUpperCase()}
            </div>

            {/* Event Day Logistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 border-t border-white/10 text-xs">
              <div className="p-3.5 rounded-[12px] bg-white/5 border border-white/10">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>On-Site Venue</span>
                </div>
                <div className="text-slate-300">{settings.phase2_venue || 'Engineering Faculty Building, Comilla University'}</div>
              </div>

              <div className="p-3.5 rounded-[12px] bg-white/5 border border-white/10">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Reporting Date & Time</span>
                </div>
                <div className="text-slate-300">{formatDhakaTime(settings.phase2_date)}</div>
              </div>
            </div>

            <div className="p-4 rounded-[12px] bg-cyan-950/40 border border-cyan-500/30 text-left text-xs text-cyan-200">
              <strong>Check-in instructions:</strong> All registered members must bring their original physical university student ID cards. Power strips and high-speed Wi-Fi will be provided at team stations.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
