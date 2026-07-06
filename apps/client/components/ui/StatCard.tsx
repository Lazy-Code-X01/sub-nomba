import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  highlight?: boolean;
}

const changeConfig = {
  up: { icon: TrendingUp, color: "text-green" },
  down: { icon: TrendingDown, color: "text-red" },
  neutral: { icon: Minus, color: "text-label-2" },
};

export default function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  highlight = false,
}: StatCardProps) {
  const ChangIcon = changeConfig[changeType].icon;
  const changeColor = changeConfig[changeType].color;

  return (
    <div
      className={`relative rounded-card border overflow-hidden p-5 ${
        highlight
          ? "border-transparent bg-yellow-glow"
          : "border-stroke bg-surface"
      }`}
    >
      {/* Top gradient accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{
          background: highlight
            ? "linear-gradient(to right, transparent, var(--yellow), transparent)"
            : "linear-gradient(to right, transparent, var(--border2), transparent)",
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-label-2 mb-2">
            {label}
          </p>
          <p
            className={`font-mono text-2xl font-medium tracking-tight ${
              highlight ? "text-yellow" : "text-label"
            }`}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`p-2.5 rounded-xl ${
              highlight ? "bg-yellow-dim" : "bg-surface-2"
            }`}
          >
            <span
              className={`flex ${highlight ? "text-yellow" : "text-label-2"}`}
            >
              {icon}
            </span>
          </div>
        )}
      </div>

      {change && (
        <div className={`flex items-center gap-1 mt-3 ${changeColor}`}>
          <ChangIcon size={12} />
          <span className="font-mono text-[10px]">{change}</span>
        </div>
      )}
    </div>
  );
}
