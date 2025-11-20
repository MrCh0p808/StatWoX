
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { MySurveys } from './components/MySurveys';
import { HomeFeed } from './components/HomeFeed';
import { Profile } from './components/Profile';
import { Builder } from './components/Builder';
import { Responder } from './components/Responder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import type { View, SurveyCategory, Notification } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<View>('feed');
  const [builderCategory, setBuilderCategory] = useState<SurveyCategory>('survey');
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // BACKEND NOTE: These notifications are currently hardcoded.
  // In a real app, you would fetch these from an endpoint like GET /api/notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'New Response', message: 'You got a new response on "Customer Satisfaction"', time: '2m ago', read: false, type: 'success' },
    { id: '2', title: 'Weekly Report', message: 'Your weekly summary is ready to view.', time: '1h ago', read: false, type: 'info' },
    { id: '3', title: 'System Update', message: 'StatWoX has been updated to v2.0. Check out the new features!', time: '1d ago', read: true, type: 'info' }
  ]);

  // Check for existing login session on app load
  useEffect(() => {
    const token = localStorage.getItem('statwox_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('statwox_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('statwox_token');
    setIsAuthenticated(false);
    setActiveView('feed');
  };

  // Enhanced navigation handler to switch between different screens
  const handleNavigate = (view: View, param?: string | SurveyCategory) => {
    if (view === 'builder') {
        setBuilderCategory((param as SurveyCategory) || 'survey');
    } else if (view === 'responder') {
        setActiveSurveyId((param as string) || null);
    } else if (view === 'analytics') {
        setActiveSurveyId((param as string) || null);
    }
    setActiveView(view);
  };

  const handleMarkAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const renderContent = () => {
    switch (activeView) {
      case 'surveys': return <MySurveys onNavigate={handleNavigate} />;
      case 'feed': return <HomeFeed onNavigate={handleNavigate} />;
      case 'profile': return <Profile />;
      case 'builder': return <Builder category={builderCategory} onNavigate={handleNavigate} />;
      case 'responder': return <Responder surveyId={activeSurveyId} onNavigate={handleNavigate} />;
      case 'analytics': return <AnalyticsDashboard surveyId={activeSurveyId} onNavigate={handleNavigate} />;
      default: return <HomeFeed onNavigate={handleNavigate} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Views that take up the full screen (no sidebar/header)
  const isFullscreenView = activeView === 'builder' || activeView === 'responder' || activeView === 'analytics';

  return (
    <div className={`h-screen w-full flex overflow-hidden text-gray-900 dark:text-white`}>
      {!isFullscreenView && (
          <Sidebar activeView={activeView} setActiveView={handleNavigate} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {!isFullscreenView && (
            <Header 
                onMenuClick={() => setIsSidebarOpen(true)} 
                onLogout={handleLogout}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
            />
        )}
        <main className={`flex-1 overflow-y-auto hide-scrollbar bg-gray-200/50 dark:bg-transparent relative`}>
          <div key={activeView} className="fade-in min-h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
