import React from "react";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-[9px] rounded-lg",
  md: "w-8 h-8 text-[11px] rounded-lg",
  lg: "w-10 h-10 text-[13px] rounded-xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Avatar({ name, size = "md", color }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = color ?? "var(--yellow)";
  const textColor = color ? "var(--text)" : "#0A0A0A";

  return (
    <div
      className={`flex items-center justify-center font-mono font-bold flex-shrink-0 ${sizeClasses[size]}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {initials}
    </div>
  );
}
