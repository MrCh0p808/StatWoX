import React from 'react';
import type { View } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { UserIcon } from './icons/UserIcon';
import { XIcon } from './icons/XIcon';
import Logo from './Logo';

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
    const navItems = [
        { id: 'feed', label: 'Home Feed', icon: HomeIcon },
        { id: 'surveys', label: 'My Surveys', icon: DocumentTextIcon },
        { id: 'profile', label: 'Profile', icon: UserIcon },
    ];

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
            <aside className={`fixed lg:relative inset-y-0 left-0 w-72 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/10 p-5 flex-shrink-0 z-40 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} text-gray-800 dark:text-white shadow-2xl lg:shadow-none`}>
                <div className="flex items-center justify-between h-20 mb-2 px-2">
                    <div className="w-full text-center lg:text-left">
                        <Logo size="sm" className="mx-auto mb-4" />
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <XIcon />
                    </button>
                </div>
                <nav className="flex flex-col space-y-3">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveView(item.id as View); setIsOpen(false); }}
                            className={`flex items-center p-4 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 ${
                                activeView === item.id
                                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white border border-indigo-100 dark:border-white/20 shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent'
                            }`}
                        >
                            <item.icon className={`w-6 h-6 mr-4 ${activeView === item.id ? 'text-indigo-600 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
};
