"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export default function DetailPanel({ onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 h-full w-[400px] bg-surface border-l border-stroke overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
