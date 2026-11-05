import React, { useState } from 'react';
import { Menu, X, LogIn, UserCheck, Shield, Award, LogOut, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, navigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { auth, logout } = useApp();

  const handleNavClick = (route: string) => {
    navigate(route);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'About', route: '/#about' },
    { label: 'Schedule', route: '/#schedule' },
    { label: 'Events', route: '/#events' },
    { label: 'Teams', route: '/teams' },
    { label: 'Sponsors', route: '/#sponsors' },
    { label: 'FAQ', route: '/#faq' },
    { label: 'Contact', route: '/#contact' },
  ];

  const portalButton = (() => {
    if (auth.role === 'team') {
      return { label: 'Team Portal', route: '/team', icon: Award, color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
    }
    if (auth.role === 'judge') {
      return { label: 'Judge Panel', route: '/judge', icon: Award, color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' };
    }
    if (['super_admin', 'moderator'].includes(auth.role)) {
      return { label: 'Staff Dashboard', route: '/admin', icon: Shield, color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' };
    }
    return null;
  })();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0a0618]/95 backdrop-blur-md border-b border-purple-900/30">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/event-logo-horizontal.png"
              alt="AI Hackathon 2026"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            />
          </div>

          {/* Desktop Navigation Links (>= 900px) */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.route)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center ${
                  currentRoute === link.route
                    ? 'text-cyan-300 bg-white/5'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}

          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {auth.role === 'visitor' ? (
              <button
                onClick={() => handleNavClick('/login')}
                className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white rounded-[10px] hover:bg-white/5 transition-colors min-h-[44px] flex items-center gap-1.5 border border-transparent hover:border-purple-500/30"
              >
                <LogIn className="w-4 h-4 text-purple-400" />
                Team login
              </button>
            ) : portalButton ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick(portalButton.route)}
                  className="px-4 py-2 text-sm font-medium text-purple-200 hover:text-white rounded-[10px] bg-purple-900/40 hover:bg-purple-900/60 transition-colors min-h-[44px] flex items-center gap-1.5 border border-purple-600/40"
                >
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>{portalButton.label}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2.5 rounded-[10px] text-slate-400 hover:text-red-300 hover:bg-red-950/30 transition-colors min-h-[44px] flex items-center justify-center"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <button
              onClick={() => handleNavClick('/register')}
              className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 active:scale-[0.98] rounded-[10px] shadow-lg shadow-amber-500/25 transition-all min-h-[44px] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-900 fill-slate-900" />
              Register now
            </button>
          </div>

          {/* Mobile Menu Hamburger Button (< 900px) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => handleNavClick('/register')}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 rounded-[8px]"
            >
              Register
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0c071d] border-b border-purple-800/40 px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.route)}
                className="w-full text-left px-3 py-3 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5 active:bg-white/10 min-h-[44px]"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-purple-800/30 flex flex-col gap-2">
            {auth.role === 'visitor' ? (
              <button
                onClick={() => handleNavClick('/login')}
                className="w-full py-3 px-4 rounded-[10px] text-center font-medium bg-white/5 text-slate-200 hover:bg-white/10 min-h-[44px] flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-purple-400" />
                Team login
              </button>
            ) : portalButton ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleNavClick(portalButton.route);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-[10px] text-center font-medium bg-purple-900/50 text-cyan-200 min-h-[44px] flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>{portalButton.label}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="py-3 px-4 rounded-[10px] bg-red-950/40 text-red-300 border border-red-500/30 flex items-center justify-center"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <button
              onClick={() => handleNavClick('/register')}
              className="w-full py-3 px-4 rounded-[10px] text-center font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md min-h-[44px] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Register your team
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
