import React, { useState, useMemo } from 'react';
import { Search, Users, CheckCircle2, Clock, XCircle, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TeamsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { teams, settings, bannedTeamIds } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter teams visible to public (per setting show_pending_teams_public)
  const visibleTeams = useMemo(() => {
    return teams.filter((t) => {
      if (!settings.show_pending_teams_public && t.status !== 'approved') {
        return false;
      }
      // Never show rejected or banned teams in public list
      if (t.status === 'rejected' || bannedTeamIds.includes(t.id)) return false;

      // Filter by search
      const matchesSearch =
        t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.university.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filter by status tab
      if (statusFilter === 'approved') return t.status === 'approved';
      if (statusFilter === 'pending') return t.status === 'pending' || t.status === 'payment_correction';
      return true;
    });
  }, [teams, bannedTeamIds, settings.show_pending_teams_public, searchTerm, statusFilter]);

  const totalPages = Math.ceil(visibleTeams.length / pageSize) || 1;
  const paginatedTeams = visibleTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const registeredCount = teams.filter((t) => t.status !== 'rejected' && !bannedTeamIds.includes(t.id)).length;
  const approvedCount = teams.filter((t) => t.status === 'approved' && !bannedTeamIds.includes(t.id)).length;
  const pendingCount = teams.filter((t) => (t.status === 'pending' || t.status === 'payment_correction') && !bannedTeamIds.includes(t.id)).length;

  return (
    <div className="min-h-screen bg-[#0a0618] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Landing Page</span>
            </button>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              Registered Teams
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Public roster of confirmed and pending participating university teams.
            </p>
          </div>

          <button
            onClick={() => navigate('/register')}
            className="self-start sm:self-auto px-5 py-2.5 rounded-[10px] bg-[#ffb020] hover:bg-[#ffa000] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Register a new team</span>
          </button>
        </div>

        {/* Counts summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-[14px] border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Enrolled</div>
              <div className="font-heading font-bold text-xl text-white">{registeredCount}</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-[14px] border border-emerald-500/30 bg-emerald-950/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-300">Confirmed & Approved</div>
              <div className="font-heading font-bold text-xl text-white">{approvedCount}</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-[14px] border border-amber-500/30 bg-amber-950/10 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-amber-300">Under Payment Review</div>
              <div className="font-heading font-bold text-xl text-white">{pendingCount}</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel p-4 rounded-[16px] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or university"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-[10px] border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-colors min-h-[36px] ${
                statusFilter === 'all'
                  ? 'bg-[#6d3df5] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({registeredCount})
            </button>
            <button
              onClick={() => { setStatusFilter('approved'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-colors min-h-[36px] ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-colors min-h-[36px] ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>
        </div>

        {/* Teams Table (Horizontally scrollable container with sticky header) */}
        <div className="glass-panel rounded-[16px] border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-300 text-xs font-heading font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">#</th>
                  <th className="py-4 px-6">Team Name</th>
                  <th className="py-4 px-6">University / Institute</th>
                  <th className="py-4 px-6">Members Count</th>
                  <th className="py-4 px-6 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {paginatedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No matching teams found.
                    </td>
                  </tr>
                ) : (
                  paginatedTeams.map((team, idx) => (
                    <tr
                      key={team.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-heading font-bold text-white flex items-center gap-2">
                          <span>{team.teamName}</span>
                          {team.isFinalist && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                              Finalist ⭐
                            </span>
                          )}
                        </div>
                        {team.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                            {team.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-300 font-medium">
                        {team.university}
                      </td>
                      <td className="py-4 px-6 text-xs text-purple-200">
                        {team.members.length} Members
                      </td>
                      <td className="py-4 px-6 text-right">
                        {team.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Privacy Note: As specified, never shows emails, phones, IDs or transaction IDs */}
          <div className="px-6 py-3 bg-black/30 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Privacy protected: Student contact info & payment receipts are restricted to organizers.
            </span>
            <span>
              Showing {paginatedTeams.length} of {visibleTeams.length} teams
            </span>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-[8px] text-xs font-bold transition-colors ${
                  currentPage === i + 1
                    ? 'bg-[#6d3df5] text-white'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};