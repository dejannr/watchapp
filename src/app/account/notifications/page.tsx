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

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function NalogNotificationsPage() {
  const qc = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications-me'],
    queryFn: () => apiRequest<NotificationRow[]>('/notifications/me', 'GET', undefined, true),
  });

  const unreadCount = (notifications.data ?? []).filter((item) => !item.readAt).length;

  return (
    <div className="container">
      <div className="card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <h1 className="text-2xl font-bold">Obaveštenja</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {unreadCount > 0 ? `${unreadCount} nepročitanih obaveštenja` : 'Sve je pročitano'}
            </p>
          </div>
          <button
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm transition hover:bg-[var(--line)]"
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

        <div className="space-y-3">
          {(notifications.data ?? []).map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition ${
                item.readAt
                  ? 'border-[var(--line)] bg-[var(--card)]'
                  : 'border-[var(--brand)]/50 bg-[var(--line)]/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!item.readAt && (
                      <span className="inline-flex rounded-full bg-[var(--brand)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand)]">
                        Novo
                      </span>
                    )}
                    <p className="truncate text-xs text-[var(--muted)]">{formatWhen(item.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-base font-semibold leading-snug">{item.title}</p>
                </div>

                {!item.readAt && (
                  <button
                    className="shrink-0 rounded-md border border-[var(--line)] px-2.5 py-1 text-xs transition hover:bg-[var(--line)]"
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

              <p className="mt-2 text-sm text-[var(--muted)]">{item.message}</p>

              {item.dataJson?.chatId && (
                <div className="mt-3">
                  <Link
                    href={`/chats/${item.dataJson.chatId}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
                  >
                    Otvori razgovor <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              )}
            </div>
          ))}

          {notifications.data?.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
              Još nema obaveštenja.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
