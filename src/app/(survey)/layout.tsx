'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function SurveyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#00d4ff]/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#0066ff]/10 rounded-full blur-[120px]" />
                </div>
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white text-lg font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
            <main className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
