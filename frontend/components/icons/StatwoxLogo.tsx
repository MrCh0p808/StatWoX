import React, { useState } from 'react';

interface IconProps {
    className?: string;
}

export const StatwoxLogo: React.FC<IconProps> = ({ className = "h-10 w-auto" }) => {
    const [imgError, setImgError] = useState(false);

    if (imgError) {
        return (
            <span className={`font-black tracking-tighter text-2xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 ${className} flex items-center`}>
                StatWoX
            </span>
        );
    }

    return (
        <img
            src="/logo.png"
            alt="StatWoX"
            className={`${className} object-contain max-w-full pointer-events-none select-none`}
            onError={() => setImgError(true)}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
        />
    );
};
