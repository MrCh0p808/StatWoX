import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { MySurveys } from './components/MySurveys';
import { HomeFeed } from './components/HomeFeed';
import { Profile } from './components/Profile';
import { Builder } from './components/Builder';
import { Responder } from './components/Responder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { API_BASE_URL } from './constants';
import type { View, SurveyCategory, Notification } from './types';

const App: React.FC = () => {
  // Tracking if the user is logged in or not
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This state tells us which "page" or view is currently active on the screen
  const [activeView, setActiveView] = useState<View>('feed');

  // If we are in the builder, this tells us what kind of thing we are building (survey vs form)
  const [builderCategory, setBuilderCategory] = useState<SurveyCategory>('survey');

  // If we are taking a survey or looking at analytics, this ID tells us which one
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);

  // Controls whether the mobile sidebar is open or closed
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // BACKEND NOTE: These notifications are currently hardcoded.
  // In a real app, you would fetch these from an endpoint like GET /api/notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'New Response', message: 'You got a new response on "Customer Satisfaction"', time: '2m ago', read: false, type: 'success' },
    { id: '2', title: 'Weekly Report', message: 'Your weekly summary is ready to view.', time: '1h ago', read: false, type: 'info' },
    { id: '3', title: 'System Update', message: 'StatWoX has been updated to v2.0. Check out the new features!', time: '1d ago', read: true, type: 'info' }
  ]);

  // When the app loads, I check if there's a token saved in the browser.
  // If there is, I assume the user is still logged in.
  useEffect(() => {
    const token = localStorage.getItem('statwox_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/notifications`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('statwox_token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
          }
        } catch (e) {
          console.error("Failed to fetch notifications", e);
        }
      };
      fetchNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Called when the Login component says "Success!"
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('statwox_token', token);
    setIsAuthenticated(true);
  };

  // Called when the user clicks Logout
  const handleLogout = () => {
    localStorage.removeItem('statwox_token');
    setIsAuthenticated(false);
    setActiveView('feed');
  };

  // This is my main router. It switches the view and sets up any params needed.
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

  // Marking a single notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Marking all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // This function decides which component to show based on the activeView state
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

  // If not logged in, show the Login screen instead of the app
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Some views (like taking a survey) should take up the whole screen without the sidebar
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
