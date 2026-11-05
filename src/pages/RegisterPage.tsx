import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Mail,
  Phone,
  Shield,
  Clock,
  Sparkles,
  ArrowLeft,
  FileCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeamMember, PaymentMethod } from '../types';
import { validateTeamSize, formatDhakaTime } from '../utils/rules';
import confetti from 'canvas-confetti';

export const RegisterPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { settings, registerTeam } = useApp();

  // Registration window check
  const now = Date.now();
  const isOpen =
    (!settings.registration_open_at || now >= new Date(settings.registration_open_at).getTime()) &&
    (!settings.registration_close_at || now <= new Date(settings.registration_close_at).getTime());

  // Form State
  const [teamName, setTeamName] = useState('');
  const [university, setUniversity] = useState('');
  const [description, setDescription] = useState('');

  // Initial 3 members (Leader + 2 members) to meet min_members=3 default
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'm-1',
      isLeader: true,
      fullName: '',
      studentId: '',
      email: '',
      phone: '',
      department: '',
      year: '3rd Year',
    },
    {
      id: 'm-2',
      isLeader: false,
      fullName: '',
      studentId: '',
      email: '',
      phone: '',
      department: '',
      year: '3rd Year',
    },
    {
      id: 'm-3',
      isLeader: false,
      fullName: '',
      studentId: '',
      email: '',
      phone: '',
      department: '',
      year: '3rd Year',
    },
  ]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [senderNo, setSenderNo] = useState('');
  const [trxId, setTrxId] = useState('');

  // UI status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTeamId, setSuccessTeamId] = useState<string | null>(null);

  const minMembers = settings.min_members || 3;
  const maxMembers = settings.max_members || 4;

  const handleAddMember = () => {
    if (members.length >= maxMembers) return;
    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      isLeader: false,
      fullName: '',
      studentId: '',
      email: '',
      phone: '',
      department: '',
      year: '3rd Year',
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (idx: number) => {
    if (idx === 0) return; // Leader cannot be removed
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx: number, field: keyof TeamMember, val: string) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );
  };

  const handlePhotoUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(`File "${file.name}" is over 2 MB. Please select a smaller photo.`);
      return;
    }

    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPG, PNG or WebP images are allowed for student ID cards.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setMembers((prev) =>
        prev.map((m, i) =>
          i === idx ? { ...m, idCardPhotoUrl: result, idCardFile: file.name } : m
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Enforce team size limits
    const sizeCheck = validateTeamSize(members.length, minMembers, maxMembers);
    if (!sizeCheck.valid) {
      setErrorMsg(sizeCheck.error || 'Invalid team size');
      return;
    }

    // Check member details
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.fullName.trim() || !m.studentId.trim() || !m.email.trim() || !m.phone.trim() || !m.department.trim()) {
        setErrorMsg(`Please fill all required fields for Member ${i + 1} (${m.isLeader ? 'Leader' : 'Member'}).`);
        return;
      }
    }

    // Check payment fields
    if (!senderNo.trim() || !trxId.trim()) {
      setErrorMsg('Payment sender number and transaction ID are mandatory.');
      return;
    }

    setIsSubmitting(true);

    const result = registerTeam({
      teamName: teamName.trim(),
      university: university.trim(),
      description: description.trim(),
      members,
      payment: {
        method: paymentMethod,
        senderNo: senderNo.trim(),
        trxId: trxId.trim().toUpperCase(),
        amount: settings.registration_fee_bdt,
      },
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed');
    } else {
      setSuccessTeamId(result.teamId || 'registered');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  if (!isOpen) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
        <div className="glass-panel p-8 sm:p-12 rounded-[20px] max-w-lg text-center border border-amber-500/40 shadow-2xl">
          <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="font-heading font-extrabold text-2xl text-white mb-2">
            Registration Currently Closed
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            Registration window: {formatDhakaTime(settings.registration_open_at)} to {formatDhakaTime(settings.registration_close_at)}.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Registration Success State
  if (successTeamId) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
        <div className="glass-panel p-8 sm:p-12 rounded-[20px] max-w-2xl text-center border border-emerald-500/40 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="font-heading font-extrabold text-3xl text-white">
            Registration Received!
          </h2>

          <div className="p-4 rounded-[12px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm leading-relaxed">
            "Registration received, an admin will verify your payment and contact you."
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Our organizing committee will verify your payment for Transaction ID{' '}
            <strong className="text-amber-400">{trxId.toUpperCase()}</strong> against official statements.
            Once approved, login credentials will be emailed directly to your team leader (
            <span className="text-cyan-300">{members[0].email}</span>).
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/teams')}
              className="w-full sm:w-auto px-6 py-3 rounded-[10px] bg-[#6d3df5] hover:bg-[#5b2bd5] text-white font-bold text-sm shadow-lg"
            >
              Check Registered Teams
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-3 rounded-[10px] bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0618] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Heading */}
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            Register your team
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            AI Hackathon 2026 • Engineering Faculty, Comilla University
          </p>
        </div>

        {/* Payment Instruction Box (fee and numbers come from settings) */}
        <div className="glass-panel p-6 sm:p-8 rounded-[16px] border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-950/30 to-[#0a0618] shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">
                Payment Instructions (Manual Verification)
              </h2>
              <div className="text-xs text-amber-200">
                Registration Fee: <strong className="text-amber-400 text-sm">{settings.registration_fee_bdt} BDT</strong> per team
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-3.5 rounded-[12px] bg-pink-950/30 border border-pink-500/30">
              <div className="font-bold text-pink-300 text-sm mb-1">bKash Personal</div>
              <div className="font-mono text-white text-sm font-semibold">{settings.bkash_number || '01712-345678'}</div>
              <div className="text-[11px] text-pink-200/80 mt-1">Use 'Send Money' or Payment</div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-orange-950/30 border border-orange-500/30">
              <div className="font-bold text-orange-300 text-sm mb-1">Nagad Personal</div>
              <div className="font-mono text-white text-sm font-semibold">{settings.nagad_number || '01812-345678'}</div>
              <div className="text-[11px] text-orange-200/80 mt-1">Use 'Send Money'</div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-purple-950/30 border border-purple-500/30">
              <div className="font-bold text-purple-300 text-sm mb-1">Rocket Personal</div>
              <div className="font-mono text-white text-sm font-semibold">{settings.rocket_number || '01912-345678-9'}</div>
              <div className="text-[11px] text-purple-200/80 mt-1">Include 12-digit number</div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-300 leading-relaxed">
            * Please complete the transaction first. Note down the sender phone number and the exact Transaction ID (TrxID). You will input them at the bottom of this form.
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-[12px] bg-red-950/60 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Registration Validation Error</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Team Information */}
          <div className="glass-panel p-6 sm:p-8 rounded-[16px] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 pb-2 border-b border-white/10">
              <Users className="w-5 h-5" />
              <h3 className="font-heading font-bold text-lg text-white">Team Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <span className="text-[10px] text-slate-400">Unique, case-insensitive</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  University / Institute <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project / Team Idea (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Section 2: Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">
                  Team Members ({members.length}/{maxMembers})
                </h3>
                <p className="text-xs text-slate-400">
                  Required: {minMembers} to {maxMembers} members. Member 1 is the designated Leader.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMember}
                disabled={members.length >= maxMembers}
                className={`px-4 py-2 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all ${
                  members.length >= maxMembers
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-[#6d3df5] hover:bg-[#5b2bd5] text-white shadow-md active:scale-95'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Member Cards */}
            <div className="space-y-4">
              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className="glass-panel p-6 rounded-[16px] border border-white/10 relative transition-all duration-300 hover:border-purple-500/40"
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-900/60 text-purple-200 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-heading font-bold text-sm text-white">
                        {idx === 0 ? 'Member 1: Team Leader (Primary Contact)' : `Member ${idx + 1}`}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Leader Account
                        </span>
                      )}
                    </div>

                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded bg-red-950/30 hover:bg-red-950/50"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={member.fullName}
                        onChange={(e) => handleMemberChange(idx, 'fullName', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white/5 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Student ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={member.studentId}
                        onChange={(e) => handleMemberChange(idx, 'studentId', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white/5 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={member.email}
                        onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white/5 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={member.phone}
                        onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white/5 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Department <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={member.department}
                        onChange={(e) => handleMemberChange(idx, 'department', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white/5 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Academic Year</label>
                      <select
                        value={member.year}
                        onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-[#120a28] border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Masters / Graduate">Masters / Graduate</option>
                      </select>
                    </div>
                  </div>

                  {/* ID Card Photo Upload & Preview */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-3.5 py-2 rounded-[8px] bg-white/10 hover:bg-white/15 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 border border-cyan-400/30 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Student ID Photo</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(idx, e)}
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">
                        JPG, PNG, WebP up to 2 MB
                      </span>
                    </div>

                    {member.idCardPhotoUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={member.idCardPhotoUrl}
                          alt={`ID Card preview ${idx + 1}`}
                          className="w-12 h-8 object-cover rounded border border-cyan-400/50 shadow"
                        />
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ID Attached
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Payment Verification */}
          <div className="glass-panel p-6 sm:p-8 rounded-[16px] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-white/10">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-heading font-bold text-lg text-white">Payment Verification</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Method <span className="text-red-400">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-2.5 rounded-[10px] bg-[#120a28] border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sender Mobile Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={senderNo}
                  onChange={(e) => setSenderNo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transaction ID (TrxID) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[10px] bg-white/5 border border-white/15 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || members.length < minMembers}
              className={`w-full py-4 rounded-[10px] font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
                members.length < minMembers
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-[#ffb020] hover:bg-[#ffa000] text-slate-950 shadow-amber-500/25 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <span>Registering your team...</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>Submit Team Registration ({settings.registration_fee_bdt} BDT)</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              By submitting, your team agrees to the AI Hackathon 2026 Code of Conduct and verification policies.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};