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
import { CameraProvider } from './context/CameraContext';

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

  return (
    <CameraProvider>
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

          {/* Dynamic Route Content (Persistent DOM Containers to prevent camera stream & state drops on page switch) */}
          <main className="relative pt-16 w-full min-h-screen bg-slate-50/60 dark:bg-[#0b1120] pb-12 overflow-x-hidden">
            <div className={currentPath === 'overview' ? 'block' : 'hidden'}>
              <Overview onNavigate={setCurrentPath} />
            </div>
            <div className={currentPath === 'live-cameras' ? 'block' : 'hidden'}>
              <LiveCameras />
            </div>
            <div className={currentPath === 'incidents' ? 'block' : 'hidden'}>
              <Incidents />
            </div>
            <div className={currentPath === 'evidence' ? 'block' : 'hidden'}>
              <Evidence />
            </div>
            <div className={currentPath === 'alerts' ? 'block' : 'hidden'}>
              <Alerts />
            </div>
            <div className={currentPath === 'cameras' ? 'block' : 'hidden'}>
              <Cameras />
            </div>
            <div className={currentPath === 'blockchain' ? 'block' : 'hidden'}>
              <Blockchain />
            </div>
            <div className={currentPath === 'audit-trail' ? 'block' : 'hidden'}>
              <AuditTrail />
            </div>
            <div className={currentPath === 'system-health' ? 'block' : 'hidden'}>
              <SystemHealth />
            </div>
            <div className={currentPath === 'models' ? 'block' : 'hidden'}>
              <Models />
            </div>
            <div className={currentPath === 'vehicles' ? 'block' : 'hidden'}>
              <Vehicles />
            </div>
            <div className={currentPath === 'settings' ? 'block' : 'hidden'}>
              <Settings />
            </div>
          </main>
        </div>
      </div>
    </CameraProvider>
  );
};

export default App;
