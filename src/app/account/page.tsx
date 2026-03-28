'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiRequest } from '@/lib/api';

const links = [
  ['/account/profile', 'Profile'],
  ['/account/favorites', 'Favorites'],
  ['/account/notifications', 'Notifications'],
] as const;

export default function AccountPage() {
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

  return (
    <div className="container space-y-4">
      <h1 className="text-3xl font-bold">Account</h1>
      <div className="card p-4 text-sm">
        <p className="font-semibold">Seller application status</p>
        <p className="text-[var(--muted)]">Current status: {user?.sellerStatus ?? 'NONE'}</p>
        <Link href="/sell" className="mt-2 inline-block text-[var(--brand)]">
          Manage seller application
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="card relative p-4">
            {label}
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
