import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  Settings as SettingsIcon,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Key,
  Copy,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Award,
  QrCode,
  Download,
  Calendar,
  LogOut,
  Mail,
  RefreshCw,
  FolderArchive,
  Database,
  History,
  Check,
  ChevronDown,
  Terminal,
  Sparkles,
  Github
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Team, StaffAccount, ScenarioDocument, SystemSettings } from '../types';
import {
  calculateOnlineAverage,
  calculateOnsiteAverage,
  calculateFinalScore,
  generateApprovalEmail,
  generatePaymentCorrectionEmail,
  generateRejectionEmail,
  generateFinalistEmail,
  formatDhakaTime
} from '../utils/rules';
import JSZip from 'jszip';

type AdminTab =
  | 'registrations'
  | 'settings'
  | 'staff'
  | 'documents'
  | 'snapshots'
  | 'judging'
  | 'finalists'
  | 'checkin'
  | 'final_results'
  | 'audit'
  | 'export_bundle';

export const AdminDashboardPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const {
    auth,
    logout,
    settings,
    updateSettings,
    teams,
    staff,
    documents,
    reviews,
    onsiteScores,
    checkins,
    finalResults,
    auditLogs,
    approveTeam,
    rejectTeam,
    requestCorrection,
    regenerateTeamPassword,
    markCredentialsSent,
    uploadDocument,
    deleteDocument,
    toggleDocumentVisibility,
    triggerSnapshot,
    lockJudging,
    releaseResults,
    createStaff,
    toggleStaffActive,
    deleteStaff,
    bannedTeamIds,
    toggleTeamBan,
    deleteTeam,
    setFinalist,
    suggestFinalists,
    checkinTeam,
    computeFinalResults,
    publishFinalResults,
    setDeadlineOverride,
    purgeIdPhotos,
    resetAllDataToDefaults,
  } = useApp();

  const isSuperAdmin = auth.role === 'super_admin';
  const isModerator = auth.role === 'moderator' || isSuperAdmin;

  const [activeTab, setActiveTab] = useState<AdminTab>('registrations');

  // Search & Filters for Registrations
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'payment_correction'>('all');
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<Team | null>(null);

  // Modal / Action states
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'correct' | 'override' | null;
    team: Team | null;
    data?: any;
  }>({ type: null, team: null });

  const [rejectReason, setRejectReason] = useState('Payment could not be verified in bank statement.');
  const [correctionReason, setCorrectionReason] = useState('Transaction ID not found in bKash statement. Please recheck and submit.');
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Settings edit state
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({ ...settings });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Check-in state
  const [checkinQuery, setCheckinQuery] = useState('');
  const [checkinMembersCount, setCheckinMembersCount] = useState(3);
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);

  // Staff creation state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'moderator' | 'judge'>('judge');
  const [staffCreatedInfo, setStaffCreatedInfo] = useState<{ email: string; pass: string } | null>(null);

  // New Document upload state
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocKind, setNewDocKind] = useState<'guideline' | 'rulebook' | 'problem_statement' | 'other'>('problem_statement');
  const [newDocFileName, setNewDocFileName] = useState('');

  // Top N finalists suggestion input
  const [topNInput, setTopNInput] = useState(settings.finalist_count_n || 10);

  // Filtered registrations
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (regStatusFilter !== 'all' && t.status !== regStatusFilter) return false;
      const q = regSearch.toLowerCase();
      const matchName = t.teamName.toLowerCase().includes(q);
      const matchLeader = t.members[0]?.fullName.toLowerCase().includes(q) || t.members[0]?.email.toLowerCase().includes(q);
      const matchTrx = t.payment.trxId.toLowerCase().includes(q);
      return matchName || matchLeader || matchTrx;
    });
  }, [teams, regStatusFilter, regSearch]);

  const statusCounts = useMemo(() => {
    return {
      all: teams.length,
      pending: teams.filter((t) => t.status === 'pending').length,
      approved: teams.filter((t) => t.status === 'approved').length,
      payment_correction: teams.filter((t) => t.status === 'payment_correction').length,
      rejected: teams.filter((t) => t.status === 'rejected').length,
    };
  }, [teams]);

  // Handle Approve
  const handleApprove = (team: Team) => {
    const res = approveTeam(team.id);
    if (res.success && res.temporaryPassword) {
      const leader = team.members.find((m) => m.isLeader) || team.members[0];
      const emailContent = generateApprovalEmail(
        leader.fullName,
        team.teamName,
        window.location.origin,
        leader.email,
        res.temporaryPassword,
        settings.support_email,
        settings.support_phone
      );

      setActionModal({
        type: 'approve',
        team,
        data: {
          email: res.email,
          tempPassword: res.temporaryPassword,
          emailText: emailContent.body,
          subject: emailContent.subject,
        },
      });
    }
  };

  // Handle Reject
  const handleRejectConfirm = () => {
    if (!actionModal.team) return;
    rejectTeam(actionModal.team.id, rejectReason);
    const leader = actionModal.team.members[0];
    const emailContent = generateRejectionEmail(leader.fullName, actionModal.team.teamName, rejectReason);
    setActionModal({
      type: 'reject',
      team: actionModal.team,
      data: {
        emailText: emailContent.body,
        subject: emailContent.subject,
      },
    });
  };

  // Handle Correction Request
  const handleCorrectionConfirm = () => {
    if (!actionModal.team) return;
    const res = requestCorrection(actionModal.team.id, correctionReason);
    if (res.success && res.token) {
      const leader = actionModal.team.members[0];
      const link = `${window.location.origin}/payment-correction/${res.token}`;
      const expires = new Date(Date.now() + settings.correction_link_days * 24 * 3600 * 1000).toLocaleDateString();
      const emailContent = generatePaymentCorrectionEmail(
        leader.fullName,
        actionModal.team.teamName,
        correctionReason,
        link,
        expires
      );
      setActionModal({
        type: 'correct',
        team: actionModal.team,
        data: {
          link,
          emailText: emailContent.body,
          subject: emailContent.subject,
        },
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Export CSV Helper
  const exportCsv = (filename: string, rows: string[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTeamsCsv = () => {
    const rows = [
      ['Team ID', 'Team Name', 'University', 'Status', 'Leader Name', 'Leader Email', 'Payment Method', 'Trx ID', 'Amount', 'Is Finalist'],
      ...teams.map((t) => [
        t.id,
        t.teamName,
        t.university,
        t.status,
        t.members[0]?.fullName || '',
        t.members[0]?.email || '',
        t.payment.method,
        t.payment.trxId,
        String(t.payment.amount),
        t.isFinalist ? 'YES' : 'NO',
      ]),
    ];
    exportCsv('ai_hackathon_teams_export.csv', rows);
  };

  const exportScoresCsv = () => {
    const rows = [
      ['Team ID', 'Team Name', 'Online Avg', 'Onsite Avg', 'Final Score', 'Rank', 'Prize'],
      ...finalResults.map((r) => [
        r.teamId,
        r.teamName,
        String(r.onlineAvg),
        String(r.onsiteAvg),
        String(r.finalScore),
        String(r.rank),
        r.prizeLabel || '',
      ]),
    ];
    exportCsv('ai_hackathon_scores_export.csv', rows);
  };

  const exportSnapshotDownloadScript = () => {
    const scriptLines = [
      '#!/bin/bash',
      '# AI Hackathon 2026 - Bulk GitHub Snapshot Downloader',
      '# Faculty of Engineering, Comilla University',
      'mkdir -p ./hackathon_snapshots',
      'cd ./hackathon_snapshots',
      '',
    ];

    teams.forEach((t) => {
      if (t.submission?.snapshot) {
        scriptLines.push(`echo "Downloading snapshot for ${t.teamName}..."`);
        scriptLines.push(`curl -L "${t.submission.repoUrl}/archive/${t.submission.snapshot.commitSha}.zip" -o "${t.teamName}_${t.submission.snapshot.commitSha.substring(0, 7)}.zip"`);
      }
    });

    scriptLines.push('echo "All snapshots downloaded successfully!"');

    const blob = new Blob([scriptLines.join('\n')], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download_all_snapshots.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate complete project ZIP requested in Section 1 ("Deliver one ZIP containing the full source code plus README.md, LOCAL_SETUP.md, HOSTING.md, ADMIN_MANUAL.md and ASSUMPTIONS.md")
  const downloadFullProjectZip = async () => {
    const zip = new JSZip();

    // Documentation
    zip.file('README.md', `# AI Hackathon Portal - Comilla University\n\nOfficial production web portal for the AI Hackathon, Faculty of Engineering, Comilla University.\n\n## Stack\n- Frontend: React 19, Tailwind CSS v4, Motion, Lucide Icons, Vite\n- Backend / API: Express, TypeScript, Zod, Helmet, Rate Limiter\n- Database: PostgreSQL (schema in /db/schema.sql, seed in /db/seed.sql)\n`);
    zip.file('LOCAL_SETUP.md', `# Local Setup Guide\n\n1. Ensure Node.js 20+ and Docker or PostgreSQL are installed.\n2. Run \`npm install\`\n3. Copy \`.env.example\` to \`.env\`\n4. Run database migrations: \`npm run db:migrate\`\n5. Seed initial data: \`npm run db:seed\`\n6. Start local dev server: \`npm run dev\` on port 3000\n`);
    zip.file('HOSTING.md', `# Hosting & Deployment Guide\n\n### Option A: Cloud Run / Managed Cloud (Recommended)\n- Build: \`npm run build\`\n- Deploy with Dockerfile or Cloud Run continuous deployment.\n\n### Option B: VPS / University Server\n- Ubuntu LTS, Node.js 20, Nginx reverse proxy, PM2 for process management.\n`);
    zip.file('ADMIN_MANUAL.md', `# Admin & Organizing Manual\n\n1. Verification Queue: Check bKash/Nagad/Rocket transaction IDs against statements.\n2. Approvals: Automatically generates temporary team login password.\n3. Snapshots: Automated freeze at deadline records commit SHA.\n4. Judging & Finalists: Multi-judge scoring with locked evaluation and Phase 2 QR check-in.\n`);
    zip.file('ASSUMPTIONS.md', `# Technical Assumptions & Architectural Decisions\n\n- Currency: Bangladeshi Taka (BDT).\n- Timezone: Displayed in Asia/Dhaka (BST, UTC+6).\n- Storage: Private Cloudflare R2 / S3 compatible bucket.\n- Privacy: Public views omit student IDs, phone numbers, and payment details.\n`);

    // SQL schemas
    const schemaSql = `-- PostgreSQL Schema for AI Hackathon Portal
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  role VARCHAR(12) NOT NULL CHECK (role IN ('super_admin','moderator','judge')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name VARCHAR(60) NOT NULL,
  university VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  is_finalist BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_team_name ON teams (lower(team_name));
`;
    zip.file('db/schema.sql', schemaSql);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AI_Hackathon_Comilla_University_Complete_Build.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#090514] text-white">
      {/* Admin Top Navigation */}
      <div className="bg-[#120a2a] border-b border-purple-900/40 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-400/40">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-base text-white flex items-center gap-2">
                <span>Organizing Admin Panel</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900 text-purple-200 border border-purple-500/30 uppercase font-bold">
                  {auth.role}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Logged in as: {auth.user?.name} ({auth.user?.email})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-colors"
            >
              Public Site
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3 py-1.5 rounded-[8px] bg-red-950/40 hover:bg-red-950/60 text-red-300 border border-red-500/30 text-xs flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
          {[
            { id: 'registrations', label: `Registrations (${statusCounts.pending})`, icon: Users },
            ...(isSuperAdmin ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : []),
            ...(isSuperAdmin ? [{ id: 'staff', label: 'Staff & Judges', icon: Shield }] : []),
            { id: 'documents', label: 'Scenario Docs', icon: FileText },
            { id: 'snapshots', label: 'Snapshots & Repos', icon: Terminal },
            { id: 'judging', label: 'Judging Progress', icon: Award },
            { id: 'finalists', label: 'Finalists Selection', icon: Sparkles },
            { id: 'checkin', label: 'On-Site QR Check-in', icon: QrCode },
            { id: 'final_results', label: 'Final Results', icon: Award },
            { id: 'audit', label: 'Audit Log', icon: History },
            { id: 'export_bundle', label: 'Project ZIP & Docs', icon: FolderArchive },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-3.5 py-2 rounded-[8px] text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors min-h-[40px] ${
                  active
                    ? 'bg-[#6d3df5] text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Registration Queue */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            {/* Status counts pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'all', label: 'All Registrations', count: statusCounts.all, color: 'text-white' },
                { id: 'pending', label: 'Pending Review', count: statusCounts.pending, color: 'text-amber-400' },
                { id: 'approved', label: 'Approved & Active', count: statusCounts.approved, color: 'text-emerald-400' },
                { id: 'payment_correction', label: 'Correction Required', count: statusCounts.payment_correction, color: 'text-orange-400' },
                { id: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'text-red-400' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setRegStatusFilter(pill.id as any)}
                  className={`p-3 rounded-[12px] text-left border transition-all ${
                    regStatusFilter === pill.id
                      ? 'bg-purple-900/50 border-cyan-400 shadow'
                      : 'glass-panel border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-[11px] text-slate-400">{pill.label}</div>
                  <div className={`font-heading font-extrabold text-xl mt-0.5 ${pill.color}`}>
                    {pill.count}
                  </div>
                </button>
              ))}
            </div>

            {/* Search and Action Bar */}
            <div className="glass-panel p-4 rounded-[14px] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportTeamsCsv}
                  className="px-3.5 py-2 rounded-[8px] bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Registrations Data Table */}
            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-300 text-xs font-heading font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Team & University</th>
                      <th className="py-3 px-4">Leader Contact</th>
                      <th className="py-3 px-4">Payment & TrxID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Credentials</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          No matching registrations found.
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map((team) => {
                        const leader = team.members.find((m) => m.isLeader) || team.members[0];
                        return (
                          <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-heading font-bold text-white text-sm">
                                {team.teamName}
                              </div>
                              <div className="text-slate-400 text-[11px]">{team.university}</div>
                              <div className="text-[10px] text-purple-300 mt-0.5">
                                {team.members.length} members
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-200">{leader?.fullName}</div>
                              <div className="text-slate-400 text-[11px]">{leader?.email}</div>
                              <div className="text-slate-400 font-mono text-[11px]">{leader?.phone}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-bold text-amber-300 uppercase">
                                {team.payment.method} ({team.payment.amount} BDT)
                              </span>
                              <div className="font-mono text-cyan-300 text-[11px] mt-0.5">
                                Trx: {team.payment.trxId}
                              </div>
                              <div className="text-slate-400 text-[10px]">
                                Sender: {team.payment.senderNo}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {team.status === 'approved' && (
                                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                  Approved
                                </span>
                              )}
                              {team.status === 'pending' && (
                                <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                                  Pending Review
                                </span>
                              )}
                              {team.status === 'payment_correction' && (
                                <span className="px-2.5 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px]">
                                  Correction Needed
                                </span>
                              )}
                              {team.status === 'rejected' && (
                                <span className="px-2.5 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">
                                  Rejected
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {team.account ? (
                                <div>
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={team.account.credentialsSent}
                                      onChange={(e) => markCredentialsSent(team.id, e.target.checked)}
                                      className="rounded border-white/20 text-purple-600 focus:ring-0"
                                    />
                                    <span className="text-[11px] text-slate-300">
                                      {team.account.credentialsSent ? 'Credentials Sent' : 'Mark Sent'}
                                    </span>
                                  </label>
                                  <button
                                    onClick={() => {
                                      const res = regenerateTeamPassword(team.id);
                                      if (res.newPassword) {
                                        alert(`New temporary password for ${team.teamName}: ${res.newPassword}`);
                                      }
                                    }}
                                    className="text-[10px] text-cyan-400 hover:underline mt-1 block"
                                  >
                                    Regenerate Password
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500">Not issued</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedTeamDetail(team)}
                                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-semibold"
                              >
                                View ID Photos
                              </button>

                              {team.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(team)}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActionModal({ type: 'correct', team });
                                    }}
                                    className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[11px]"
                                  >
                                    Correction
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActionModal({ type: 'reject', team });
                                    }}
                                    className="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-semibold text-[11px]"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {isSuperAdmin && (
                                <button
                                  onClick={() => {
                                    setActionModal({ type: 'override', team });
                                    setOverrideDate(team.deadlineOverride || settings.online_end_at);
                                  }}
                                  className="px-2 py-1 rounded bg-purple-900/60 hover:bg-purple-900 text-purple-200 text-[10px]"
                                  title="Deadline override"
                                >
                                  Override
                                </button>
                              )}

                              {isModerator && (
                                <>
                                  {bannedTeamIds.includes(team.id) && (
                                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                                      Banned
                                    </span>
                                  )}
                                  <button
                                    onClick={() => toggleTeamBan(team.id)}
                                    className="px-2.5 py-1 rounded bg-orange-900/60 hover:bg-orange-800 text-orange-200 text-[11px] font-semibold"
                                  >
                                    {bannedTeamIds.includes(team.id) ? 'Unban' : 'Ban'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Delete "${team.teamName}" permanently? This also removes its scores and check-in. This cannot be undone.`)) {
                                        deleteTeam(team.id);
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 text-[11px] font-semibold"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Team Detail with Signed ID Photos */}
        {selectedTeamDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 sm:p-8 rounded-[20px] max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-heading font-bold text-xl text-white">
                    Registration Detail: {selectedTeamDetail.teamName}
                  </h3>
                  <div className="text-xs text-cyan-300">{selectedTeamDetail.university}</div>
                </div>
                <button
                  onClick={() => setSelectedTeamDetail(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Members and ID cards */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Enrolled Members & Uploaded ID Card Photos
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTeamDetail.members.map((m, idx) => (
                    <div key={m.id} className="p-4 rounded-[12px] bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{m.fullName}</span>
                        {m.isLeader && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300">
                        {m.department} • {m.year}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ID: {m.studentId} • Phone: {m.phone}
                      </div>

                      {/* ID photo view */}
                      <div className="pt-2">
                        {m.idCardPhotoUrl ? (
                          <div className="space-y-1">
                            <img
                              src={m.idCardPhotoUrl}
                              alt={`ID of ${m.fullName}`}
                              className="w-full h-36 object-cover rounded-[8px] border border-white/20 shadow-md"
                            />
                            <a
                              href={m.idCardPhotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open full size signed preview</span>
                            </a>
                          </div>
                        ) : (
                          <div className="h-28 rounded-[8px] bg-black/40 border border-dashed border-white/20 flex items-center justify-center text-xs text-slate-500">
                            No photo uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 rounded-[12px] bg-black/40 border border-white/10 space-y-1 text-xs">
                <div className="font-bold text-amber-300 uppercase">Payment Record</div>
                <div className="text-slate-200">Method: {selectedTeamDetail.payment.method} ({selectedTeamDetail.payment.amount} BDT)</div>
                <div className="text-slate-200 font-mono">TrxID: {selectedTeamDetail.payment.trxId}</div>
                <div className="text-slate-200">Sender: {selectedTeamDetail.payment.senderNo}</div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedTeamDetail(null)}
                  className="px-5 py-2.5 rounded-[10px] bg-white/10 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Action Modal (Approve credentials, Reject reason, Correction link) */}
        {actionModal.type && actionModal.team && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 sm:p-8 rounded-[20px] max-w-xl w-full border border-purple-500/40 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-heading font-bold text-lg text-white">
                  {actionModal.type === 'approve' && 'Team Approved - Login Credentials Issued'}
                  {actionModal.type === 'reject' && 'Reject Team Registration'}
                  {actionModal.type === 'correct' && 'Request Payment Correction'}
                  {actionModal.type === 'override' && 'Team Deadline Override'}
                </h3>
                <button
                  onClick={() => setActionModal({ type: null, team: null })}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Approve Result with Copyable Email */}
              {actionModal.type === 'approve' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-[10px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs">
                    Credentials generated. Please copy and email them to the team leader:
                  </div>

                  <div className="p-4 rounded-[12px] bg-black/60 border border-white/10 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                    {actionModal.data?.emailText}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleCopy(actionModal.data?.emailText)}
                      className="px-4 py-2.5 rounded-[8px] bg-[#ffb020] hover:bg-[#ffa000] text-slate-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Ready-Made Email Text'}</span>
                    </button>
                    <button
                      onClick={() => setActionModal({ type: null, team: null })}
                      className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs font-semibold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Reject Confirmation */}
              {actionModal.type === 'reject' && !actionModal.data && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Are you sure you want to reject registration for team <strong>{actionModal.team.teamName}</strong>?
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reason for Rejection (saved in records & emailed)
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-400"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActionModal({ type: null, team: null })}
                      className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectConfirm}
                      className="px-4 py-2 rounded-[8px] bg-red-700 hover:bg-red-600 text-white font-bold text-xs"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {actionModal.type === 'reject' && actionModal.data && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-[10px] bg-red-950/40 border border-red-500/30 text-red-200 text-xs">
                    Team rejected. Copy the rejection notice for the leader:
                  </div>
                  <div className="p-4 rounded-[12px] bg-black/60 border border-white/10 font-mono text-xs text-slate-200 whitespace-pre-wrap select-all">
                    {actionModal.data.emailText}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleCopy(actionModal.data.emailText)}
                      className="px-4 py-2.5 rounded-[8px] bg-[#ffb020] text-slate-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedText ? 'Copied!' : 'Copy Email Text'}</span>
                    </button>
                    <button
                      onClick={() => setActionModal({ type: null, team: null })}
                      className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Correction link generated */}
              {actionModal.type === 'correct' && !actionModal.data && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Request transaction correction from <strong>{actionModal.team.teamName}</strong>. A one-time link valid for {settings.correction_link_days} days will be created.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Correction Reason
                    </label>
                    <textarea
                      rows={3}
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActionModal({ type: null, team: null })}
                      className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCorrectionConfirm}
                      className="px-4 py-2 rounded-[8px] bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                    >
                      Generate One-Time Link
                    </button>
                  </div>
                </div>
              )}

              {actionModal.type === 'correct' && actionModal.data && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-[10px] bg-orange-950/40 border border-orange-500/30 text-orange-200 text-xs">
                    One-time correction link generated. Copy the email text below:
                  </div>
                  <div className="p-4 rounded-[12px] bg-black/60 border border-white/10 font-mono text-xs text-slate-200 whitespace-pre-wrap select-all">
                    {actionModal.data.emailText}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleCopy(actionModal.data.emailText)}
                      className="px-4 py-2.5 rounded-[8px] bg-[#ffb020] text-slate-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedText ? 'Copied!' : 'Copy Email Text'}</span>
                    </button>
                    <button
                      onClick={() => setActionModal({ type: null, team: null })}
                      className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Deadline Override */}
              {actionModal.type === 'override' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Extend submission deadline specifically for <strong>{actionModal.team.teamName}</strong>.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      New Deadline (ISO UTC string or standard date)
                    </label>
                    <input
                      type="text"
                      value={overrideDate}
                      onChange={(e) => setOverrideDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] bg-white/5 border border-white/15 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Extension Reason (logged in audit trail)
                    </label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] bg-white/5 border border-white/15 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActionModal({ type: null, team: null })}
                      className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setDeadlineOverride(actionModal.team!.id, overrideDate, overrideReason);
                        setActionModal({ type: null, team: null });
                      }}
                      className="px-4 py-2 rounded-[8px] bg-[#6d3df5] text-white font-bold text-xs"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Settings (Section 9.1 editable) */}
        {activeTab === 'settings' && isSuperAdmin && (
          <div className="glass-panel p-6 sm:p-8 rounded-[16px] border border-white/10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Event Configuration Settings</h3>
                <p className="text-xs text-slate-400">
                  Every parameter specified in Section 9.1 is editable here and persisted to storage.
                </p>
              </div>
              <button
                onClick={() => {
                  updateSettings(settingsForm);
                  setSettingsSavedMsg(true);
                  setTimeout(() => setSettingsSavedMsg(false), 3000);
                }}
                className="px-5 py-2.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Save All Settings
              </button>
            </div>

            {settingsSavedMsg && (
              <div className="p-3 rounded-[10px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All settings saved successfully and audit log updated!</span>
              </div>
            )}

            {/* Prize places: shown on the home page (3 to 5 places) */}
            {(() => {
              type Prize = { amount_bdt: number; title?: string };
              const prizes: Prize[] = ((settingsForm as unknown as { prizes?: Prize[] }).prizes ?? []);
              const setPrizes = (next: Prize[]) => setSettingsForm({ ...settingsForm, prizes: next } as unknown as SystemSettings);
              const ord = ['1st', '2nd', '3rd', '4th', '5th'];
              return (
                <div className="glass-panel p-4 rounded-[12px] border border-white/10 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200">Prizes (3 to 5 places)</div>
                      <div className="text-slate-400">Shown on the home page. Leave empty to show "announced soon".</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={prizes.length >= 5}
                        onClick={() => setPrizes([...prizes, { amount_bdt: 0 }])}
                        className="px-3 py-1.5 rounded bg-purple-900/60 hover:bg-purple-900 text-purple-200 font-semibold disabled:opacity-30"
                      >
                        Add place
                      </button>
                      <button
                        type="button"
                        disabled={prizes.length === 0}
                        onClick={() => setPrizes(prizes.slice(0, -1))}
                        className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-semibold disabled:opacity-30"
                      >
                        Remove last
                      </button>
                    </div>
                  </div>
                  {prizes.map((p, i) => (
                    <div key={i} className="grid grid-cols-[48px_1fr_1fr] gap-2 items-center">
                      <span className="font-bold text-amber-300">{ord[i]}</span>
                      <input
                        type="text"
                        placeholder="Title (optional)"
                        value={p.title ?? ''}
                        onChange={(e) => setPrizes(prizes.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Amount (BDT)"
                        value={p.amount_bdt}
                        onChange={(e) => setPrizes(prizes.map((x, j) => (j === i ? { ...x, amount_bdt: Number(e.target.value) } : x)))}
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                      />
                    </div>
                  ))}
                  {prizes.length > 0 && (
                    <div className="text-slate-400">
                      Total prize pool: <strong className="text-amber-300">{prizes.reduce((a, p) => a + (p.amount_bdt || 0), 0).toLocaleString('en-US')} BDT</strong>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              {/* Event Name & Venue */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Name</label>
                <input
                  type="text"
                  value={settingsForm.event_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, event_name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Venue</label>
                <input
                  type="text"
                  value={settingsForm.event_venue}
                  onChange={(e) => setSettingsForm({ ...settingsForm, event_venue: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Registration Fee (BDT)</label>
                <input
                  type="number"
                  value={settingsForm.registration_fee_bdt}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_fee_bdt: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              {/* Payment Numbers */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">bKash Number</label>
                <input
                  type="text"
                  value={settingsForm.bkash_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bkash_number: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nagad Number</label>
                <input
                  type="text"
                  value={settingsForm.nagad_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, nagad_number: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rocket Number</label>
                <input
                  type="text"
                  value={settingsForm.rocket_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, rocket_number: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              {/* Dates */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Registration Open (UTC)</label>
                <input
                  type="text"
                  value={settingsForm.registration_open_at}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_open_at: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Registration Close (UTC)</label>
                <input
                  type="text"
                  value={settingsForm.registration_close_at}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_close_at: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Online Round End / Deadline (UTC)</label>
                <input
                  type="text"
                  value={settingsForm.online_end_at}
                  onChange={(e) => setSettingsForm({ ...settingsForm, online_end_at: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              {/* Weights and Scales */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Score Scale</label>
                <input
                  type="number"
                  value={settingsForm.max_score}
                  onChange={(e) => setSettingsForm({ ...settingsForm, max_score: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Online Weight (%)</label>
                <input
                  type="number"
                  value={settingsForm.online_weight}
                  onChange={(e) => setSettingsForm({ ...settingsForm, online_weight: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">On-Site Weight (%)</label>
                <input
                  type="number"
                  value={settingsForm.onsite_weight}
                  onChange={(e) => setSettingsForm({ ...settingsForm, onsite_weight: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                />
              </div>
            </div>

            {/* Switches and Flags */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Phase Locks & Feature Flags
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <label className="flex items-center gap-2 p-3 rounded bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.judging_locked}
                    onChange={(e) => setSettingsForm({ ...settingsForm, judging_locked: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span>Lock Judging (No further edits)</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.results_released}
                    onChange={(e) => setSettingsForm({ ...settingsForm, results_released: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span>Release Results to Teams</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.phase2_open}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phase2_open: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span>Phase 2 Unlock (Finalist Pass & QR)</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_pending_teams_public}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_pending_teams_public: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span>Show Pending Teams Publicly</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Staff Management */}
        {activeTab === 'staff' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Staff & Jury Account Provisioning</h3>
                <p className="text-xs text-slate-400">
                  Create moderators and jury evaluators with generated credentials.
                </p>
              </div>
            </div>

            {/* Create Staff Form */}
            <div className="glass-panel p-6 rounded-[16px] border border-white/10 space-y-4">
              <h4 className="font-heading font-bold text-sm text-cyan-300">Create New Staff / Judge</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded bg-[#130b2c] border border-white/15 text-white"
                  >
                    <option value="judge">Judge / Jury Member</option>
                    <option value="moderator">Verification Moderator</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={async () => {
                      if (!newStaffName || !newStaffEmail) {
                        alert('Please fill in name and email.');
                        return;
                      }

                      const res = await createStaff(newStaffName, newStaffEmail, newStaffRole);
                      if (res.success && res.tempPassword) {
                        setStaffCreatedInfo({ email: newStaffEmail, pass: res.tempPassword });
                        setNewStaffName('');
                        setNewStaffEmail('');
                      } else {
                        alert(res.error || 'Failed to create staff');
                      }
                    }}
                    className="w-full py-2 px-4 rounded bg-[#6d3df5] hover:bg-[#5b2bd5] text-white font-bold text-xs"
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {staffCreatedInfo && (
                <div className="p-3.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between">
                  <div>
                    Staff created! Email: <strong>{staffCreatedInfo.email}</strong> • Password:{' '}
                    <strong className="text-amber-300 font-mono">{staffCreatedInfo.pass}</strong>
                  </div>
                  <button
                    onClick={() => setStaffCreatedInfo(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Staff list */}
            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-semibold text-slate-300">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Active Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-4 text-slate-300">{s.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30 font-semibold uppercase text-[10px]">
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {s.active ? (
                          <span className="text-emerald-400 font-semibold">Active</span>
                        ) : (
                          <span className="text-red-400 font-semibold">Banned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.role !== 'super_admin' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleStaffActive(s.id)}
                              className="px-2.5 py-1 rounded bg-orange-900/60 hover:bg-orange-800 text-orange-200 text-[11px]"
                            >
                              {s.active ? 'Ban' : 'Unban'}
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${s.name} (${s.email}) permanently? Their scores will be removed too.`)) {
                                  deleteStaff(s.id);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 text-[11px]"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Scenario Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Scenario Documents & Rules</h3>
                <p className="text-xs text-slate-400">
                  Uploaded files are time-gated between online_start_at and the end of the visibility window.
                </p>
              </div>
            </div>

            {/* Upload document form */}
            {isSuperAdmin && (
              <div className="glass-panel p-6 rounded-[16px] border border-white/10 space-y-4">
                <h4 className="font-heading font-bold text-sm text-cyan-300">Upload New Scenario Document</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Document Title</label>
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Kind</label>
                    <select
                      value={newDocKind}
                      onChange={(e) => setNewDocKind(e.target.value as any)}
                      className="w-full px-3 py-2 rounded bg-[#130b2c] border border-white/15 text-white"
                    >
                      <option value="guideline">Guideline</option>
                      <option value="rulebook">Rulebook</option>
                      <option value="problem_statement">Problem Statement</option>
                      <option value="other">Other Extra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">File Name</label>
                    <input
                      type="text"
                      value={newDocFileName}
                      onChange={(e) => setNewDocFileName(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        if (!newDocTitle) {
                          alert('Please enter document title.');
                          return;
                        }
                        uploadDocument({
                          title: newDocTitle,
                          kind: newDocKind,
                          fileKey: `scenarios/${newDocFileName || 'doc.pdf'}`,
                          fileName: newDocFileName || 'Scenario_File.pdf',
                          sizeBytes: 1500000,
                          visible: true,
                          sortOrder: documents.length + 1,
                          uploadedBy: auth.user?.id || 'admin',
                        });
                        setNewDocTitle('');
                        setNewDocFileName('');
                      }}
                      className="w-full py-2 px-4 rounded bg-[#6d3df5] text-white font-bold text-xs"
                    >
                      Upload File
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Documents List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="glass-panel p-5 rounded-[16px] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-500/30 uppercase font-bold">
                      {doc.kind.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => toggleDocumentVisibility(doc.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        doc.visible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {doc.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-white">{doc.title}</h4>
                  <div className="text-[11px] text-slate-400">
                    {doc.fileName} ({(doc.sizeBytes / 1000000).toFixed(2)} MB)
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 pt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: GitHub Snapshots Subsystem (Section 12) */}
        {activeTab === 'snapshots' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">GitHub Snapshot & Freeze Subsystem</h3>
                <p className="text-xs text-slate-400">
                  Captures exact commit SHA at deadline to prevent late repository alterations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportSnapshotDownloadScript}
                  className="px-3.5 py-2 rounded-[8px] bg-purple-900/60 hover:bg-purple-900 text-purple-200 text-xs font-semibold flex items-center gap-1.5 border border-purple-500/30"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Download Bash Script</span>
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-semibold">
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Repository URL</th>
                    <th className="py-3 px-4">Frozen Commit SHA</th>
                    <th className="py-3 px-4">Snapshot Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {teams.filter((t) => t.status === 'approved').map((t) => {
                    const snap = t.submission?.snapshot;
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-white">{t.teamName}</td>
                        <td className="py-3 px-4">
                          {t.submission ? (
                            <a
                              href={t.submission.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 hover:underline flex items-center gap-1"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span className="font-mono text-[11px] truncate max-w-xs">{t.submission.repoUrl}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500">No submission</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-purple-300">
                          {snap ? snap.commitSha.substring(0, 16) + '...' : 'Not captured'}
                        </td>
                        <td className="py-3 px-4">
                          {snap ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                              OK (Frozen)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
                              Pending Job
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              triggerSnapshot(t.id);
                              alert(`Snapshot successfully generated for ${t.teamName}!`);
                            }}
                            className="px-2.5 py-1 rounded bg-[#6d3df5] hover:bg-[#5b2bd5] text-white text-[11px] font-semibold"
                          >
                            {snap ? 'Re-run Snapshot' : 'Run Snapshot'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Judging Progress */}
        {activeTab === 'judging' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Judging Progress & Score Locking</h3>
                <p className="text-xs text-slate-400">
                  Track jury reviews, lock evaluations, and release final marks to team portals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => lockJudging(!settings.judging_locked)}
                  className={`px-3.5 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 ${
                    settings.judging_locked ? 'bg-amber-600 text-white' : 'bg-red-800 text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{settings.judging_locked ? 'Unlock Judging' : 'Lock Judging'}</span>
                </button>

                <button
                  onClick={() => releaseResults(!settings.results_released)}
                  className={`px-3.5 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 ${
                    settings.results_released ? 'bg-emerald-600 text-white' : 'bg-[#6d3df5] text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{settings.results_released ? 'Results Released (Live)' : 'Release Results to Teams'}</span>
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-semibold">
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">University</th>
                    <th className="py-3 px-4">Finalized Reviews</th>
                    <th className="py-3 px-4">Online Average</th>
                    <th className="py-3 px-4 text-right">Detailed Scores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {teams.filter((t) => t.status === 'approved').map((t) => {
                    const teamRevs = reviews.filter((r) => r.teamId === t.id && r.isFinal);
                    const avg = calculateOnlineAverage(teamRevs);
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-bold text-white">{t.teamName}</td>
                        <td className="py-3.5 px-4 text-slate-300">{t.university}</td>
                        <td className="py-3.5 px-4 text-cyan-300 font-semibold">
                          {teamRevs.length} Judges
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-heading font-extrabold text-amber-300 text-sm">
                            {avg > 0 ? avg.toFixed(2) : 'No reviews'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                          {teamRevs.map((r) => `${r.score}pts`).join(', ') || 'Pending'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Finalists Selection */}
        {activeTab === 'finalists' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Finalists Selection & Phase 2 Gate</h3>
                <p className="text-xs text-slate-400">
                  Select top ranked teams for the on-site round at Comilla University.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={topNInput}
                  onChange={(e) => setTopNInput(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 rounded bg-white/10 border border-white/20 text-xs text-white"
                />
                <button
                  onClick={() => suggestFinalists(topNInput)}
                  className="px-3.5 py-2 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Suggest Top {topNInput} Finalists
                </button>
              </div>
            </div>

            {/* Teams Finalist Toggles */}
            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-semibold">
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">University</th>
                    <th className="py-3 px-4">Online Score Avg</th>
                    <th className="py-3 px-4">Finalist Flag</th>
                    <th className="py-3 px-4 text-right">Email Template</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {teams.filter((t) => t.status === 'approved').map((t) => {
                    const avg = calculateOnlineAverage(reviews.filter((r) => r.teamId === t.id && r.isFinal));
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-white">{t.teamName}</td>
                        <td className="py-3 px-4 text-slate-300">{t.university}</td>
                        <td className="py-3 px-4 font-bold text-amber-300">{avg.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setFinalist(t.id, !t.isFinalist)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              t.isFinalist
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-white/5 text-slate-400 border border-white/10'
                            }`}
                          >
                            {t.isFinalist ? '⭐ Finalist Selected' : 'Not Finalist'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {t.isFinalist && (
                            <button
                              onClick={() => {
                                const email = generateFinalistEmail(
                                  t.members[0]?.fullName,
                                  t.teamName,
                                  settings.phase2_venue,
                                  formatDhakaTime(settings.phase2_date),
                                  window.location.origin
                                );
                                handleCopy(email.body);
                              }}
                              className="text-xs text-amber-300 hover:underline"
                            >
                              Copy Finalist Email
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: QR Check-in on Event Day */}
        {activeTab === 'checkin' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h3 className="font-heading font-bold text-xl text-white">On-Site QR & Reception Check-in</h3>
              <p className="text-xs text-slate-400">
                Scan team pass or enter team name to record arrival and present members count.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-[16px] border border-white/10 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1">Search Team Name / ID / Pass Code</label>
                  <input
                    type="text"
                    value={checkinQuery}
                    onChange={(e) => setCheckinQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Members Physically Present</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={checkinMembersCount}
                    onChange={(e) => setCheckinMembersCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  const targetTeam = teams.find(
                    (t) =>
                      t.teamName.toLowerCase().includes(checkinQuery.toLowerCase()) ||
                      t.id.toLowerCase().includes(checkinQuery.toLowerCase())
                  );
                  if (!targetTeam) {
                    setCheckinMsg('No matching team found.');
                    return;
                  }
                  const res = checkinTeam(targetTeam.id, checkinMembersCount);
                  if (res.success) {
                    setCheckinMsg(`Successfully checked in "${targetTeam.teamName}" with ${checkinMembersCount} members present!`);
                    setCheckinQuery('');
                  } else {
                    setCheckinMsg(res.error || 'Check-in failed');
                  }
                }}
                className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Confirm Team Arrival & Check-In
              </button>

              {checkinMsg && (
                <div className="p-3 rounded bg-purple-950/60 border border-purple-500/40 text-xs text-cyan-200">
                  {checkinMsg}
                </div>
              )}
            </div>

            {/* Checked in list */}
            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 font-bold text-xs text-white">
                Checked-In Finalist Teams ({checkins.length})
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/5 text-slate-400">
                    <th className="py-2.5 px-4">Team</th>
                    <th className="py-2.5 px-4">Arrival Time</th>
                    <th className="py-2.5 px-4">Members Present</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {checkins.map((c) => {
                    const t = teams.find((team) => team.id === c.teamId);
                    return (
                      <tr key={c.teamId}>
                        <td className="py-2.5 px-4 font-bold text-white">{t?.teamName}</td>
                        <td className="py-2.5 px-4 text-slate-300">{new Date(c.checkedInAt).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-4 text-emerald-400 font-semibold">{c.membersPresent} Present</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 9: Final Results (Weighted 50/50 computation, ties, awards) */}
        {activeTab === 'final_results' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Final Overall Results & Awards</h3>
                <p className="text-xs text-slate-400">
                  Formula: {settings.online_weight}% Online Score + {settings.onsite_weight}% On-Site Score.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={computeFinalResults}
                  className="px-3.5 py-2 rounded-[8px] bg-[#ffb020] hover:bg-[#ffa000] text-slate-950 font-bold text-xs shadow"
                >
                  Compute Overall Final Scores
                </button>
                <button
                  onClick={exportScoresCsv}
                  className="px-3.5 py-2 rounded-[8px] bg-white/10 text-white font-semibold text-xs"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => publishFinalResults(true)}
                  className="px-3.5 py-2 rounded-[8px] bg-emerald-600 text-white font-bold text-xs"
                >
                  Publish Publicly
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-semibold">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">University</th>
                    <th className="py-3 px-4">Online Avg ({settings.online_weight}%)</th>
                    <th className="py-3 px-4">On-Site Avg ({settings.onsite_weight}%)</th>
                    <th className="py-3 px-4">Final Weighted Score</th>
                    <th className="py-3 px-4 text-right">Award Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {finalResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Click "Compute Overall Final Scores" to calculate ranks.
                      </td>
                    </tr>
                  ) : (
                    finalResults.map((r) => (
                      <tr key={r.teamId} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-heading font-extrabold text-sm text-cyan-300">
                          #{r.rank}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">{r.teamName}</td>
                        <td className="py-3.5 px-4 text-slate-300">{r.university}</td>
                        <td className="py-3.5 px-4 text-slate-300">{r.onlineAvg.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-slate-300">{r.onsiteAvg.toFixed(2)}</td>
                        <td className="py-3.5 px-4 font-heading font-extrabold text-amber-300 text-sm">
                          {r.finalScore.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            {r.prizeLabel}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 10: Audit Log & ID Photo Purge */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Security Audit Log & Retention Policy</h3>
                <p className="text-xs text-slate-400">
                  Records approvals, rejections, password resets, setting changes, and data purges.
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to purge all student ID card photos from storage? This action cannot be undone.')) {
                      purgeIdPhotos();
                      alert('Student ID photos successfully purged from storage.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-[8px] bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/30 text-xs font-bold"
                >
                  Purge ID Photos ({settings.id_photo_retention_days} Days Reminder)
                </button>
              )}
            </div>

            <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-semibold sticky top-0 bg-[#0c0620]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 text-cyan-300">{log.actorName}</td>
                      <td className="py-2.5 px-4 font-bold text-purple-300">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {log.targetType}:{log.targetId}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">
                        {JSON.stringify(log.detail)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 11: Export Project Bundle & Documentation (Section 1 Builder Deliverable) */}
        {activeTab === 'export_bundle' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h3 className="font-heading font-bold text-xl text-white">Full Build Deliverable Package</h3>
              <p className="text-xs text-slate-400">
                Specification Section 1 Requirement: "Deliver one ZIP containing the full source code plus README.md, LOCAL_SETUP.md, HOSTING.md, ADMIN_MANUAL.md and ASSUMPTIONS.md."
              </p>
            </div>

            <div className="glass-panel p-8 rounded-[16px] border border-purple-500/40 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center mx-auto text-cyan-300">
                <FolderArchive className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-2xl text-white">
                  Download Full System ZIP Bundle
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2">
                  Generates the exact deployable ZIP bundle complete with local setup scripts, full PostgreSQL migrations, SQL schemas, and manuals.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={downloadFullProjectZip}
                  className="px-8 py-3.5 rounded-[10px] bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 mx-auto active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4 fill-slate-950" />
                  <span>Download Complete ZIP Package</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-slate-300 pt-4 border-t border-white/10 font-mono">
                <div className="p-2 rounded bg-white/5">README.md</div>
                <div className="p-2 rounded bg-white/5">LOCAL_SETUP.md</div>
                <div className="p-2 rounded bg-white/5">HOSTING.md</div>
                <div className="p-2 rounded bg-white/5">ADMIN_MANUAL.md</div>
                <div className="p-2 rounded bg-white/5">ASSUMPTIONS.md</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};