export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-lg font-extrabold tracking-[0.18em] ${className}`}>
      LEARNWITH<span className="text-brand-gradient">AI</span>
    </span>
  );
}
