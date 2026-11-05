import React, { useState } from 'react';
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Github,
  Video,
  Download,
  Save,
  Lock,
  LogOut,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Filter,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Team } from '../types';

export const JudgePanelPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { auth, logout, teams, settings, reviews, submitReview, onsiteScores, submitOnsiteScore } = useApp();

  const judgeId = auth.user?.id || 'staff-judge-1';
  const judgeName = auth.user?.name || 'Judge';

  const [activeTab, setActiveTab] = useState<'online' | 'onsite'>('online');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unreviewed' | 'draft' | 'finalized'>('all');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Review Form state
  const [scoreInput, setScoreInput] = useState<number | ''>('');
  const [commentInput, setCommentInput] = useState('');
  const [reviewMsg, setReviewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Onsite Score Form state (Phase 2)
  const [onsiteScoreInput, setOnsiteScoreInput] = useState<number | ''>('');
  const [onsiteCommentInput, setOnsiteCommentInput] = useState('');

  // Approved teams submitted
  const approvedTeams = teams.filter((t) => t.status === 'approved' && t.submission);
  const finalistTeams = teams.filter((t) => t.isFinalist && t.status === 'approved');

  // Compute judge progress
  const judgeReviews = reviews.filter((r) => r.judgeId === judgeId);
  const finalizedCount = judgeReviews.filter((r) => r.isFinal).length;
  const draftCount = judgeReviews.filter((r) => !r.isFinal).length;
  const totalTeamsToReview = approvedTeams.length;
  const progressPercent = totalTeamsToReview > 0 ? Math.round((finalizedCount / totalTeamsToReview) * 100) : 0;

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setReviewMsg(null);

    // Load existing online review
    const existing = reviews.find((r) => r.teamId === team.id && r.judgeId === judgeId);
    if (existing) {
      setScoreInput(existing.score);
      setCommentInput(existing.comment);
    } else {
      setScoreInput('');
      setCommentInput('');
    }

    // Load existing onsite score
    const existingOnsite = onsiteScores.find((s) => s.teamId === team.id && s.judgeId === judgeId);
    if (existingOnsite) {
      setOnsiteScoreInput(existingOnsite.score);
      setOnsiteCommentInput(existingOnsite.comment || '');
    } else {
      setOnsiteScoreInput('');
      setOnsiteCommentInput('');
    }
  };

  const handleSaveReview = (isFinal: boolean) => {
    if (!selectedTeam) return;
    setReviewMsg(null);

    if (settings.judging_locked) {
      setReviewMsg({ type: 'error', text: 'Judging is locked by the admin. Edits are disabled.' });
      return;
    }

    if (scoreInput === '' || isNaN(Number(scoreInput))) {
      setReviewMsg({ type: 'error', text: 'Please enter a numerical score.' });
      return;
    }

    const numScore = Number(scoreInput);
    if (numScore < 0 || numScore > settings.max_score) {
      setReviewMsg({ type: 'error', text: `Score must be between 0 and ${settings.max_score}.` });
      return;
    }

    if (!commentInput.trim()) {
      setReviewMsg({ type: 'error', text: 'Please write qualitative review feedback.' });
      return;
    }

    const res = submitReview(selectedTeam.id, numScore, commentInput.trim(), isFinal);
    if (res.success) {
      setReviewMsg({
        type: 'success',
        text: isFinal ? 'Review successfully finalized!' : 'Review saved as draft.',
      });
    } else {
      setReviewMsg({ type: 'error', text: res.error || 'Failed to submit review.' });
    }
  };

  const handleSaveOnsite = () => {
    if (!selectedTeam) return;
    setReviewMsg(null);

    if (onsiteScoreInput === '' || isNaN(Number(onsiteScoreInput))) {
      setReviewMsg({ type: 'error', text: 'Please enter an on-site score.' });
      return;
    }

    const numScore = Number(onsiteScoreInput);
    if (numScore < 0 || numScore > settings.max_score) {
      setReviewMsg({ type: 'error', text: `On-site score must be between 0 and ${settings.max_score}.` });
      return;
    }

    const res = submitOnsiteScore(selectedTeam.id, numScore, onsiteCommentInput.trim(), true);
    if (res.success) {
      setReviewMsg({ type: 'success', text: 'On-site score saved successfully!' });
    } else {
      setReviewMsg({ type: 'error', text: res.error || 'Failed to submit score.' });
    }
  };

  const filteredTeams = (activeTab === 'online' ? approvedTeams : finalistTeams).filter((team) => {
    const matchesSearch =
      team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.university.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const myRev = reviews.find((r) => r.teamId === team.id && r.judgeId === judgeId);
    if (statusFilter === 'unreviewed') return !myRev;
    if (statusFilter === 'draft') return myRev && !myRev.isFinal;
    if (statusFilter === 'finalized') return myRev && myRev.isFinal;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0618] text-white">
      {/* Top Header */}
      <div className="bg-[#0f0824] border-b border-purple-900/30 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-base text-white flex items-center gap-2">
                <span>Evaluation Jury Panel</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase font-bold">
                  Judge
                </span>
                {settings.judging_locked && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/30 uppercase font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Locked
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">Juror: {judgeName} ({auth.user?.email})</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Progress & Stats Bar */}
        <div className="glass-panel p-6 rounded-[16px] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                My Review Progress
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                {finalizedCount} of {totalTeamsToReview} Submissions Finalized ({progressPercent}%)
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-semibold">
                {finalizedCount} Finalized
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 font-semibold">
                {draftCount} In Draft
              </span>
              <span className="px-2.5 py-1 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 font-semibold">
                {Math.max(0, totalTeamsToReview - finalizedCount - draftCount)} Pending
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-[#6d3df5] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Phase Toggle Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => { setActiveTab('online'); setSelectedTeam(null); }}
            className={`px-4 py-2 rounded-[8px] text-xs font-bold transition-colors ${
              activeTab === 'online'
                ? 'bg-[#6d3df5] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Phase 1: Online Round Evaluations ({approvedTeams.length})
          </button>

          {settings.phase2_open && (
            <button
              onClick={() => { setActiveTab('onsite'); setSelectedTeam(null); }}
              className={`px-4 py-2 rounded-[8px] text-xs font-bold transition-colors ${
                activeTab === 'onsite'
                  ? 'bg-cyan-500 text-slate-950 shadow font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Phase 2: On-Site Finalist Scoring ({finalistTeams.length})
            </button>
          )}
        </div>

        {/* Main 2-Column Evaluation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Teams List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search & Filters */}
            <div className="glass-panel p-3.5 rounded-[14px] border border-white/10 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {activeTab === 'online' && (
                <div className="flex items-center gap-1 text-[11px]">
                  {(['all', 'unreviewed', 'draft', 'finalized'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setStatusFilter(mode)}
                      className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                        statusFilter === mode ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTeams.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 glass-panel rounded-[12px]">
                  No teams found matching criteria.
                </div>
              ) : (
                filteredTeams.map((team) => {
                  const myRev = reviews.find((r) => r.teamId === team.id && r.judgeId === judgeId);
                  const isSelected = selectedTeam?.id === team.id;

                  return (
                    <div
                      key={team.id}
                      onClick={() => handleSelectTeam(team)}
                      className={`p-4 rounded-[14px] cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-purple-950/60 border-cyan-400 shadow-lg'
                          : 'glass-panel border-white/10 hover:border-purple-400/40 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                            <span>{team.teamName}</span>
                            {team.isFinalist && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                                Finalist
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{team.university}</div>
                        </div>

                        {/* Status chip */}
                        <div>
                          {myRev?.isFinal ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {myRev.score} pts
                            </span>
                          ) : myRev ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Draft
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                              Not Reviewed
                            </span>
                          )}
                        </div>
                      </div>

                      {team.submission && (
                        <div className="mt-2 text-[11px] text-slate-300 line-clamp-1 italic">
                          "{team.submission.abstract}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Review Details & Form (7 cols) */}
          <div className="lg:col-span-7">
            {!selectedTeam ? (
              <div className="glass-panel p-12 rounded-[16px] border border-white/10 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-500" />
                <h4 className="font-bold text-white text-base">Select a Team from the List</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Click any team on the left to inspect their abstract, GitHub repository commit snapshot, and submit your score.
                </p>
              </div>
            ) : (
              <div className="glass-panel p-6 sm:p-8 rounded-[16px] border border-white/15 shadow-2xl space-y-6">
                {/* Team Header */}
                <div className="pb-4 border-b border-white/10 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl text-white">
                      {selectedTeam.teamName}
                    </h3>
                    <div className="text-xs text-cyan-300">{selectedTeam.university}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Judging Scale</span>
                    <div className="font-bold text-amber-300 text-sm">0 to {settings.max_score} pts</div>
                  </div>
                </div>

                {/* Submission Artifacts (Section 5.6: Abstract, Repo link, Video link, Snapshot ZIP, Commit SHA) */}
                {selectedTeam.submission ? (
                  <div className="space-y-4">
                    {/* Abstract */}
                    <div>
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Submission Abstract
                      </div>
                      <div className="p-4 rounded-[12px] bg-black/40 border border-white/10 text-xs text-slate-200 leading-relaxed">
                        {selectedTeam.submission.abstract}
                      </div>
                    </div>

                    {/* Repository, Video & Snapshot Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <a
                        href={selectedTeam.submission.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 hover:text-white flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Github className="w-4 h-4 text-white" />
                          <span>Public GitHub Repo</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={selectedTeam.submission.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 hover:text-white flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-amber-400" />
                          <span>Demo Video</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Freeze Snapshot Commit Info */}
                    {selectedTeam.submission.snapshot && (
                      <div className="p-3.5 rounded-[12px] bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-purple-200">
                            Deadline Snapshot Commit
                          </div>
                          <div className="font-mono text-[11px] text-cyan-300">
                            SHA: {selectedTeam.submission.snapshot.commitSha.substring(0, 16)}...
                          </div>
                        </div>
                        <a
                          href={`data:text/plain;charset=utf-8,Mock%20GitHub%20Zip%20for%20${selectedTeam.teamName}`}
                          download={`${selectedTeam.teamName}_snapshot.zip`}
                          className="px-3 py-1.5 rounded-[8px] bg-purple-800/60 hover:bg-purple-800 text-white font-bold text-[11px] flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Repo ZIP</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-[12px] bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                    Team has not submitted online materials yet.
                  </div>
                )}

                {/* Feedback Alert */}
                {reviewMsg && (
                  <div
                    className={`p-3.5 rounded-[10px] text-xs font-semibold flex items-center gap-2 ${
                      reviewMsg.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/60 border border-red-500/40 text-red-200'
                    }`}
                  >
                    {reviewMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{reviewMsg.text}</span>
                  </div>
                )}

                {/* Mode 1: Online Scoring Form */}
                {activeTab === 'online' && (
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-bold text-base text-white">
                        Online Evaluation Rubric
                      </h4>
                      {settings.judging_locked && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Judging Locked
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Score (0 to {settings.max_score}, decimals allowed)
                      </label>
                      <input
                        type="number"
                        step={settings.score_decimals ? '0.1' : '1'}
                        min={0}
                        max={settings.max_score}
                        disabled={settings.judging_locked}
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Written Qualitative Review & Feedback
                      </label>
                      <textarea
                        rows={3}
                        disabled={settings.judging_locked}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        disabled={settings.judging_locked}
                        onClick={() => handleSaveReview(false)}
                        className="flex-1 py-2.5 px-4 rounded-[10px] bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition-colors disabled:opacity-40"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        disabled={settings.judging_locked}
                        onClick={() => handleSaveReview(true)}
                        className="flex-1 py-2.5 px-4 rounded-[10px] bg-[#6d3df5] hover:bg-[#5b2bd5] text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-colors disabled:opacity-40"
                      >
                        Finalize Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode 2: On-site Phase 2 Scoring */}
                {activeTab === 'onsite' && (
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <h4 className="font-heading font-bold text-base text-amber-400">
                      Phase 2: On-Site Live Defense Scoring
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Live Defense Score (0 to {settings.max_score})
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={settings.max_score}
                        value={onsiteScoreInput}
                        onChange={(e) => setOnsiteScoreInput(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        On-Site Jury Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={onsiteCommentInput}
                        onChange={(e) => setOnsiteCommentInput(e.target.value)}
                        className="w-full px-4 py-2 rounded-[10px] bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveOnsite}
                      className="w-full py-3 rounded-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg active:scale-98 transition-all"
                    >
                      Submit On-Site Finalist Score
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
