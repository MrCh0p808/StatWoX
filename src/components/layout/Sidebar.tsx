'use client';

import { Home, FileText, User, X, Plus, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const navItems = [
    { href: '/feed', label: 'Home Feed', icon: Home },
    { href: '/surveys', label: 'My Data', icon: FileText },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { user } = useAuthStore();
    const pathname = usePathname() || '/feed';

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 
        bg-[#0a0e1a] border-r border-[#1e3a5f]
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:fixed lg:z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    <div className="h-16 flex items-center justify-between px-4 border-b border-[#1e3a5f] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center shadow-lg shadow-[#00d4ff]/25">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="font-bold text-xl text-white">StatWoX</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-slate-400 hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="p-4 border-b border-[#1e3a5f]">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="w-12 h-12 border-2 border-[#00d4ff]">
                                    <AvatarImage src={user?.image || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#00d4ff] to-[#0066ff] text-white text-lg">
                                        {user?.name?.[0] || user?.username?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0a0e1a]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{user?.name || user?.username || 'User'}</p>
                                <p className="text-sm text-[#94a3b8] truncate">{user?.bio || 'Hey there! I\'m using StatWoX'}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Online
                            </span>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-3 py-4">
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                                                ? 'bg-gradient-to-r from-[#00d4ff]/20 to-[#0066ff]/20 text-[#00d4ff] border border-[#00d4ff]/30'
                                                : 'text-slate-400 hover:bg-[#1e3a5f]/50 hover:text-white'
                                            }
                    `}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-6 pt-6 border-t border-[#1e3a5f]">
                            <Link
                                href="/builder/new"
                                onClick={() => setIsOpen(false)}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white font-medium text-sm hover:from-[#00c8ff] hover:to-[#0088ff] transition-all duration-200 shadow-lg shadow-[#00d4ff]/25 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New
                            </Link>
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-[#1e3a5f] shrink-0">
                        <p className="text-xs text-[#64748b] text-center">
                            © 2024 StatWoX v2.0
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
