'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Menu, Bell, Search, LogOut, User, Settings, Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';
import { useSurveyStore } from '@/stores/surveyStore';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    onMenuClick: () => void;
    onLogout: () => void;
}

export function Header({ onMenuClick, onLogout }: HeaderProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const { notifications, markNotificationRead, markAllNotificationsRead } = useSurveyStore();
    const { theme, setTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const unreadCount = Array.isArray(notifications)
        ? notifications.filter(n => !n.read).length
        : 0;

    const handleMarkAllRead = () => {
        markAllNotificationsRead();
    };

    const handleNotificationClick = (id: string) => {
        markNotificationRead(id);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-[#1e3a5f]">
            <div className="h-full px-4 md:px-6 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden shrink-0 text-slate-400 hover:text-white hover:bg-[#1e3a5f]/50"
                    onClick={onMenuClick}
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <div className="flex-1 max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <Input
                            placeholder="Search surveys, polls, forms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#111827] border-[#1e3a5f] h-10 text-white placeholder:text-[#64748b] focus:border-[#00d4ff]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="h-9 w-9 text-slate-400 hover:text-white hover:bg-[#1e3a5f]/50"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-400 hover:text-white hover:bg-[#1e3a5f]/50">
                                <Bell className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <Badge
                                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#00d4ff] text-[#0a0e1a] border-0 font-medium"
                                    >
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 bg-[#111827] border-[#1e3a5f]">
                            <DropdownMenuLabel className="text-white flex items-center justify-between">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto py-1 px-2 text-xs text-[#00d4ff] hover:text-[#00d4ff]"
                                        onClick={handleMarkAllRead}
                                    >
                                        Mark all read
                                    </Button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[#1e3a5f]" />
                            <ScrollArea className="h-64">
                                {!Array.isArray(notifications) || notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-[#94a3b8]">
                                        No notifications
                                    </div>
                                ) : (
                                    notifications.slice(0, 10).map((notification) => (
                                        <DropdownMenuItem
                                            key={notification.id}
                                            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-[#1e3a5f]/50 ${!notification.read ? 'bg-[#00d4ff]/5' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification.id)}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notification.read ? 'bg-[#64748b]' : 'bg-[#00d4ff]'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{notification.title}</p>
                                                <p className="text-xs text-[#94a3b8] truncate">{notification.message}</p>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-[#1e3a5f]/50">
                                <Avatar className="h-8 w-8 border-2 border-[#1e3a5f]">
                                    <AvatarImage src={user?.image || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#00d4ff] to-[#0066ff] text-white text-sm">
                                        {user?.name?.[0] || user?.username?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden md:inline text-sm font-medium text-white">
                                    {user?.name || user?.username || 'User'}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#111827] border-[#1e3a5f]">
                            <DropdownMenuLabel className="text-white">
                                <div className="flex flex-col">
                                    <span className="font-medium">{user?.name || user?.username}</span>
                                    <span className="text-xs font-normal text-[#94a3b8]">{user?.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[#1e3a5f]" />
                            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer text-[#94a3b8] hover:text-white focus:text-white hover:bg-[#1e3a5f]/50 focus:bg-[#1e3a5f]/50">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer text-[#94a3b8] hover:text-white focus:text-white hover:bg-[#1e3a5f]/50 focus:bg-[#1e3a5f]/50">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#1e3a5f]" />
                            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-400 focus:text-red-400 hover:bg-[#1e3a5f]/50 focus:bg-[#1e3a5f]/50">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
