import React from 'react';
import { Cpu, Gamepad2, Presentation, Sparkles, Calendar, MapPin, Plus } from 'lucide-react';

/* ============================================================
   EDIT HERE: festival heading
   ============================================================ */
const FESTIVAL_TITLE = 'CoU AI Hackathon 2026';
const FESTIVAL_INTRO =
  'Alongside the AI Hackathon, join a tech seminar and a gaming tournament organized by the Faculty of Engineering, Comilla University.';

/* ============================================================
   EDIT HERE: featured event (big tile)
   ============================================================ */
const HACKATHON = {
  title: 'AI Hackathon 2026',
  tag: 'FLAGSHIP COMPETITION',
  status: 'Open for Registration', // EDIT: e.g. 'Registration Closed'
  description:
    'A 2-phase hackathon where teams build machine learning solutions to real-world problems: an online round, then an on-site grand finale.',
  date: 'Nov 16–18 (Online) • Nov 25 (On-site)', // EDIT
  prize: '25,000 BDT', // EDIT: total prize pool
};

/* ============================================================
   EDIT HERE: other events (small tiles)
   To add a new event later, copy one block and paste it into the list.
   Keep the `accent` values as they are (Tailwind needs full class names).
   ============================================================ */
type EventItem = {
  title: string;
  tag: string;
  description: string;
  date: string;
  venue: string;
  icon: React.ElementType;
  accent: { border: string; iconBox: string; icon: string; tag: string; meta: string };
};

const OTHER_EVENTS: EventItem[] = [
  {
    title: 'Tech Seminar',
    tag: 'Seminar',
    description: 'Talks and discussion on AI and technology.', // EDIT: speakers / topic
    date: 'Date to be announced', // EDIT
    venue: 'CoU', // EDIT
    icon: Presentation,
    accent: {
      border: 'hover:border-purple-400/50',
      iconBox: 'bg-purple-500/10',
      icon: 'text-purple-400',
      tag: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      meta: 'text-purple-300',
    },
  },
  {
    title: 'eFootball Tournament',
    tag: 'Gaming Arena',
    description: '1v1 knockout tournament with live matches on stage.', // EDIT: format / rewards
    date: 'Date to be announced', // EDIT
    venue: 'CoU', // EDIT
    icon: Gamepad2,
    accent: {
      border: 'hover:border-amber-400/50',
      iconBox: 'bg-amber-500/10',
      icon: 'text-amber-400',
      tag: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      meta: 'text-amber-300',
    },
  },
  // ADD NEW EVENTS HERE
];

export const Events: React.FC = () => {
  return (
    <section id="events" className="py-20 bg-[#0c071d] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/20">
            Festival & Side Events
          </div>
          <div className="mb-5 flex justify-center">
            <img
              src="/event-logo-horizontal.png"
              alt="AI Hackathon 2026"
              className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.25)]"
            />
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">{FESTIVAL_TITLE}</h2>
          <p className="text-slate-400 text-sm sm:text-base">{FESTIVAL_INTRO}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[220px]">
          {/* Featured: AI Hackathon */}
          <div className="md:col-span-2 md:row-span-2 glass-panel rounded-[20px] p-8 border border-purple-500/30 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/40 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/15 via-purple-600/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {HACKATHON.tag}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {HACKATHON.status}
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6d3df5] to-[#22d3ee] p-0.5 mb-6">
                <div className="w-full h-full bg-[#0a0618] rounded-[14px] flex items-center justify-center">
                  <Cpu className="w-7 h-7 text-cyan-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-white mb-3">{HACKATHON.title}</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">{HACKATHON.description}</p>
            </div>
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-medium">
                <Calendar className="w-4 h-4" />
                <span>{HACKATHON.date}</span>
              </div>
              <div className="text-slate-400">
                Total Prize Pool: <strong className="text-amber-400">{HACKATHON.prize}</strong>
              </div>
            </div>
          </div>

          {/* Other events */}
          {OTHER_EVENTS.map((ev) => {
            const Icon = ev.icon;
            return (
              <div
                key={ev.title}
                className={`md:col-span-1 glass-panel rounded-[20px] p-6 border border-white/10 ${ev.accent.border} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`p-2 rounded-xl ${ev.accent.iconBox}`}>
                      <Icon className={`w-5 h-5 ${ev.accent.icon}`} />
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ev.accent.tag}`}>{ev.tag}</span>
                  </div>
                  <h4 className="font-heading font-bold text-lg text-white mb-1">{ev.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{ev.description}</p>
                </div>
                <div className={`text-[11px] ${ev.accent.meta} space-y-1 mt-2`}>
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{ev.date}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{ev.venue}</div>
                </div>
              </div>
            );
          })}

          {/* More events placeholder (remove this block when the grid is full) */}
          <div className="md:col-span-2 rounded-[20px] p-6 border border-dashed border-white/15 flex flex-col items-center justify-center text-center text-slate-400">
            <Plus className="w-6 h-6 mb-2 text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">More events coming soon</p>
            <p className="text-xs mt-1">New competitions and activities will be announced here.</p>
          </div>
        </div>
      </div>
    </section>
  );
};