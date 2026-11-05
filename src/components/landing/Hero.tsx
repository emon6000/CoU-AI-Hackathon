import { ArrowRight, Calendar, MapPin, Sparkles, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NeuralCanvas } from '../common/NeuralCanvas';

// Event logo is served from the public folder and used in the main landing hero and brand sections.
const EVENT_LOGO = '/event-logo-horizontal.png';
const GIGABYTE_LOGO = '/sponsors/Gigabyte_aorus_logo.png';
const ITPALACE_LOGO = '/sponsors/ITP-2.png';

export const Hero: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { settings, teams, bannedTeamIds } = useApp();
  const [logoOk, setLogoOk] = useState(true);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activePhaseLabel, setActivePhaseLabel] = useState('Registration Closes In');
  const registeredCount = teams.filter(
    (t) => t.status !== 'rejected' && !bannedTeamIds.includes(t.id)
  ).length;

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const regClose = new Date(settings.registration_close_at || '2026-11-15T23:59:59Z').getTime();
      const onlineStart = new Date(settings.online_start_at || '2026-11-16T00:00:00Z').getTime();
      const onlineEnd = new Date(settings.online_end_at || '2026-11-18T23:59:59Z').getTime();

      let targetTime = regClose;
      let label = 'Registration Closes In';

      if (now < regClose) {
        targetTime = regClose;
      } else if (now < onlineStart) {
        targetTime = onlineStart;
        label = 'Online Round Begins In';
      } else if (now < onlineEnd) {
        targetTime = onlineEnd;
        label = 'Online Round Submission Window Closes In';
      } else {
        label = 'Offline Grand Finale';
        targetTime = new Date(settings.phase2_date || '2026-11-25T09:00:00Z').getTime();
      }

      setActivePhaseLabel(label);
      const diff = Math.max(0, targetTime - now);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  return (
    <section className="relative min-h-[calc(100vh-72px)] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0a0618] via-[#2b1480]/90 to-[#5a2fd0]/85 text-white pt-3 pb-0">
      <NeuralCanvas className="opacity-80" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#22d3ee]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-48 w-96 h-96 bg-[#ffb020]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center z-10">
        {/* LEFT: presenter, title, powered by, info, CTAs */}
        <div className="text-center lg:text-left">
          {/* Gigabyte PRESENTS */}
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
            <div className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-white/20">
              <img
                src={GIGABYTE_LOGO}
                alt="Gigabyte Aorus"
                className="h-7 sm:h-9 w-auto object-contain"
              />
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-slate-200">
              PRESENTS
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-heading font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.02] mb-5 text-white"
            style={{ textShadow: '0 0 18px rgba(255,176,32,0.55), 0 0 42px rgba(34,211,238,0.35)' }}
          >
            CoU AI Hackathon
            <br />
            2026
          </h1>

          {/* Powered by IT Palace */}
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-slate-300">
              POWERED BY
            </span>
            <div className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-white/20">
              <img
                src={ITPALACE_LOGO}
                alt="IT Palace"
                className="h-6 sm:h-8 w-auto object-contain"
              />
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-200/90 max-w-xl mx-auto lg:mx-0 mb-4 leading-relaxed">
            A 2-phase hackathon for builders of intelligent systems. Compete online, then take the
            stage at the offline grand finale.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-cyan-200">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nov 2026</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-amber-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Faculty of Engineering, Comilla University</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-[10px] font-bold text-base text-slate-950 bg-[#ffb020] hover:bg-[#ffa000] active:scale-[0.98] shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2.5 min-h-[48px]"
            >
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>Register your team</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/teams')}
              className="w-full sm:w-auto px-8 py-4 rounded-[10px] font-bold text-base text-white bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/30 backdrop-blur-md transition-all flex items-center justify-center gap-2.5 min-h-[48px]"
            >
              <Users className="w-5 h-5 text-cyan-300" />
              <span>View registered teams ({registeredCount})</span>
            </button>
          </div>
        </div>

        {/* RIGHT: event logo + countdown */}
        <div className="flex flex-col items-center gap-6">
          {logoOk && (
            <img
              src={EVENT_LOGO}
              alt="CoU AI Hackathon 2026 – Faculty of Engineering, Comilla University"
              onError={() => setLogoOk(false)}
              className="w-40 sm:w-52 lg:w-64 h-auto object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]"
            />
          )}

          <div className="w-full max-w-md">
            <div className="text-xs uppercase tracking-widest text-cyan-300 font-bold mb-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              {activePhaseLabel}
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { val: timeLeft.days, label: 'DAYS' },
                { val: timeLeft.hours, label: 'HOURS' },
                { val: timeLeft.minutes, label: 'MINS' },
                { val: timeLeft.seconds, label: 'SECS' },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="glass-panel p-3 rounded-[16px] text-center border border-white/20 shadow-2xl hover:border-cyan-400/50 transition-colors"
                >
                  <div className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                    {String(unit.val).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold tracking-wider text-purple-200/90 mt-1">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Academic partners strip */}
      <div className="relative z-10 max-w-4xl mx-auto w-full px-4 pb-4">
        {/* <div className="pt-4 border-t border-white/15 text-center"> */}
        {/* <p className="text-xs uppercase tracking-widest text-slate-300/80 font-semibold mb-3">
            Academic Partners
          </p> */}
        <div className="relative z-10 max-w-4xl mx-auto w-full px-4 pb-4">
          <div className="pt-4 border-t border-white/15 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-300/80 font-semibold mb-3">
              Organized by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-bold text-slate-200">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Faculty of Engineering, Comilla University
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Dept. of CSE
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                Dept. of ICT
              </span>
            </div>
          </div>
        </div>
        {/* </div> */}
      </div>

      <div className="w-full overflow-hidden leading-none z-10">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 sm:h-20 md:h-24 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,58.7C672,43,768,21,864,21.3C960,21,1056,43,1152,53.3C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            fill="#f6f4ff"
          />
        </svg>
      </div>
    </section>
  );
};
