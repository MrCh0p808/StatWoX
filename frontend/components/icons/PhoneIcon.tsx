
import React from 'react';

interface IconProps {
  className?: string;
}

export const PhoneIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H6zm12 2H6v16h12V4z" clipRule="evenodd" />
        <path d="M11 17a1 1 0 102 0 1 1 0 00-2 0z" />
    </svg>
);
