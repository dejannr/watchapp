'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
  dataJson?: {
    chatId?: string;
  } | null;
};

export default function NalogNotificationsPage() {
  const qc = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications-me'],
    queryFn: () => apiRequest<NotificationRow[]>('/notifications/me', 'GET', undefined, true),
  });

  return (
    <div className="container">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Obaveštenja</h1>
          <button
            className="rounded border border-[var(--line)] px-3 py-1 text-sm"
            onClick={async () => {
              await apiRequest('/notifications/me/read-all', 'POST', {}, true);
              await notifications.refetch();
              await Promise.all([
                qc.invalidateQueries({ queryKey: ['notifications-unread'] }),
                qc.invalidateQueries({ queryKey: ['account-count-notifications-unread'] }),
              ]);
            }}
          >
            Označi sve kao pročitano
          </button>
        </div>
        <div className="space-y-2">
          {(notifications.data ?? []).map((item) => (
            <div key={item.id} className="rounded border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{item.title}</p>
                {!item.readAt && (
                  <button
                    className="rounded border border-[var(--line)] px-2 py-0.5 text-xs"
                    onClick={async () => {
                      await apiRequest(`/notifications/${item.id}/read`, 'POST', {}, true);
                      await notifications.refetch();
                      await Promise.all([
                        qc.invalidateQueries({ queryKey: ['notifications-unread'] }),
                        qc.invalidateQueries({ queryKey: ['account-count-notifications-unread'] }),
                      ]);
                    }}
                  >
                    Označi kao pročitano
                  </button>
                )}
              </div>
              <p className="text-sm text-[var(--muted)]">{item.message}</p>
              {item.dataJson?.chatId && (
                <Link href={`/chats/${item.dataJson.chatId}`} className="text-xs text-[var(--brand)]">
                  Otvori razgovor
                </Link>
              )}
              <p className="mt-1 text-xs text-[var(--muted)]">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {notifications.data?.length === 0 && (
            <p className="text-sm text-[var(--muted)]">Još nema obaveštenja.</p>
          )}
        </div>
      </div>
    </div>
  );
}
