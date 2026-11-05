import React from 'react';
import { Hero } from '../components/landing/Hero';
import { About } from '../components/landing/About';
import { Schedule } from '../components/landing/Schedule';
import { Events } from '../components/landing/Events';
import { FAQContact } from '../components/landing/FAQContact';
import { Sponsors } from '../components/landing/Sponsors';

export const LandingPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  return (
    <main className="w-full">
      <Hero navigate={navigate} />
      <About />
      <Schedule />
      <Events />
      <FAQContact />
      <Sponsors />
    </main>
  );
};
