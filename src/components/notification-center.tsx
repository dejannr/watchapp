'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  dataJson?: {
    chatId?: string;
  } | null;
};

export function NotificationCenter({ compact = false }: { compact?: boolean }) {
  const notifications = useQuery({
    queryKey: ['notifications-center', compact],
    queryFn: () => apiRequest<NotificationRow[]>('/notifications/me', 'GET', undefined, true),
  });

  const items = (notifications.data ?? []).slice(0, compact ? 5 : 12);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Notifications</h2>
        <Link href="/account/notifications" className="text-sm text-[var(--brand)]">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-[var(--line)] p-2">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-[var(--muted)]">{item.message}</p>
            {item.dataJson?.chatId && (
              <Link href={`/chats/${item.dataJson.chatId}`} className="text-xs text-[var(--brand)]">
                Open chat
              </Link>
            )}
            <p className="mt-1 text-xs text-[var(--muted)]">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-[var(--muted)]">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
