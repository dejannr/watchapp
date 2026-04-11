'use client';

import { useRouter } from 'next/navigation';

export function ListingBackBreadcrumb({ fallbackHref = '/browse' }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium transition hover:text-[var(--text)]"
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
          }
          router.push(fallbackHref);
        }}
      >
        <span aria-hidden="true">‹</span>
        Nazad
      </button>
      <span aria-hidden="true">/</span>
      <span className="truncate">Detalji oglasa</span>
    </div>
  );
}
