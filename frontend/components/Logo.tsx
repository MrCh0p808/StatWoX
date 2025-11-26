import React from "react";

// This component handles the logo display.
// It takes a size prop so I can use it in different places (like the login screen or the navbar).
const Logo = ({ size = "xxl", className = "" }: { size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl", className?: string }) => {
    // Defining the height for each size option.
    // Tailwind classes make it easy to change heights.
    const sizes = {
        xs: "h-8", // Perfect for headers
        sm: "h-12",
        md: "h-24",
        lg: "h-36",
        xl: "h-48",
        xxl: "h-24 md:h-40 lg:h-56", // Adjusted for better mobile fit while staying large on desktop
    };

    return (
        <div className={`${sizes[size]} w-full flex justify-center items-center px-4 ${className}`}>
            <img
                src="/statwox_logo.png"
                alt="StatWoX Logo"
                // Using max-w-full to make sure it never overflows the screen on small phones.
                // object-contain keeps the aspect ratio correct.
                className="h-full w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-2xl filter hover:brightness-110 transition-all duration-500"
                // Preventing people from right-clicking to save the logo (basic protection)
                onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
                draggable={false}
            />
        </div>
    );
};

export default Logo;
