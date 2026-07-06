import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary: "bg-yellow text-black font-semibold hover:bg-yellow/90",
  ghost: "bg-surface-2 border border-stroke text-label-2 hover:text-label hover:bg-surface-3",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-[11px] rounded-lg",
  md: "px-4 py-2 text-[12px] rounded-lg",
  lg: "px-5 py-2.5 text-[13px] rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-sans transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
