import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { TeamsPage } from './pages/TeamsPage';
import { PaymentCorrectionPage } from './pages/PaymentCorrectionPage';
import { TeamLoginPage } from './pages/TeamLoginPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { JudgePanelPage } from './pages/JudgePanelPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AlertTriangle, Home } from 'lucide-react';

function MainRouter() {
  const { auth } = useApp();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    // If it's an anchor hash on home
    if (route.startsWith('/#')) {
      if (currentRoute !== '/') {
        setCurrentRoute('/');
        window.history.pushState({}, '', '/');
      }
      setTimeout(() => {
        const id = route.replace('/#', '');
        const elem = document.getElementById(id);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route resolver
  const renderCurrentView = () => {
    // Payment correction one-time link: /payment-correction/:token
    if (currentRoute.startsWith('/payment-correction/')) {
      const token = currentRoute.replace('/payment-correction/', '');
      return <PaymentCorrectionPage token={token} navigate={navigate} />;
    }

    switch (currentRoute) {
      case '/':
        return <LandingPage navigate={navigate} />;

      case '/register':
        return <RegisterPage navigate={navigate} />;

      case '/teams':
        return <TeamsPage navigate={navigate} />;

      case '/login':
        return <TeamLoginPage navigate={navigate} />;

      case '/staff/login':
        return <StaffLoginPage navigate={navigate} />;

      case '/team':
        if (auth.role !== 'team' && auth.role !== 'super_admin') {
          return (
            <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
              <div className="glass-panel p-8 rounded-[16px] max-w-md text-center border border-amber-500/40">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h2 className="font-heading font-bold text-xl text-white mb-2">Team Authentication Required</h2>
                <p className="text-xs text-slate-300 mb-6">
                  Please log in with your team leader credentials to access scenario files and submission forms.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-[8px] bg-[#6d3df5] text-white text-xs font-bold"
                  >
                    Team Login
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs font-semibold"
                  >
                    Home
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return <TeamDashboardPage navigate={navigate} />;

      case '/judge':
        // Role check
        if (auth.role !== 'judge' && auth.role !== 'super_admin') {
          return (
            <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
              <div className="glass-panel p-8 rounded-[16px] max-w-md text-center border border-amber-500/40">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h2 className="font-heading font-bold text-xl text-white mb-2">Access Restricted (403)</h2>
                <p className="text-xs text-slate-300 mb-6">
                  You must be authenticated as a Judge or Super Admin to view the evaluation panel.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => navigate('/staff/login')}
                    className="px-4 py-2 rounded-[8px] bg-[#6d3df5] text-white text-xs font-bold"
                  >
                    Staff Sign In
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs font-semibold"
                  >
                    Home
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return <JudgePanelPage navigate={navigate} />;

      case '/admin':
        // Role check
        if (auth.role !== 'super_admin' && auth.role !== 'moderator') {
          return (
            <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
              <div className="glass-panel p-8 rounded-[16px] max-w-md text-center border border-purple-500/40">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h2 className="font-heading font-bold text-xl text-white mb-2">Staff Access Only (403)</h2>
                <p className="text-xs text-slate-300 mb-6">
                  The Admin and Moderator dashboard requires organizing committee authentication.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => navigate('/staff/login')}
                    className="px-4 py-2 rounded-[8px] bg-[#6d3df5] text-white text-xs font-bold"
                  >
                    Staff Sign In
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 rounded-[8px] bg-white/10 text-white text-xs font-semibold"
                  >
                    Home
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return <AdminDashboardPage navigate={navigate} />;

      default:
        // Branded 404
        return (
          <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0618] px-4 py-16">
            <div className="glass-panel p-8 rounded-[20px] max-w-md text-center border border-white/10 shadow-2xl space-y-4">
              <div className="text-5xl font-heading font-extrabold text-cyan-400">404</div>
              <h2 className="font-heading font-bold text-xl text-white">Page Not Found</h2>
              <p className="text-xs text-slate-400">
                The requested URL <code className="text-purple-300">{currentRoute}</code> does not exist on the AI Hackathon portal.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-[10px] bg-[#6d3df5] hover:bg-[#5b2bd5] text-white text-xs font-bold flex items-center gap-2 mx-auto"
              >
                <Home className="w-4 h-4" />
                <span>Return to Homepage</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0618] text-[#f6f4ff] selection:bg-cyan-500 selection:text-black">
      <Header currentRoute={currentRoute} navigate={navigate} />
      <div className="flex-1">{renderCurrentView()}</div>
      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
