import React from "react";

const Logo = ({ size = "xxl", className = "" }) => {
  const sizes = {
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
        className="h-full w-auto max-w-full object-contain pointer-events-none select-none drop-shadow-2xl filter hover:brightness-110 transition-all duration-500"
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />
    </div>
  );
};

export default Logo;
