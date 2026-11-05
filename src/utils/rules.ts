/**
 * AI Hackathon Portal - Pure Business Logic and Rule Helpers
 */

import { Team, Review, OnsiteScore, SystemSettings } from '../types';

export function calculateOnlineAverage(reviews: Review[]): number {
  const finalized = reviews.filter((r) => r.isFinal);
  if (finalized.length === 0) return 0;
  const sum = finalized.reduce((acc, r) => acc + Number(r.score), 0);
  return Number((sum / finalized.length).toFixed(2));
}

export function calculateOnsiteAverage(scores: OnsiteScore[]): number {
  const finalized = scores.filter((s) => s.isFinal);
  if (finalized.length === 0) return 0;
  const sum = finalized.reduce((acc, s) => acc + Number(s.score), 0);
  return Number((sum / finalized.length).toFixed(2));
}

export function calculateFinalScore(
  onlineAvg: number,
  onsiteAvg: number,
  onlineWeight = 50,
  onsiteWeight = 50
): number {
  const totalWeight = onlineWeight + onsiteWeight;
  if (totalWeight <= 0) return 0;
  const weighted = (onlineAvg * onlineWeight + onsiteAvg * onsiteWeight) / totalWeight;
  return Number(weighted.toFixed(2));
}

export function validateAbstract(abstract: string): { valid: boolean; length: number; error?: string } {
  const length = abstract.trim().length;
  if (length === 0) {
    return { valid: false, length: 0, error: 'Abstract is required' };
  }
  if (length > 350) {
    return { valid: false, length, error: `Abstract exceeds 350 characters (currently ${length})` };
  }
  return { valid: true, length };
}

export function validateTeamSize(
  memberCount: number,
  minMembers = 3,
  maxMembers = 4
): { valid: boolean; error?: string } {
  if (memberCount < minMembers) {
    return { valid: false, error: `Minimum ${minMembers} members required (currently ${memberCount})` };
  }
  if (memberCount > maxMembers) {
    return { valid: false, error: `Maximum ${maxMembers} members allowed (currently ${memberCount})` };
  }
  return { valid: true };
}

export function suggestTopNFinalists(
  teamsWithScores: Array<{ team: Team; onlineAvg: number }>,
  n = 20
): Array<{ teamId: string; rank: number; onlineAvg: number }> {
  // Sort descending by score
  const sorted = [...teamsWithScores]
    .filter((t) => t.team.status === 'approved')
    .sort((a, b) => b.onlineAvg - a.onlineAvg);

  return sorted.slice(0, n).map((item, index) => ({
    teamId: item.team.id,
    rank: index + 1,
    onlineAvg: item.onlineAvg,
  }));
}

export function generateApprovalEmail(
  leaderName: string,
  teamName: string,
  appUrl: string,
  loginEmail: string,
  tempPassword: string,
  supportEmail: string,
  supportPhone: string
): { subject: string; body: string } {
  const subject = `AI Hackathon - registration confirmed`;
  const body = `Dear ${leaderName}, your team "${teamName}" is confirmed. Log in at ${appUrl}/login
Email: ${loginEmail}
Temporary password: ${tempPassword} (you must change it at first login).

Helpline: ${supportEmail || 'support@hackathon.cou.ac.bd'}, ${supportPhone || '+880 1700 000000'}.
Organizing Committee, AI Hackathon, Comilla University`;

  return { subject, body };
}

export function generatePaymentCorrectionEmail(
  leaderName: string,
  teamName: string,
  reason: string,
  correctionLink: string,
  expiresDate: string
): { subject: string; body: string } {
  const subject = `AI Hackathon - payment correction needed`;
  const body = `Dear ${leaderName}, we could not verify the transaction ID for "${teamName}".
Reason: ${reason}

Update it here (valid until ${expiresDate}): ${correctionLink}

Organizing Committee, AI Hackathon, Comilla University`;

  return { subject, body };
}

export function generateRejectionEmail(
  leaderName: string,
  teamName: string,
  reason: string
): { subject: string; body: string } {
  const subject = `AI Hackathon - registration not approved`;
  const body = `Dear ${leaderName}, your registration for team "${teamName}" was not approved.
Reason: ${reason}

Thank you for your interest in AI Hackathon, Comilla University.`;

  return { subject, body };
}

export function generateFinalistEmail(
  leaderName: string,
  teamName: string,
  venue: string,
  date: string,
  appUrl: string
): { subject: string; body: string } {
  const subject = `AI Hackathon - you are a finalist`;
  const body = `Dear ${leaderName}, congratulations! Your team "${teamName}" has been selected as an on-site finalist.

Offline Round Venue: ${venue || 'Engineering Faculty Building, Comilla University'}
Date: ${date || '15 November 2026, 09:00 AM BST'}

Please visit your team dashboard at ${appUrl}/team to access the Phase 2 instructions and your check-in QR code.
Bring your student ID cards on the event day.

Organizing Committee, AI Hackathon, Comilla University`;

  return { subject, body };
}

export function formatDhakaTime(dateString?: string): string {
  if (!dateString) return 'TBA';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d) + ' (BST)';
  } catch {
    return dateString;
  }
}
