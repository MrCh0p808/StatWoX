import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
    checkAuth: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            setToken: (token) => set({ token, isAuthenticated: !!token }),

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-storage');
                }
            },

            checkAuth: () => {
                const state = get();
                if (state.token && !state.user) {
                    set({ isLoading: true });
                    fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${state.token}` }
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success && data.data) {
                                set({ user: data.data, isAuthenticated: true, isLoading: false });
                            } else {
                                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                            }
                        })
                        .catch(() => {
                            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                        });
                } else {
                    set({ isLoading: false });
                }
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
);
