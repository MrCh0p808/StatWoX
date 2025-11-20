
import React from 'react';

interface IconProps {
  className?: string;
}

export const QrCodeIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 8V4h6v4H6zm12 0V4h-6v4h6zM6 20v-4H4v4h2zm6 0v-4h-6v4h6zm12-7v-4h-2v4h2zm-12 0v-4H4v4h6z" />
    </svg>
);
