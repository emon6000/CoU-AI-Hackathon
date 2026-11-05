/**
 * AI Hackathon Portal - Core Types and Models
 * Matches System Design and Build Specification v1.0
 */

export type UserRole = 'visitor' | 'team' | 'judge' | 'moderator' | 'super_admin';

export type TeamStatus = 'pending' | 'payment_correction' | 'approved' | 'rejected';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

export interface TeamMember {
  id: string;
  isLeader: boolean;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  idCardPhotoUrl?: string;
  idCardFile?: string; // base64 or object key
}

export interface PaymentInfo {
  method: PaymentMethod;
  senderNo: string;
  trxId: string;
  amount: number;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Team {
  id: string;
  teamName: string;
  university: string;
  description?: string;
  status: TeamStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isFinalist: boolean;
  finalistSetAt?: string;
  createdAt: string;
  members: TeamMember[];
  payment: PaymentInfo;
  account?: {
    loginEmail: string;
    temporaryPassword?: string;
    mustChangePassword: boolean;
    credentialsSent: boolean;
    credentialsSentAt?: string;
  };
  deadlineOverride?: string;
  submission?: TeamSubmission;
}

export interface TeamSubmission {
  id: string;
  teamId: string;
  abstract: string;
  repoUrl: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
  snapshot?: RepoSnapshot;
}

export type SnapshotStatus = 'pending' | 'ok' | 'failed' | 'repo_not_public' | 'too_large';

export interface RepoSnapshot {
  id: string;
  submissionId: string;
  commitSha: string;
  branch: string;
  capturedAt: string;
  zipKey?: string;
  zipSizeBytes?: number;
  status: SnapshotStatus;
  error?: string;
  attempts: number;
}

export interface Review {
  id: string;
  submissionId: string;
  teamId: string;
  judgeId: string;
  judgeName?: string;
  score: number;
  comment: string;
  isFinal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnsiteScore {
  id: string;
  teamId: string;
  judgeId: string;
  judgeName?: string;
  score: number;
  comment?: string;
  isFinal: boolean;
  updatedAt: string;
}

export interface Checkin {
  teamId: string;
  checkedInAt: string;
  checkedInBy: string;
  membersPresent: number;
}

export interface FinalResult {
  teamId: string;
  teamName: string;
  university: string;
  onlineAvg: number;
  onsiteAvg: number;
  finalScore: number;
  rank: number;
  prizeLabel?: string;
  published: boolean;
}

export type DocumentKind = 'guideline' | 'rulebook' | 'problem_statement' | 'other';

export interface ScenarioDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  fileKey: string;
  fileName: string;
  sizeBytes: number;
  visible: boolean;
  sortOrder: number;
  uploadedBy: string;
  createdAt: string;
  downloadUrl?: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'moderator' | 'judge';
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  temporaryPassword?: string;
}

export interface SystemSettings {
  event_name: string;
  event_venue: string;
  event_start_at: string;
  registration_open_at: string;
  registration_close_at: string;
  registration_fee_bdt: number;
  bkash_number: string;
  nagad_number: string;
  rocket_number: string;
  min_members: number;
  max_members: number;
  online_start_at: string;
  online_end_at: string;
  max_score: number;
  score_decimals: boolean;
  judging_locked: boolean;
  results_released: boolean;
  finalist_count_n: number;
  phase2_open: boolean;
  phase2_date: string;
  phase2_venue: string;
  online_weight: number;
  onsite_weight: number;
  show_pending_teams_public: boolean;
  anonymous_judges_to_teams: boolean;
  correction_link_days: number;
  id_photo_retention_days: number;
  support_email: string;
  support_phone: string;
}

export interface AuditLogEntry {
  id: string;
  actorType: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: Record<string, any>;
  createdAt: string;
}

export interface CorrectionToken {
  token: string;
  teamId: string;
  expiresAt: string;
  usedAt?: string;
  reason: string;
}
