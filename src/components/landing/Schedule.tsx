import React from 'react';
import { Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDhakaTime } from '../../utils/rules';

export const Schedule: React.FC = () => {
  const { settings } = useApp();

  const steps = [
    {
      phase: 'Phase 1.1',
      title: 'Team Registration Window',
      description: 'Leaders register teams (3-4 members), upload student ID photos, and submit the bKash, Nagad or Rocket payment transaction ID.',
      time: `${formatDhakaTime(settings.registration_open_at)} — ${formatDhakaTime(settings.registration_close_at)}`,
      status: 'active',
    },
    {
      phase: 'Phase 1.2',
      title: 'Online Hackathon Hack Window',
      description: 'Approved teams log into the portal, download problem statements, build their solutions, and submit a public GitHub repo and demo video.',
      time: `${formatDhakaTime(settings.online_start_at)} — ${formatDhakaTime(settings.online_end_at)}`,
      status: 'upcoming',
    },
    {
      phase: 'Phase 1.3',
      title: 'Finalist Selection',
      description: 'Judges evaluate submissions blindly, and the top teams are selected for the on-site round.',
      time: 'After the online round closes',
      status: 'upcoming',
    },
    {
      phase: 'Phase 2',
      title: 'On-Site Grand Finale & Award Ceremony',
      description: 'Finalist teams come to Comilla University for the presentation defense, live jury scoring, and the award ceremony.',
      time: `${formatDhakaTime(settings.phase2_date)} • ${settings.phase2_venue || 'Faculty of Engineering, Comilla University'}`,
      status: 'upcoming',
    },
  ];

  return (
    <section id="schedule" className="py-20 bg-[#0a0618] text-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3 border border-cyan-500/20">
            Official Timeline
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Event Schedule & Milestones
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            All schedules are synchronized in UTC and displayed in local Bangladesh Standard Time (Asia/Dhaka).
          </p>
        </div>

        <div className="relative border-l border-purple-800/60 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-10">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group">
              {/* Dot badge */}
              <div
                className={`absolute -left-[35px] sm:-left-[51px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.status === 'active'
                    ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-500/30'
                    : 'bg-purple-900 border border-purple-500/40 text-purple-200'
                }`}
              >
                {idx + 1}
              </div>

              <div className="glass-panel p-6 rounded-[16px] border border-white/10 hover:border-cyan-400/40 transition-all hover:-translate-y-0.5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6d3df5]/30 text-purple-300 border border-purple-500/30">
                    {step.phase}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{step.time}</span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg sm:text-xl text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};