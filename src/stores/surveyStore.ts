import { create } from 'zustand';
import type { Survey, Notification } from '@/types';

interface SurveyState {
    surveys: Survey[];
    notifications: Notification[];
    isLoading: boolean;
    setSurveys: (surveys: Survey[]) => void;
    addSurvey: (survey: Survey) => void;
    updateSurvey: (id: string, data: Partial<Survey>) => void;
    removeSurvey: (id: string) => void;
    setNotifications: (notifications: Notification[]) => void;
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;
    fetchSurveys: (token: string) => Promise<void>;
    fetchNotifications: (token: string) => Promise<void>;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
    surveys: [],
    notifications: [],
    isLoading: false,

    setSurveys: (surveys) => set({ surveys }),

    addSurvey: (survey) => set((state) => ({ surveys: [survey, ...state.surveys] })),

    updateSurvey: (id, data) => set((state) => ({
        surveys: state.surveys.map(s => s.id === id ? { ...s, ...data } : s)
    })),

    removeSurvey: (id) => set((state) => ({
        surveys: state.surveys.filter(s => s.id !== id)
    })),

    setNotifications: (notifications) => set({ notifications }),

    markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
    })),

    markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),

    fetchSurveys: async (token) => {
        set({ isLoading: true });
        try {
            const response = await fetch('/api/surveys', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.data) {
                set({ surveys: data.data.surveys || [] });
            }
        } catch (error) {
            console.error('Failed to fetch surveys:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchNotifications: async (token) => {
        try {
            const response = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.data) {
                set({ notifications: data.data.notifications || [] });
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    },
}));
