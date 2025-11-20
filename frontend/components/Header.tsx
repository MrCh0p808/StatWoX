
import React, { useState, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import type { Notification } from '../types';
import { BellIcon } from './icons/BellIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { MenuIcon } from './icons/MenuIcon';
import { StatwoxLogo } from './icons/StatwoxLogo';

interface HeaderProps {
    onMenuClick: () => void;
    onLogout: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onLogout, notifications, onMarkAsRead, onMarkAllAsRead }) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useClickOutside(notificationRef, () => setNotificationsOpen(false));
    useClickOutside(profileRef, () => setProfileOpen(false));

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 sticky top-0 z-20 text-gray-800 dark:text-white transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center lg:hidden">
                        <button
                            onClick={onMenuClick}
                            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none transition-colors"
                            aria-label="Open sidebar"
                        >
                            <MenuIcon />
                        </button>
                    </div>
                    {/* Desktop Spacer */}
                    <div className="hidden lg:flex lg:w-1/3"></div>
                    
                    {/* Logo Container - Responsive Sizing */}
                    <div className="flex-1 flex justify-center lg:w-1/3">
                        <div className="h-8 lg:h-9 w-auto flex items-center justify-center">
                             <StatwoxLogo className="h-full w-auto max-w-[150px] lg:max-w-[200px]" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end lg:w-1/3 space-x-2 sm:space-x-4">
                        <div className="relative" ref={notificationRef}>
                            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none transition-colors text-gray-600 dark:text-gray-300 relative">
                                <BellIcon />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
                                )}
                            </button>
                            {notificationsOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all z-50 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button onClick={onMarkAllAsRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Mark all read</button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No notifications yet.</div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div 
                                                    key={notification.id} 
                                                    onClick={() => onMarkAsRead(notification.id)}
                                                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${!notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{notification.title}</p>
                                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notification.time}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={profileRef}>
                            <button onClick={() => setProfileOpen(!profileOpen)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none transition-colors">
                                <UserCircleIcon />
                            </button>
                            {profileOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all z-50">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors" role="menuitem">Change Profile Photo</a>
                                        <button onClick={onLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors" role="menuitem">
                                            <LogoutIcon className="w-5 h-5 mr-2" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
