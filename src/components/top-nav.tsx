'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { useNotify } from '@/components/notifications-provider';
import { apiRequest } from '@/lib/api';
import { clearAccessToken, getAccessToken } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/use-current-user';

export function TopNav() {
  const qc = useQueryClient();
  const router = useRouter();
  const notify = useNotify();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { data: user } = useCurrentUser();
  const loggedIn = Boolean(user && getAccessToken());
  const displayName =
    user?.firstName && user.firstName.trim().length > 0
      ? user.firstName.trim()
      : user?.displayName && user.displayName.trim().length > 0
        ? user.displayName.trim()
        : user?.email
          ? user.email.split('@')[0]
          : 'Nalog';

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const unread = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: () =>
      apiRequest<{ unread: number }>('/notifications/me/unread-count', 'GET', undefined, true, {
        suppressLoadingIndicator: true,
        suppressErrorToast: true,
      }),
    enabled: loggedIn,
    refetchInterval: 5_000,
  });
  const chatUnread = useQuery({
    queryKey: ['chats-unread', user?.id],
    queryFn: () =>
      apiRequest<{ unread: number }>('/chats/unread-count', 'GET', undefined, true, {
        suppressLoadingIndicator: true,
        suppressErrorToast: true,
      }),
    enabled: loggedIn,
    refetchInterval: 5_000,
  });

  return (
    <nav className="flex items-center gap-4 text-sm">
      {loggedIn && <Link href="/browse">Pretraga</Link>}

      {!loggedIn && (
        <Link href="/login" className="inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="h-5 w-5" aria-hidden="true" />
          Prijavi se
        </Link>
      )}

      {loggedIn && user?.sellerStatus !== 'APPROVED' && <Link href="/sell">Postani prodavac</Link>}
      {loggedIn && user?.sellerStatus === 'APPROVED' && <Link href="/seller-dashboard">Prodavac</Link>}
      {loggedIn && (
        <Link href="/account" className="relative pr-1">
          Nalog
          {(unread.data?.unread ?? 0) > 0 && (
            <span className="absolute -right-3 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unread.data?.unread}
            </span>
          )}
        </Link>
      )}
      {loggedIn && (
        <Link href="/chats" className="relative pr-1">
          Poruke
          {(chatUnread.data?.unread ?? 0) > 0 && (
            <span className="absolute -right-3 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {chatUnread.data?.unread}
            </span>
          )}
        </Link>
      )}
      {(user?.role === 'ADMIN' || user?.roles?.includes('ADMIN')) && <Link href="/admin">Administrator</Link>}

      {loggedIn && (
        <div className="relative" ref={menuRef}>
          <button
            className="rounded-full border border-[var(--line)] px-3 py-1 text-sm"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {displayName}
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 min-w-40 rounded border border-[var(--line)] bg-[var(--card)] p-1 shadow">
              <Link
                href="/account/profile"
                className="block rounded px-3 py-2 text-sm hover:bg-[var(--line)]"
                onClick={() => setMenuOpen(false)}
              >
                Profil
              </Link>
              <button
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--line)] disabled:opacity-60"
                onClick={async () => {
                  setIsLoggingOut(true);
                  try {
                await apiRequest('/auth/logout', 'POST', {}, true);
              } catch {
                // no-op
              }
              clearAccessToken();
              qc.setQueryData(['auth-me'], null);
              qc.removeQueries({ queryKey: ['notifications-unread'] });
              qc.removeQueries({ queryKey: ['chats-unread'] });
              notify.info('Odjavljeni ste.');
              setMenuOpen(false);
              router.push('/login');
                  router.refresh();
                  setIsLoggingOut(false);
                }}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Odjavljivanje...' : 'Odjava'}
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
