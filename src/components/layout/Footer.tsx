'use client';

import { Heart, Github, Twitter } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-[#1e3a5f] bg-[#0a0e1a] shrink-0 mt-auto">
            <div className="px-4 md:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-sm text-[#64748b]">
                        © 2024 StatWoX. Made with <Heart className="inline w-4 h-4 text-[#00d4ff] mx-1" /> for survey creators.
                    </p>

                    <div className="flex items-center gap-4">
                        <a
                            href="#"
                            className="text-[#64748b] hover:text-[#00d4ff] transition-colors"
                            aria-label="GitHub"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="#"
                            className="text-[#64748b] hover:text-[#00d4ff] transition-colors"
                            aria-label="Twitter"
                        >
                            <Twitter className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
