export function LoadingCard({ message = 'Učitavanje...' }: { message?: string }) {
  return (
    <div className="card flex items-center gap-3 p-4 text-sm text-[var(--muted)]">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
