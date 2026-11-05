import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Team,
  StaffAccount,
  SystemSettings,
  ScenarioDocument,
  Review,
  OnsiteScore,
  Checkin,
  FinalResult,
  AuditLogEntry,
  CorrectionToken,
  UserRole
} from '../types';
import {
  calculateOnlineAverage,
  calculateOnsiteAverage,
  calculateFinalScore,
  suggestTopNFinalists
} from '../utils/rules';

interface AuthSession {
  role: UserRole;
  user: {
    id: string;
    name: string;
    email: string;
    teamId?: string;
    mustChangePassword?: boolean;
  } | null;
}

interface AppContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  teams: Team[];
  staff: StaffAccount[];
  documents: ScenarioDocument[];
  reviews: Review[];
  onsiteScores: OnsiteScore[];
  checkins: Checkin[];
  finalResults: FinalResult[];
  auditLogs: AuditLogEntry[];
  correctionTokens: CorrectionToken[];
  auth: AuthSession;
  
  // Auth methods
  loginTeam: (email: string, pass: string) => { success: boolean; error?: string };
  loginStaff: (email: string, pass: string) => { success: boolean; error?: string; role?: UserRole };
  logout: () => void;
  changePassword: (newPass: string) => { success: boolean; error?: string };
  switchRoleQuick: (role: UserRole, targetId?: string) => void;

  // Registration methods
  registerTeam: (teamData: Omit<Team, 'id' | 'status' | 'createdAt' | 'isFinalist'>) => {
    success: boolean;
    error?: string;
    teamId?: string;
  };
  submitPaymentCorrection: (token: string, newSenderNo: string, newTrxId: string) => {
    success: boolean;
    error?: string;
  };

  // Moderator / Admin workflow
  approveTeam: (teamId: string) => { success: boolean; temporaryPassword?: string; email?: string; error?: string };
  rejectTeam: (teamId: string, reason: string) => { success: boolean; error?: string };
  requestCorrection: (teamId: string, reason: string) => { success: boolean; token?: string; error?: string };
  regenerateTeamPassword: (teamId: string) => { success: boolean; newPassword?: string };
  markCredentialsSent: (teamId: string, sent: boolean) => void;

  // Documents
  uploadDocument: (doc: Omit<ScenarioDocument, 'id' | 'createdAt'>) => void;
  deleteDocument: (id: string) => void;
  toggleDocumentVisibility: (id: string) => void;

  // Team submission
  saveSubmission: (abstract: string, repoUrl: string, videoUrl: string) => { success: boolean; error?: string };
  triggerSnapshot: (teamId: string) => { success: boolean };

  // Judging
  submitReview: (teamId: string, score: number, comment: string, isFinal: boolean) => { success: boolean; error?: string };
  submitOnsiteScore: (teamId: string, score: number, comment?: string, isFinal?: boolean) => { success: boolean; error?: string };
  lockJudging: (lock: boolean) => void;
  releaseResults: (release: boolean) => void;

  // Staff Management
  createStaff: (name: string, email: string, role: 'moderator' | 'judge') => { success: boolean; tempPassword?: string; error?: string };
  toggleStaffActive: (id: string) => void;
  deleteStaff: (id: string) => void;

  // Team moderation
  bannedTeamIds: string[];
  toggleTeamBan: (teamId: string) => void;
  deleteTeam: (teamId: string) => void;

  // Finalists & Offline
  setFinalist: (teamId: string, isFinalist: boolean) => void;
  suggestFinalists: (n?: number) => void;
  checkinTeam: (teamId: string, membersPresent: number) => { success: boolean; error?: string };
  computeFinalResults: () => void;
  publishFinalResults: (publish: boolean) => void;
  setDeadlineOverride: (teamId: string, newEndAt: string, reason: string) => void;
  purgeIdPhotos: () => void;
  resetAllDataToDefaults: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  event_name: 'AI Hackathon, Engineering Faculty',
  event_venue: 'Comilla University, Kotbari, Cumilla',
  event_start_at: '2026-11-20T09:00:00Z',
  registration_open_at: '2026-11-01T00:00:00Z',
  registration_close_at: '2026-11-15T23:59:59Z',
  registration_fee_bdt: 1000,
  bkash_number: '01712-345678 (Personal / Send Money)',
  nagad_number: '01812-345678 (Personal)',
  rocket_number: '01912-345678-9',
  min_members: 3,
  max_members: 4,
  online_start_at: '2026-11-16T00:00:00Z',
  online_end_at: '2026-11-18T23:59:59Z',
  max_score: 100,
  score_decimals: true,
  judging_locked: false,
  results_released: false,
  finalist_count_n: 10,
  phase2_open: false,
  phase2_date: '2026-11-25T09:00:00Z',
  phase2_venue: 'CSE Department Labs, Faculty of Engineering, Comilla University',
  online_weight: 50,
  onsite_weight: 50,
  show_pending_teams_public: true,
  anonymous_judges_to_teams: true,
  correction_link_days: 3,
  id_photo_retention_days: 30,
  support_email: 'hackathon@cou.ac.bd',
  support_phone: '+880 1712-345678',
};

