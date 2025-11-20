import React from "react";

const Logo = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "h-6",
    md: "h-10",
    lg: "h-14",
    xl: "h-20"
  };

  return (
    <img
      src="./assets/logo.png"     
      alt="StatWox Logo"
      className={`${sizes[size]} w-auto object-contain ${className}`}
      loading="lazy"
      draggable={false}
    />
  );
};

export default Logo;
