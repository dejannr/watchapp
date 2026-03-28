'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useNotify } from '@/components/notifications-provider';
import { apiRequest } from '@/lib/api';
import { clearAccessToken } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/use-current-user';

export function TopNav() {
  const router = useRouter();
  const notify = useNotify();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: user } = useCurrentUser();
  const loggedIn = Boolean(user);
  const unread = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: () => apiRequest<{ unread: number }>('/notifications/me/unread-count', 'GET', undefined, true),
    enabled: loggedIn,
    refetchInterval: 5_000,
  });
  const chatUnread = useQuery({
    queryKey: ['chats-unread', user?.id],
    queryFn: () => apiRequest<{ unread: number }>('/chats/unread-count', 'GET', undefined, true),
    enabled: loggedIn,
    refetchInterval: 5_000,
  });

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/browse">Browse</Link>

      {!loggedIn && <Link href="/login">Login</Link>}
      {!loggedIn && <Link href="/register">Register</Link>}

      {loggedIn && user?.sellerStatus !== 'APPROVED' && <Link href="/sell">Become Seller</Link>}
      {loggedIn && user?.sellerStatus === 'APPROVED' && <Link href="/seller-dashboard">Seller</Link>}
      {loggedIn && (
        <Link href="/account" className="relative pr-1">
          Account
          {(unread.data?.unread ?? 0) > 0 && (
            <span className="absolute -right-3 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unread.data?.unread}
            </span>
          )}
        </Link>
      )}
      {loggedIn && (
        <Link href="/chats" className="relative pr-1">
          Chats
          {(chatUnread.data?.unread ?? 0) > 0 && (
            <span className="absolute -right-3 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {chatUnread.data?.unread}
            </span>
          )}
        </Link>
      )}
      {(user?.role === 'ADMIN' || user?.roles?.includes('ADMIN')) && <Link href="/admin">Admin</Link>}

      {loggedIn && (
        <>
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs">
            {user?.email} · {user?.sellerStatus}
          </span>
          <button
            className="rounded bg-[var(--brand)] px-2 py-1 text-white"
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                await apiRequest('/auth/logout', 'POST', {}, true);
              } catch {
                // no-op
              }
              clearAccessToken();
              notify.info('Logged out.');
              router.push('/login');
              router.refresh();
              setIsLoggingOut(false);
            }}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </>
      )}
    </nav>
  );
}
