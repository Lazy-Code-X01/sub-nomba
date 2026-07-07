"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-surface border border-stroke rounded-2xl w-full max-w-md flex flex-col"
        style={{ maxHeight: "calc(100vh - 80px)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <h2 className="font-sans font-bold text-[16px] text-label">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-label-3 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
