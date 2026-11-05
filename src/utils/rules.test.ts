import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOnlineAverage,
  calculateFinalScore,
  validateAbstract,
  validateTeamSize,
  suggestTopNFinalists,
  generateApprovalEmail
} from './rules';
import { Review, Team } from '../types';

test('calculateOnlineAverage handles finalized reviews correctly', () => {
  const reviews: Review[] = [
    { id: '1', submissionId: 's1', teamId: 't1', judgeId: 'j1', score: 90, comment: 'Great', isFinal: true, createdAt: '', updatedAt: '' },
    { id: '2', submissionId: 's1', teamId: 't1', judgeId: 'j2', score: 85, comment: 'Good', isFinal: true, createdAt: '', updatedAt: '' },
    { id: '3', submissionId: 's1', teamId: 't1', judgeId: 'j3', score: 70, comment: 'Draft', isFinal: false, createdAt: '', updatedAt: '' },
  ];
  const avg = calculateOnlineAverage(reviews);
  assert.equal(avg, 87.5);
});

test('calculateOnlineAverage returns 0 when no finalized reviews', () => {
  const reviews: Review[] = [
    { id: '1', submissionId: 's1', teamId: 't1', judgeId: 'j1', score: 90, comment: 'Draft', isFinal: false, createdAt: '', updatedAt: '' }
  ];
  assert.equal(calculateOnlineAverage(reviews), 0);
});

test('calculateFinalScore weights 50/50 correctly', () => {
  const score = calculateFinalScore(80, 90, 50, 50);
  assert.equal(score, 85);
});

test('calculateFinalScore handles custom weights', () => {
  const score = calculateFinalScore(100, 80, 70, 30);
  assert.equal(score, 94);
});

test('validateAbstract enforces max 350 chars', () => {
  const shortValid = validateAbstract('An innovative edge-AI system for disaster response.');
  assert.equal(shortValid.valid, true);
  assert.equal(shortValid.length, 51);

  const empty = validateAbstract('');
  assert.equal(empty.valid, false);

  const longStr = 'a'.repeat(351);
  const tooLong = validateAbstract(longStr);
  assert.equal(tooLong.valid, false);
});

test('validateTeamSize enforces min and max bounds', () => {
  assert.equal(validateTeamSize(2, 3, 4).valid, false);
  assert.equal(validateTeamSize(3, 3, 4).valid, true);
  assert.equal(validateTeamSize(4, 3, 4).valid, true);
  assert.equal(validateTeamSize(5, 3, 4).valid, false);
});

test('suggestTopNFinalists picks top scorers correctly', () => {
  const makeTeam = (id: string, name: string): Team => ({
    id,
    teamName: name,
    university: 'Comilla University',
    status: 'approved',
    isFinalist: false,
    createdAt: new Date().toISOString(),
    members: [],
    payment: { method: 'bkash', senderNo: '01700000000', trxId: id, amount: 1000 }
  });

  const teamsWithScores = [
    { team: makeTeam('t1', 'Team A'), onlineAvg: 75 },
    { team: makeTeam('t2', 'Team B'), onlineAvg: 95 },
    { team: makeTeam('t3', 'Team C'), onlineAvg: 88 },
  ];

  const top2 = suggestTopNFinalists(teamsWithScores, 2);
  assert.equal(top2.length, 2);
  assert.equal(top2[0].teamId, 't2');
  assert.equal(top2[0].rank, 1);
  assert.equal(top2[1].teamId, 't3');
  assert.equal(top2[1].rank, 2);
});

test('generateApprovalEmail formats login credentials', () => {
  const email = generateApprovalEmail('Rahim', 'NeuroByte', 'http://localhost:3000', 'rahim@cou.ac.bd', 'secret123', 'support@hackathon.cou.ac.bd', '+8801700');
  assert.ok(email.body.includes('Rahim'));
  assert.ok(email.body.includes('NeuroByte'));
  assert.ok(email.body.includes('secret123'));
  assert.ok(email.body.includes('/login'));
});
