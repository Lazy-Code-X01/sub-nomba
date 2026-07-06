import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Card({
  title,
  children,
  rightSlot,
  className = "",
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={`bg-surface border border-stroke rounded-card overflow-hidden ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-stroke">
          <span className="font-sans font-semibold text-[13px] text-label">
            {title}
          </span>
          {rightSlot && (
            <div className="flex items-center gap-2">{rightSlot}</div>
          )}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}
