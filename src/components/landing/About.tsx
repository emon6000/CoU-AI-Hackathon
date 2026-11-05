import React from 'react';
import { Zap, Award, CheckCircle2, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';

type Prize = { amount_bdt: number; title?: string };

const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th', '5th'][n] ?? `${n + 1}th`;
const fmt = (n: number) => n.toLocaleString('en-US');

export const About: React.FC = () => {
  const { settings } = useApp();

  // Admin-controlled: 3 to 5 places. Add `prizes?: Prize[]` to your settings type, then this cast can go.
  const prizes = ((settings as unknown as { prizes?: Prize[] }).prizes ?? []).slice(0, 5);
  const totalPrize = prizes.length ? prizes.reduce((sum, p) => sum + p.amount_bdt, 0) : 25000;

  return (
    <section id="about" className="py-20 bg-[#f6f4ff] text-[#1b1236] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6d3df5]/10 text-[#6d3df5] text-xs font-bold uppercase tracking-wider mb-3">
            Comilla University
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#1b1236] mb-4">
            AI Hackathon 2026
          </h2>
          <p className="text-base sm:text-lg text-[#1b1236]/80 leading-relaxed">
            Organized by the Faculty of Engineering, Comilla University, with the Departments of CSE and ICT.
            Build real-world machine learning applications across two phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Phase 1 */}
          <div className="bg-white p-8 rounded-[16px] border border-[#e0dbf5] shadow-xl shadow-purple-900/5 hover:-translate-y-1.5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#6d3df5]/10 flex items-center justify-center text-[#6d3df5] mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3 text-[#1b1236]">Phase 1: Online Round</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Registered and verified teams receive curated problem statements. Build your ML model, push to GitHub, record your video, and submit before the deadline.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#6d3df5]" />Automated Git commit snapshot at deadline</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#6d3df5]" />Blind multi-judge peer evaluation</li>
            </ul>
          </div>

          {/* Phase 2 */}
          <div className="bg-white p-8 rounded-[16px] border border-[#e0dbf5] shadow-xl shadow-purple-900/5 hover:-translate-y-1.5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#22d3ee]/20 flex items-center justify-center text-cyan-600 mb-6">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3 text-[#1b1236]">Phase 2: Offline Grand Finale</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Top finalist teams advance to the Faculty of Engineering at Comilla University for live prototyping and on-site defense.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600" />Live on-site jury scoring &amp; ranking</li>
            </ul>
          </div>

          {/* Prizes (admin-driven) */}
          <div className="bg-white p-8 rounded-[16px] border border-[#e0dbf5] shadow-xl shadow-purple-900/5 hover:-translate-y-1.5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#ffb020]/20 flex items-center justify-center text-amber-600 mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3 text-[#1b1236]">Prizes</h3>
            {prizes.length > 0 ? (
              <ul className="text-sm space-y-2 text-slate-700 font-medium">
                {prizes.map((p, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-[#e0dbf5] last:border-0 pb-2 last:pb-0">
                    <span>{p.title || `${ordinal(i)} Place`}</span>
                    <span className="font-bold text-amber-600">{fmt(p.amount_bdt)} BDT</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">
                Full prize details will be announced soon. Stay tuned.
              </p>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="bg-gradient-to-r from-[#1b1236] to-[#2b1480] text-white rounded-[20px] p-8 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-5xl font-extrabold font-heading text-cyan-400">
                {settings.registration_fee_bdt ?? 1000} <span className="text-lg text-white font-normal">BDT</span>
              </div>
              <div className="text-xs sm:text-sm text-purple-200 mt-1">Registration Fee / Team</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-5xl font-extrabold font-heading text-amber-400">
                {settings.min_members} - {settings.max_members}
              </div>
              <div className="text-xs sm:text-sm text-purple-200 mt-1">Team Size (Members)</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-5xl font-extrabold font-heading text-white">
                {fmt(totalPrize)} <span className="text-lg font-normal">BDT</span>
              </div>
              <div className="text-xs sm:text-sm text-purple-200 mt-1">Total Prize Pool</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-5xl font-extrabold font-heading text-emerald-400">
                {settings.finalist_count_n}
              </div>
              <div className="text-xs sm:text-sm text-purple-200 mt-1">On-Site Finalist Teams</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};