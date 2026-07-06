"use client";

import { useEffect, useState } from "react";
import { X, XCircle, CheckCircle, Info } from "lucide-react";
import { subscribe, ToastItem } from "@/lib/toast";

interface ToastEntry extends ToastItem {
  removing: boolean;
}

const ICON = {
  error:   <XCircle    size={15} className="text-red   flex-shrink-0 mt-px" />,
  success: <CheckCircle size={15} className="text-green flex-shrink-0 mt-px" />,
  info:    <Info        size={15} className="text-blue  flex-shrink-0 mt-px" />,
};

const DURATION = 4000;

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  function dismiss(id: string) {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 250);
  }

  useEffect(() => {
    return subscribe(item => {
      setToasts(prev => [...prev, { ...item, removing: false }]);
      setTimeout(() => dismiss(item.id), DURATION);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center bg-surface border border-stroke rounded-xl overflow-hidden pointer-events-auto ${
            t.removing ? "toast-exit" : "toast-enter"
          }`}
          style={{
            minWidth: "280px",
            maxWidth: "360px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-2.5 px-3.5 py-3 flex-1">
            {ICON[t.type]}
            <p className="font-sans text-[13px] text-label leading-snug">{t.message}</p>
          </div>

          <button
            onClick={() => dismiss(t.id)}
            className="p-2.5 mr-1 text-label-3 hover:text-label transition-colors flex-shrink-0"
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}