const INITIAL_STAFF: StaffAccount[] = [
  {
    id: 'staff-admin-1',
    name: 'Super Admin CoU',
    email: 'admin@cou.ac.bd',
    role: 'super_admin',
    active: true,
    mustChangePassword: false,
    createdAt: '2026-11-01T10:00:00Z',
    temporaryPassword: 'admin123',
  },
];

const INITIAL_DOCUMENTS: ScenarioDocument[] = [
  {
    id: 'doc-1',
    title: 'AI Hackathon 2026 - Official Guidelines & Code of Ethics',
    kind: 'guideline',
    fileKey: 'scenarios/guidelines_v1.pdf',
    fileName: 'AI_Hackathon_2026_Guidelines.pdf',
    sizeBytes: 1420000,
    visible: true,
    sortOrder: 1,
    uploadedBy: 'staff-admin-1',
    createdAt: '2026-11-02T10:00:00Z',
  },
  {
    id: 'doc-2',
    title: 'Online Round Rulebook & Evaluation Rubric',
    kind: 'rulebook',
    fileKey: 'scenarios/rulebook_v1.pdf',
    fileName: 'Evaluation_Rubric_and_Rulebook.pdf',
    sizeBytes: 980000,
    visible: true,
    sortOrder: 2,
    uploadedBy: 'staff-admin-1',
    createdAt: '2026-11-02T11:00:00Z',
  },
  {
    id: 'doc-3',
    title: 'Problem Statements: AgriTech & HealthAI Tracks',
    kind: 'problem_statement',
    fileKey: 'scenarios/problem_statement_tracks.pdf',
    fileName: 'Track_Problem_Statements_2026.pdf',
    sizeBytes: 2150000,
    visible: true,
    sortOrder: 3,
    uploadedBy: 'staff-admin-1',
    createdAt: '2026-11-02T12:00:00Z',
  },
];

const INITIAL_TEAMS: Team[] = [];

const INITIAL_REVIEWS: Review[] = [];

const INITIAL_CORRECTION_TOKENS: CorrectionToken[] = [];

const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
  : '';

