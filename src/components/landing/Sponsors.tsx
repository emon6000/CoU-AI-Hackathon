import React from 'react';

type Sponsor = {
  name: string;
  role: string;
  description: string;
  image: string;
  accent: string;
};

const sponsors: Sponsor[] = [
  {
    name: 'Gigabyte Aorus',
    role: 'Presented by',
    description: 'Title sponsor of AI Hackathon 2026.',
    image: '/sponsors/Gigabyte_aorus_logo.png',
    accent: 'border-amber-400/40 bg-amber-500/5',
  },
  {
    name: 'IT Palace',
    role: 'Powered by',
    description: 'Supporting sponsor of AI Hackathon 2026.',
    image: '/sponsors/ITP-2.png',
    accent: 'border-cyan-400/40 bg-cyan-500/5',
  },
];

export const Sponsors: React.FC = () => {
  return (
    <section
      id="sponsors"
      className="py-20 bg-[#090516] text-white relative border-t border-purple-900/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3 border border-cyan-500/20">
            Official Supporters
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Our Official Sponsors &amp; Partners
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Proudly supported by the organizations backing this year’s AI innovation community.
          </p>
        </div>

        {/* Flex + justify-center keeps 1–2 sponsors centered instead of left-aligned in an empty grid */}
        <div className="flex flex-wrap justify-center gap-8">
          {sponsors.map((sponsor) => (
            <article
              key={sponsor.name}
              className={`glass-panel flex w-full max-w-md flex-col rounded-[20px] border p-6 md:w-[calc(50%-1rem)] md:max-w-none lg:w-[calc(33.333%-1.34rem)] md:p-8 ${sponsor.accent} transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-purple-900/20`}
            >
              {/* Light plate so dark / transparent logos stay readable on the dark theme */}
              <div className="mb-6 flex h-32 items-center justify-center rounded-2xl bg-white p-5 ring-1 ring-white/10">
                <img
                  src={sponsor.image}
                  alt={`${sponsor.name} logo`}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Badge sits above the name so neither one wraps awkwardly */}
              <span className="mb-3 inline-flex w-fit items-center whitespace-nowrap rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                {sponsor.role}
              </span>

              <h3 className="mb-2 font-heading text-2xl font-bold leading-tight text-white">
                {sponsor.name}
              </h3>

              <p className="mt-auto text-sm leading-relaxed text-slate-300">
                {sponsor.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};