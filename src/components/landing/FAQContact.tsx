import React, { useState } from 'react';
import { ChevronDown, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FAQContact: React.FC = () => {
  const { settings } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const payNumbers = [
    ['bKash', settings.bkash_number],
    ['Nagad', settings.nagad_number],
    ['Rocket', settings.rocket_number],
  ]
    .filter(([, n]) => n)
    .map(([m, n]) => `${m} (${n})`)
    .join(', ');

  const faqs = [
    {
      q: `What is the team size and eligibility criteria?`,
      a: `Teams must consist of ${settings.min_members} to ${settings.max_members} undergraduate students enrolled in any recognized university or college in Bangladesh. Inter-departmental and inter-university teams are allowed.`,
    },
    {
      q: `How do we pay the registration fee?`,
      a: `The registration fee is ${settings.registration_fee_bdt} BDT per team. Pay manually via ${payNumbers || 'bKash, Nagad, or Rocket (numbers will be announced soon)'}. Keep the transaction ID (TrxID) and sender number for the registration form.`,
    },
    {
      q: `When and how do we get our Team Login credentials?`,
      a: `After your team submits the registration form, our organizing moderators will manually cross-reference your transaction ID against official bank records. Once verified, the system generates your team login, and the organizing committee emails the temporary password to the team leader.`,
    },
    {
      q: `How will the Online Round submissions work?`,
      a: `Once the online window opens, logged-in teams can view and download the official Scenario and Problem Statement documents. Your final submission must include an abstract (max 350 characters), a public GitHub repository URL, and a demo video link (e.g. YouTube/Drive). At the deadline, our snapshot job automatically captures the exact commit SHA.`,
    },
    {
      q: `How are finalists selected for the on-site round?`,
      a: `Every team submission is reviewed by independent judges with scores between 0 and ${settings.max_score}. The top ${settings.finalist_count_n} teams by average score are selected as on-site finalists and receive an invitation to the Faculty of Engineering campus at Comilla University for Phase 2.`,
    },
  ];

  return (
    <section id="faq" className="py-20 bg-[#f6f4ff] text-[#1b1236] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6d3df5]/10 text-[#6d3df5] text-xs font-bold uppercase tracking-wider mb-3">
            Help & Information
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-[#1b1236] mb-4">
            Frequently Asked Questions & Contact
          </h2>
          <p className="text-[#1b1236]/80 text-sm sm:text-base">
            Have questions regarding registration, guidelines, or travel to Comilla University? We're here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* FAQ Accordion (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-heading font-bold text-xl text-[#1b1236] flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-[#6d3df5]" />
              Rules & Registration Queries
            </h3>

            {faqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-[14px] border border-[#e0dbf5] shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-heading font-semibold text-sm sm:text-base text-[#1b1236] hover:text-[#6d3df5] transition-colors min-h-[48px]"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#6d3df5] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-purple-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact & Support Helpline (5 cols) */}
          <div id="contact" className="lg:col-span-5 lg:sticky lg:top-24 bg-white p-8 rounded-[20px] border border-[#e0dbf5] shadow-xl shadow-purple-900/5">
            <h3 className="font-heading font-bold text-xl text-[#1b1236] mb-2">
              Organizing Helpline
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              Reach the organizing team for payment confirmation or general support.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[#f6f4ff] border border-[#e0dbf5]">
                <div className="w-9 h-9 rounded-lg bg-[#6d3df5]/10 text-[#6d3df5] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email Helpline</div>
                  <div className="text-sm font-bold text-[#1b1236]">{settings.support_email || 'To be announced'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[#f6f4ff] border border-[#e0dbf5]">
                <div className="w-9 h-9 rounded-lg bg-[#ffb020]/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Phone Hotline</div>
                  <div className="text-sm font-bold text-[#1b1236]">{settings.support_phone || 'To be announced'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[#f6f4ff] border border-[#e0dbf5]">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Location</div>
                  <div className="text-xs font-bold text-[#1b1236]">Faculty of Engineering, Comilla University</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};