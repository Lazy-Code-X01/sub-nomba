"use client";

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export default function DetailPanel({ onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute right-0 top-[60px] h-[calc(100vh-60px)] w-[400px] bg-surface border-l border-stroke overflow-y-auto flex flex-col z-10"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
