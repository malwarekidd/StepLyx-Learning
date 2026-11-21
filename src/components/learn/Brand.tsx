export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`whitespace-nowrap font-display text-base font-extrabold tracking-normal sm:text-lg ${className}`}>
      steplyx-<span className="text-brand-gradient">learning</span>
    </span>
  );
}
