"use client";

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export default function DetailPanel({ onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-[400px] bg-surface border-l border-stroke overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