const apiFetch = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload as T;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);

  const [staff, setStaff] = useState<StaffAccount[]>(INITIAL_STAFF);

  const [documents, setDocuments] = useState<ScenarioDocument[]>(INITIAL_DOCUMENTS);

  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  const [onsiteScores, setOnsiteScores] = useState<OnsiteScore[]>([]);

  const [checkins, setCheckins] = useState<Checkin[]>([]);

  const [finalResults, setFinalResults] = useState<FinalResult[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      actorType: 'super_admin',
      actorId: 'staff-admin-1',
      actorName: 'Super Admin CoU',
      action: 'INITIALIZE_SYSTEM',
      targetType: 'system',
      targetId: 'comilla-uni-2026',
      detail: { event: 'AI Hackathon 2026 initial configuration deployed' },
      createdAt: '2026-11-01T10:00:00Z',
    },
  ]);

  const [correctionTokens, setCorrectionTokens] = useState<CorrectionToken[]>(INITIAL_CORRECTION_TOKENS);

  const [bannedTeamIds, setBannedTeamIds] = useState<string[]>([]);

  const [auth, setAuth] = useState<AuthSession>({ role: 'visitor', user: null });

  const addAuditLog = (action: string, targetType: string, targetId: string, detail: Record<string, any>) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorType: auth.role,
      actorId: auth.user?.id || 'anonymous',
      actorName: auth.user?.name || (auth.role === 'team' ? 'Team Leader' : 'Visitor'),
      action,
      targetType,
      targetId,
      detail,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      addAuditLog('UPDATE_SETTINGS', 'settings', 'global', newSettings);
      return updated;
    });
  };

  const loginTeam = (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (API_BASE_URL) {
      void apiFetch<{ success: boolean; error?: string; user?: any; team?: Team }>('/api/auth/team-login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      }).then((payload) => {
        if (payload.success) {
          setAuth({
            role: 'team',
            user: {
              id: payload.user?.id || 'team',
              name: payload.user?.name || 'Team Leader',
              email: payload.user?.email || cleanEmail,
              teamId: payload.user?.teamId,
              mustChangePassword: payload.user?.mustChangePassword || false,
            },
          });
        }
      }).catch(() => undefined);
    }

    const team = teams.find(
      (t) => t.account?.loginEmail.toLowerCase() === cleanEmail || t.members[0]?.email.toLowerCase() === cleanEmail
    );

    if (!team) {
      return { success: false, error: 'Team account not found. Ensure your registration is approved.' };
    }

    if (bannedTeamIds.includes(team.id)) {
      return { success: false, error: 'This team has been banned by the organizers.' };
    }

    if (team.status !== 'approved') {
      return { success: false, error: `Team status is currently '${team.status}'. Only approved teams can log in.` };
    }

    if (team.account?.temporaryPassword && team.account.temporaryPassword !== pass) {
      return { success: false, error: 'Invalid password. Check the credentials sent by the admin.' };
    }

    const leader = team.members.find((m) => m.isLeader) || team.members[0];
    const session: AuthSession = {
      role: 'team',
      user: {
        id: team.id,
        name: leader ? leader.fullName : team.teamName,
        email: cleanEmail,
        teamId: team.id,
        mustChangePassword: team.account?.mustChangePassword || false,
      },
    };
    setAuth(session);
    addAuditLog('TEAM_LOGIN', 'team', team.id, { teamName: team.teamName });
    return { success: true };
  };

  const loginStaff = (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (API_BASE_URL) {
      void apiFetch<{ success: boolean; error?: string; role?: UserRole; user?: any }>('/api/auth/staff-login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      }).then((payload) => {
        if (payload.success) {
          setAuth({
            role: payload.role || 'super_admin',
            user: {
              id: payload.user?.id || 'staff',
              name: payload.user?.name || 'Staff',
              email: payload.user?.email || cleanEmail,
              mustChangePassword: payload.user?.mustChangePassword || false,
            },
          });
        }
      }).catch(() => undefined);
    }

    const member = staff.find((s) => s.email.toLowerCase() === cleanEmail);

    if (!member) {
      return { success: false, error: 'Staff account not found' };
    }

    if (!member.active) {
      return { success: false, error: 'This staff account has been deactivated' };
    }

    if (member.temporaryPassword && member.temporaryPassword !== pass) {
      return { success: false, error: 'Invalid staff password' };
    }

    const session: AuthSession = {
      role: member.role,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        mustChangePassword: member.mustChangePassword,
      },
    };
    setAuth(session);
    addAuditLog('STAFF_LOGIN', 'staff', member.id, { role: member.role, email: member.email });
    return { success: true, role: member.role };
  };

  const logout = () => {
    setAuth({ role: 'visitor', user: null });
  };

  const changePassword = (newPass: string) => {
    if (!auth.user) return { success: false, error: 'Not authenticated' };

    if (auth.role === 'team' && auth.user.teamId) {
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === auth.user?.teamId) {
            return {
              ...t,
              account: t.account
                ? { ...t.account, temporaryPassword: newPass, mustChangePassword: false }
                : undefined,
            };
          }
          return t;
        })
      );
    } else if (['super_admin', 'moderator', 'judge'].includes(auth.role)) {
      setStaff((prev) =>
        prev.map((s) => (s.id === auth.user?.id ? { ...s, temporaryPassword: newPass, mustChangePassword: false } : s))
      );
    }

    setAuth((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, mustChangePassword: false } : null,
    }));

    addAuditLog('CHANGE_PASSWORD', auth.role, auth.user.id, {});
    return { success: true };
  };

  const switchRoleQuick = (role: UserRole, targetId?: string) => {
    if (role === 'visitor') {
      setAuth({ role: 'visitor', user: null });
      return;
    }

    if (role === 'team') {
      const team = targetId ? teams.find((t) => t.id === targetId) : teams[0];
      if (team) {
        const leader = team.members[0];
        setAuth({
          role: 'team',
          user: {
            id: team.id,
            name: leader ? leader.fullName : team.teamName,
            email: leader ? leader.email : 'team@test.com',
            teamId: team.id,
            mustChangePassword: false,
          },
        });
      }
      return;
    }

    const st = staff.find((s) => s.role === role);
    if (st) {
      setAuth({
        role,
        user: {
          id: st.id,
          name: st.name,
          email: st.email,
          mustChangePassword: false,
        },
      });
    }
  };

  const registerTeam = (teamData: Omit<Team, 'id' | 'status' | 'createdAt' | 'isFinalist'>) => {
    if (API_BASE_URL) {
      try {
        apiFetch<{ success: boolean; teamId?: string; error?: string }>('/api/teams/register', {
          method: 'POST',
          body: JSON.stringify(teamData),
        }).then((payload) => {
          if (payload.success && payload.teamId) {
            setTeams((prev) => [
              {
                ...teamData,
                id: payload.teamId!,
                status: 'pending',
                isFinalist: false,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        }).catch(() => undefined);
      } catch {
        // fallback below
      }
    }

    const lowerName = teamData.teamName.trim().toLowerCase();
    if (teams.some((t) => t.teamName.toLowerCase() === lowerName)) {
      return { success: false, error: `Team name "${teamData.teamName}" is already registered. Please choose another.` };
    }

    const memberEmails = new Set(teamData.members.map((m) => m.email.toLowerCase()));
    for (const t of teams) {
      for (const m of t.members) {
        if (memberEmails.has(m.email.toLowerCase())) {
          return { success: false, error: `Member email "${m.email}" is already registered under team "${t.teamName}".` };
        }
      }
    }

    const lowerTrx = teamData.payment.trxId.trim().toUpperCase();
    if (teams.some((t) => t.payment.method === teamData.payment.method && t.payment.trxId.toUpperCase() === lowerTrx)) {
      return { success: false, error: `Transaction ID "${teamData.payment.trxId}" has already been submitted for ${teamData.payment.method}.` };
    }

    const newTeamId = `team-${Date.now()}`;
    const newTeam: Team = {
      ...teamData,
      id: newTeamId,
      status: 'pending',
      isFinalist: false,
      createdAt: new Date().toISOString(),
    };

    setTeams((prev) => [newTeam, ...prev]);
    addAuditLog('REGISTER_TEAM', 'team', newTeamId, {
      teamName: newTeam.teamName,
      membersCount: newTeam.members.length,
      method: newTeam.payment.method,
      trxId: newTeam.payment.trxId,
    });

    return { success: true, teamId: newTeamId };
  };

  const submitPaymentCorrection = (token: string, newSenderNo: string, newTrxId: string) => {
    const record = correctionTokens.find((t) => t.token === token && !t.usedAt);
    if (!record) {
      return { success: false, error: 'Invalid or expired correction link.' };
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return { success: false, error: 'This correction link has expired.' };
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === record.teamId) {
          return {
            ...t,
            status: 'pending',
            adminNote: undefined,
            payment: {
              ...t.payment,
              senderNo: newSenderNo,
              trxId: newTrxId,
            },
          };
        }
        return t;
      })
    );

    setCorrectionTokens((prev) =>
      prev.map((t) => (t.token === token ? { ...t, usedAt: new Date().toISOString() } : t))
    );

    addAuditLog('CORRECTION_SUBMITTED', 'team', record.teamId, { newSenderNo, newTrxId });
    return { success: true };
  };

  const approveTeam = (teamId: string) => {
    if (API_BASE_URL) {
      try {
        apiFetch<{ success: boolean; temporaryPassword?: string; email?: string; error?: string }>('/api/admin/teams/approve', {
          method: 'POST',
          body: JSON.stringify({ teamId }),
        }).then((payload) => {
          if (payload.success && payload.temporaryPassword) {
            const team = teams.find((t) => t.id === teamId);
            if (team) {
              setTeams((prev) => prev.map((t) => t.id === teamId ? {
                ...t,
                status: 'approved',
                reviewedBy: auth.user?.id || 'staff',
                reviewedAt: new Date().toISOString(),
                account: {
                  loginEmail: payload.email || team.members[0]?.email || '',
                  temporaryPassword: payload.temporaryPassword,
                  mustChangePassword: true,
                  credentialsSent: false,
                },
              } : t));
            }
          }
        }).catch(() => undefined);
      } catch {
        // fallback below
      }
    }

    const team = teams.find((t) => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };

    const leader = team.members.find((m) => m.isLeader) || team.members[0];
    const leaderEmail = leader.email;
    const tempPassword = `cou_${Math.random().toString(36).substring(2, 8)}!`;

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            status: 'approved',
            reviewedBy: auth.user?.id || 'staff',
            reviewedAt: new Date().toISOString(),
            account: {
              loginEmail: leaderEmail,
              temporaryPassword: tempPassword,
              mustChangePassword: true,
              credentialsSent: false,
            },
          };
        }
        return t;
      })
    );

    addAuditLog('APPROVE_TEAM', 'team', teamId, { leaderEmail });
    return { success: true, temporaryPassword: tempPassword, email: leaderEmail };
  };

  const rejectTeam = (teamId: string, reason: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            status: 'rejected',
            adminNote: reason,
            reviewedBy: auth.user?.id || 'staff',
            reviewedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    addAuditLog('REJECT_TEAM', 'team', teamId, { reason });
    return { success: true };
  };

  const requestCorrection = (teamId: string, reason: string) => {
    if (API_BASE_URL) {
      try {
        apiFetch<{ success: boolean; token?: string; error?: string }>('/api/admin/teams/correction', {
          method: 'POST',
          body: JSON.stringify({ teamId, reason }),
        }).then((payload) => {
          if (payload.success && payload.token) {
            setCorrectionTokens((prev) => [{ token: payload.token!, teamId, expiresAt: new Date(Date.now() + (settings.correction_link_days || 3) * 86400000).toISOString(), reason }, ...prev]);
          }
        }).catch(() => undefined);
      } catch {
        // fallback below
      }
    }

    const token = `token-${teamId}-${Date.now()}`;
    const expiresDays = settings.correction_link_days || 3;
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 3600 * 1000).toISOString();

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            status: 'payment_correction',
            adminNote: reason,
            reviewedBy: auth.user?.id || 'staff',
            reviewedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    setCorrectionTokens((prev) => [
      { token, teamId, expiresAt, reason },
      ...prev,
    ]);

    addAuditLog('REQUEST_CORRECTION', 'team', teamId, { reason, token });
    return { success: true, token };
  };

  const regenerateTeamPassword = (teamId: string) => {
    const newPass = `cou_${Math.random().toString(36).substring(2, 8)}!`;
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId && t.account) {
          return {
            ...t,
            account: {
              ...t.account,
              temporaryPassword: newPass,
              mustChangePassword: true,
              credentialsSent: false,
            },
          };
        }
        return t;
      })
    );
    addAuditLog('REGENERATE_PASSWORD', 'team', teamId, {});
    return { success: true, newPassword: newPass };
  };

  const markCredentialsSent = (teamId: string, sent: boolean) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId && t.account) {
          return {
            ...t,
            account: {
              ...t.account,
              credentialsSent: sent,
              credentialsSentAt: sent ? new Date().toISOString() : undefined,
            },
          };
        }
        return t;
      })
    );
    addAuditLog('MARK_CREDENTIALS_SENT', 'team', teamId, { sent });
  };

  const uploadDocument = (doc: Omit<ScenarioDocument, 'id' | 'createdAt'>) => {
    const newDoc: ScenarioDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDocuments((prev) => [...prev, newDoc]);
    addAuditLog('UPLOAD_DOCUMENT', 'document', newDoc.id, { title: newDoc.title });
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    addAuditLog('DELETE_DOCUMENT', 'document', id, {});
  };

  const toggleDocumentVisibility = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, visible: !d.visible } : d))
    );
  };

  const saveSubmission = (abstract: string, repoUrl: string, videoUrl: string) => {
    if (!auth.user?.teamId) return { success: false, error: 'Not logged in as a team' };
    const teamId = auth.user.teamId;
    const team = teams.find((t) => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };

    // Check deadline override or global deadline
    const deadline = team.deadlineOverride || settings.online_end_at;
    if (deadline && new Date().getTime() > new Date(deadline).getTime()) {
      return { success: false, error: 'Online submission window has closed.' };
    }

    if (abstract.length > 350) {
      return { success: false, error: 'Abstract exceeds 350 characters limit.' };
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const subId = t.submission?.id || `sub-${Date.now()}`;
          return {
            ...t,
            submission: {
              id: subId,
              teamId,
              abstract,
              repoUrl,
              videoUrl,
              createdAt: t.submission?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              snapshot: t.submission?.snapshot,
            },
          };
        }
        return t;
      })
    );

    addAuditLog('SUBMIT_ONLINE_WORK', 'submission', teamId, { repoUrl });
    return { success: true };
  };

  const triggerSnapshot = (teamId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId && t.submission) {
          const sha = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          return {
            ...t,
            submission: {
              ...t.submission,
              snapshot: {
                id: `snap-${Date.now()}`,
                submissionId: t.submission.id,
                commitSha: sha,
                branch: 'main',
                capturedAt: new Date().toISOString(),
                zipKey: `snapshots/${teamId}/${sha}.zip`,
                zipSizeBytes: Math.floor(Math.random() * 15000000) + 2000000,
                status: 'ok',
                attempts: 1,
              },
            },
          };
        }
        return t;
      })
    );
    addAuditLog('TRIGGER_SNAPSHOT', 'snapshot', teamId, {});
    return { success: true };
  };

  const submitReview = (teamId: string, score: number, comment: string, isFinal: boolean) => {
    if (settings.judging_locked) {
      return { success: false, error: 'Judging is locked by the admin. No further edits are permitted.' };
    }
    const judgeId = auth.user?.id || 'staff-judge-1';
    const judgeName = auth.user?.name || 'Judge';

    const team = teams.find((t) => t.id === teamId);
    if (!team || !team.submission) {
      return { success: false, error: 'Team submission not found.' };
    }

    setReviews((prev) => {
      const filtered = prev.filter((r) => !(r.teamId === teamId && r.judgeId === judgeId));
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        submissionId: team.submission!.id,
        teamId,
        judgeId,
        judgeName,
        score,
        comment,
        isFinal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [...filtered, newReview];
    });

    addAuditLog('SUBMIT_REVIEW', 'review', teamId, { score, isFinal, judgeId });
    return { success: true };
  };

  const submitOnsiteScore = (teamId: string, score: number, comment?: string, isFinal = true) => {
    const judgeId = auth.user?.id || 'staff-judge-1';
    const judgeName = auth.user?.name || 'Judge';

    setOnsiteScores((prev) => {
      const filtered = prev.filter((s) => !(s.teamId === teamId && s.judgeId === judgeId));
      const newScore: OnsiteScore = {
        id: `onsite-${Date.now()}`,
        teamId,
        judgeId,
        judgeName,
        score,
        comment,
        isFinal,
        updatedAt: new Date().toISOString(),
      };
      return [...filtered, newScore];
    });

    addAuditLog('SUBMIT_ONSITE_SCORE', 'onsite_score', teamId, { score, isFinal });
    return { success: true };
  };

  const lockJudging = (lock: boolean) => {
    updateSettings({ judging_locked: lock });
  };

  const releaseResults = (release: boolean) => {
    updateSettings({ results_released: release });
  };

  const createStaff = (name: string, email: string, role: 'moderator' | 'judge') => {
    const cleanEmail = email.trim().toLowerCase();
    if (staff.some((s) => s.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Staff with this email already exists' };
    }

    const tempPassword = `${role}_${Math.random().toString(36).substring(2, 7)}!`;
    const newStaff: StaffAccount = {
      id: `staff-${Date.now()}`,
      name,
      email: cleanEmail,
      role,
      active: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      temporaryPassword: tempPassword,
    };

    setStaff((prev) => [...prev, newStaff]);
    addAuditLog('CREATE_STAFF', 'staff', newStaff.id, { role, email: cleanEmail });
    return { success: true, tempPassword };
  };

  const toggleStaffActive = (id: string) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const setFinalist = (teamId: string, isFinalist: boolean) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, isFinalist, finalistSetAt: isFinalist ? new Date().toISOString() : undefined }
          : t
      )
    );
    addAuditLog('SET_FINALIST', 'team', teamId, { isFinalist });
  };

  const suggestFinalists = (n = settings.finalist_count_n || 10) => {
    const teamsWithAvg = teams.map((team) => {
      const teamReviews = reviews.filter((r) => r.teamId === team.id && r.isFinal);
      const onlineAvg = calculateOnlineAverage(teamReviews);
      return { team, onlineAvg };
    });

    const suggestions = suggestTopNFinalists(teamsWithAvg, n);
    const topIds = new Set(suggestions.map((s) => s.teamId));

    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        isFinalist: topIds.has(t.id),
        finalistSetAt: topIds.has(t.id) ? new Date().toISOString() : undefined,
      }))
    );

    addAuditLog('SUGGEST_FINALISTS', 'finalists', 'auto', { count: n, topIds: Array.from(topIds) });
  };

  const checkinTeam = (teamId: string, membersPresent: number) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };
    if (!team.isFinalist) return { success: false, error: 'Only on-site finalist teams can check-in.' };

    const newCheckin: Checkin = {
      teamId,
      checkedInAt: new Date().toISOString(),
      checkedInBy: auth.user?.id || 'staff',
      membersPresent,
    };

    setCheckins((prev) => [...prev.filter((c) => c.teamId !== teamId), newCheckin]);
    addAuditLog('CHECKIN_TEAM', 'checkin', teamId, { membersPresent });
    return { success: true };
  };

  const computeFinalResults = () => {
    const finalists = teams.filter((t) => t.isFinalist && t.status === 'approved');

    const computed: FinalResult[] = finalists.map((team) => {
      const teamOnline = reviews.filter((r) => r.teamId === team.id && r.isFinal);
      const onlineAvg = calculateOnlineAverage(teamOnline);

      const teamOnsite = onsiteScores.filter((s) => s.teamId === team.id && s.isFinal);
      const onsiteAvg = calculateOnsiteAverage(teamOnsite);

      const finalScore = calculateFinalScore(
        onlineAvg,
        onsiteAvg,
        settings.online_weight,
        settings.onsite_weight
      );

      return {
        teamId: team.id,
        teamName: team.teamName,
        university: team.university,
        onlineAvg,
        onsiteAvg,
        finalScore,
        rank: 0,
        published: false,
      };
    });

    // Sort desc by final score
    computed.sort((a, b) => b.finalScore - a.finalScore);
    computed.forEach((item, index) => {
      item.rank = index + 1;
      if (item.rank === 1) item.prizeLabel = 'Champion 🏆';
      else if (item.rank === 2) item.prizeLabel = '1st Runner-Up 🥈';
      else if (item.rank === 3) item.prizeLabel = '2nd Runner-Up 🥉';
      else if (item.rank <= 5) item.prizeLabel = 'Top 5 Finalist ⭐';
      else item.prizeLabel = 'Finalist Participant';
    });

    setFinalResults(computed);
    addAuditLog('COMPUTE_FINAL_RESULTS', 'results', 'offline', { count: computed.length });
  };

  const publishFinalResults = (publish: boolean) => {
    setFinalResults((prev) => prev.map((r) => ({ ...r, published: publish })));
    addAuditLog('PUBLISH_FINAL_RESULTS', 'results', 'publish', { published: publish });
  };

  const setDeadlineOverride = (teamId: string, newEndAt: string, reason: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, deadlineOverride: newEndAt } : t))
    );
    addAuditLog('DEADLINE_OVERRIDE', 'team', teamId, { newEndAt, reason });
  };

  const purgeIdPhotos = () => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        members: t.members.map((m) => ({ ...m, idCardPhotoUrl: undefined, idCardFile: undefined })),
      }))
    );
    addAuditLog('PURGE_ID_PHOTOS', 'storage', 'r2', { retentionDays: settings.id_photo_retention_days });
  };

  const deleteStaff = (id: string) => {
    const target = staff.find((m) => m.id === id);
    if (!target || target.role === 'super_admin' || auth.user?.id === id) return;
    setStaff((prev) => prev.filter((m) => m.id !== id));
    setReviews((prev) => prev.filter((r) => r.judgeId !== id));
    setOnsiteScores((prev) => prev.filter((o) => o.judgeId !== id));
    addAuditLog('DELETE_STAFF', 'staff', id, { name: target.name, email: target.email, role: target.role });
  };

  const toggleTeamBan = (teamId: string) => {
    const wasBanned = bannedTeamIds.includes(teamId);
    setBannedTeamIds((prev) => (wasBanned ? prev.filter((x) => x !== teamId) : [...prev, teamId]));
    addAuditLog(wasBanned ? 'UNBAN_TEAM' : 'BAN_TEAM', 'team', teamId, {});
  };

  const deleteTeam = (teamId: string) => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setReviews((prev) => prev.filter((r) => r.teamId !== teamId));
    setOnsiteScores((prev) => prev.filter((o) => o.teamId !== teamId));
    setCheckins((prev) => prev.filter((c) => c.teamId !== teamId));
    setFinalResults((prev) => prev.filter((f) => f.teamId !== teamId));
    setCorrectionTokens((prev) => prev.filter((k) => k.teamId !== teamId));
    setBannedTeamIds((prev) => prev.filter((x) => x !== teamId));
    addAuditLog('DELETE_TEAM', 'team', teamId, { teamName: target.teamName });
  };

  const resetAllDataToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setTeams([]);
    setBannedTeamIds([]);
    setStaff(INITIAL_STAFF);
    setDocuments(INITIAL_DOCUMENTS);
    setReviews([]);
    setOnsiteScores([]);
    setCheckins([]);
    setFinalResults([]);
    setCorrectionTokens([]);
    setAuth({ role: 'visitor', user: null });
  };

  return (
    <AppContext.Provider
      value={{
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
        correctionTokens,
        auth,
        loginTeam,
        loginStaff,
        logout,
        changePassword,
        switchRoleQuick,
        registerTeam,
        submitPaymentCorrection,
        approveTeam,
        rejectTeam,
        requestCorrection,
        regenerateTeamPassword,
        markCredentialsSent,
        uploadDocument,
        deleteDocument,
        toggleDocumentVisibility,
        saveSubmission,
        triggerSnapshot,
        submitReview,
        submitOnsiteScore,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};