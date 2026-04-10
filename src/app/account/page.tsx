'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiRequest } from '@/lib/api';

const links = [
  ['/account/profile', 'Profil'],
  ['/account/favorites', 'Favoriti'],
  ['/account/notifications', 'Obaveštenja'],
] as const;

const sellerStatusMeta: Record<string, { label: string; className: string }> = {
  NONE: {
    label: 'Nije poslata prijava',
    className: 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]',
  },
  PENDING: {
    label: 'Na čekanju',
    className: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  APPROVED: {
    label: 'Odobreno',
    className: 'border-green-300 bg-green-50 text-green-800',
  },
  REJECTED: {
    label: 'Odbijeno',
    className: 'border-red-300 bg-red-50 text-red-800',
  },
};

export default function NalogPage() {
  const { data: user } = useCurrentUser();
  const favorites = useQuery({
    queryKey: ['account-count-favorites'],
    queryFn: () => apiRequest<any[]>('/me/favorites', 'GET', undefined, true),
  });
  const notifications = useQuery({
    queryKey: ['account-count-notifications-unread'],
    queryFn: () => apiRequest<{ unread: number }>('/notifications/me/unread-count', 'GET', undefined, true),
  });

  const badgeByHref = useMemo(() => {
    const unread = Number(notifications.data?.unread ?? 0);
    return {
      '/account/favorites': Array.isArray(favorites.data) ? favorites.data.length : 0,
      '/account/notifications': unread,
    } as Record<string, number>;
  }, [favorites.data, notifications.data?.unread]);
  const sellerStatus = user?.sellerStatus ?? 'NONE';
  const statusMeta = sellerStatusMeta[sellerStatus] ?? {
    label: sellerStatus,
    className: 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]',
  };

  return (
    <div className="container space-y-5">
      <div className="card border border-[var(--line)] p-5">
        <h1 className="text-3xl font-bold">Nalog</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Upravljajte profilom, obaveštenjima i omiljenim oglasima.
        </p>
      </div>

      <div className="card border border-[var(--line)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Status prijave za prodavca</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
            {sellerStatus !== 'APPROVED' && (
              <Link
                href="/sell"
                className="inline-flex items-center rounded-md border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--brand)] transition hover:bg-[var(--line)]"
              >
                Uredi prijavu
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="card group relative p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand)]/40"
          >
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {href === '/account/profile'
                ? 'Lični podaci i kontakt'
                : href === '/account/favorites'
                  ? 'Sačuvani oglasi'
                  : 'Sistem i chat obaveštenja'}
            </p>
            <span className="mt-3 inline-flex text-xs text-[var(--brand)] opacity-0 transition group-hover:opacity-100">
              Otvori
            </span>
            {(badgeByHref[href] ?? 0) > 0 && (
              <span className="absolute right-3 top-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                {badgeByHref[href]}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
