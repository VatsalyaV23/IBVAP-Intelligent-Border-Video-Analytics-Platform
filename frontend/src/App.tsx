import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Overview } from './pages/Overview';
import { LiveCameras } from './pages/LiveCameras';
import { Incidents } from './pages/Incidents';
import { Evidence } from './pages/Evidence';
import { Alerts } from './pages/Alerts';
import { Cameras } from './pages/Cameras';
import { Blockchain } from './pages/Blockchain';
import { Models } from './pages/Models';
import { AuditTrail } from './pages/AuditTrail';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { Vehicles } from './pages/Vehicles';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ibvap-theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('ibvap-theme', theme);
  }, [theme]);

  const handleToggleTheme = (t: 'light' | 'dark') => {
    setTheme(t);
  };

  const renderContent = () => {
    switch (currentPath) {
      case 'overview':
        return <Overview onNavigate={setCurrentPath} />;
      case 'live-cameras':
        return <LiveCameras />;
      case 'incidents':
        return <Incidents />;
      case 'evidence':
        return <Evidence />;
      case 'alerts':
        return <Alerts />;
      case 'cameras':
        return <Cameras />;
      case 'blockchain':
        return <Blockchain />;
      case 'audit-trail':
        return <AuditTrail />;
      case 'system-health':
        return <SystemHealth />;
      case 'models':
        return <Models />;
      case 'vehicles':
        return <Vehicles />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview onNavigate={setCurrentPath} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 overflow-x-hidden">
      {/* Left Institutional Sidebar (Responsive Drawer) */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Wrapper */}
      <div className="lg:pl-72 pl-0 transition-all duration-300">
        {/* Top Header with Hamburger and Live Controls */}
        <TopHeader
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Dynamic Route Content */}
        <main className="relative pt-16 w-full min-h-screen bg-slate-50/60 dark:bg-[#0b1120] pb-12 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
