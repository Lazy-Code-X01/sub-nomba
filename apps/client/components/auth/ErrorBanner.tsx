export default function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="font-sans text-[13px] text-red bg-red/10 border border-red/20 rounded-xl px-4 py-3">
      {message}
    </p>
  );
}
