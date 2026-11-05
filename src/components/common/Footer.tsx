import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const EVENT_LOGO = '/event-logo-horizontal.png';
const SPONSOR_LOGOS = [
  { name: 'Gigabyte Aorus', label: 'Presented by', src: '/sponsors/Gigabyte_aorus_logo.png' },
  { name: 'IT Palace', label: 'Powered by', src: '/sponsors/ITP-2.png' },
];

// `navigate` is no longer used here but stays optional so existing <Footer navigate={...} /> calls keep working.
export const Footer: React.FC<{ navigate?: (route: string) => void }> = () => {
  const { settings } = useApp();
  const [logoOk, setLogoOk] = useState(true);

  return (
    <footer className="relative z-10 bg-[#070412] text-slate-400 border-t border-purple-900/40">
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-center lg:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            {logoOk ? (
              <img
                src={EVENT_LOGO}
                alt="AI Hackathon 2026"
                onError={() => setLogoOk(false)}
                className="h-14 w-auto object-contain"
              />
            ) : (
              <span className="font-heading font-extrabold text-white text-xl tracking-tight">AI Hackathon 2026</span>
            )}
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Organized by the Faculty of Engineering, Comilla University.
            </p>
          </div>

          {/* Contact */}
          <ul className="space-y-3 text-sm text-slate-300 flex flex-col items-center lg:items-start">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>{settings.event_venue || 'Faculty of Engineering, Comilla University'}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{settings.support_email || 'To be announced'}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.support_phone || 'To be announced'}</span>
            </li>
          </ul>

          {/* Sponsors */}
          <div className="flex items-center justify-center lg:justify-end gap-6">
            {SPONSOR_LOGOS.map((s) => (
              <div key={s.name} className="flex flex-col items-center lg:items-end gap-2">
                <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-500">{s.label}</span>
                <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-white/10">
                  <img src={s.src} alt={s.name} className="h-8 w-auto object-contain" loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-slate-500">
          © 2026 Faculty of Engineering, Comilla University. All rights reserved.
        </div>
      </div>
    </footer>
  );
};