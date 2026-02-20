'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/stores/authStore';
import { useSurveyStore } from '@/stores/surveyStore';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading, token, checkAuth, logout } = useAuthStore();
    const { fetchSurveys, fetchNotifications } = useSurveyStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchSurveys(token);
            fetchNotifications(token);
        }
    }, [isAuthenticated, token, fetchSurveys, fetchNotifications]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#00d4ff]/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#0066ff]/10 rounded-full blur-[120px]" />
                </div>
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white text-lg font-medium">Loading StatWoX...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col transition-all duration-300 lg:pl-72">
                <Header
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onLogout={handleLogout}
                />

                <main className="p-4 md:p-6 lg:p-8 flex-1">
                    {children}
                </main>

                <Footer />
            </div>
        </div>
    );
}
