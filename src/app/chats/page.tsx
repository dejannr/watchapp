'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';

type RazgovorListItem = {
  id: string;
  buyerId: string;
  sellerId: string;
  listingImageUrl?: string | null;
  listing?: { title?: string; slug?: string; images?: Array<{ url: string }> };
  inquiry?: { id: string; status: string };
  messages?: Array<{
    body: string;
    createdAt: string;
    sender?: {
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
    };
  }>;
  lastMessageAt: string;
  buyer?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
  seller?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
  unreadCount?: number;
};

function personName(person?: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
}) {
  const full = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (person?.displayName) return person.displayName;
  return 'Korisnik';
}

function formatLastMessageAt(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString();
}

export default function PorukePage() {
  const { data: currentKorisnik } = useCurrentUser();
  const chats = useQuery({
    queryKey: ['chats-inbox'],
    queryFn: () => apiRequest<RazgovorListItem[]>('/chats', 'GET', undefined, true),
    refetchInterval: 5_000,
  });

  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-bold">Poruke</h1>
      <div className="card p-3 sm:p-4">
        {chats.isLoading && <p className="text-sm text-[var(--muted)]">Učitavanje razgovora...</p>}
        {!chats.isLoading && (chats.data ?? []).length === 0 && (
          <p className="text-sm text-[var(--muted)]">Još nema razgovora. Počnite slanjem upita na oglasu.</p>
        )}
        <div className="space-y-2">
          {(chats.data ?? []).map((chat) => {
            const isKupac = currentKorisnik?.id === chat.buyerId;
            const counterparty = isKupac
              ? `Prodavac: ${personName(chat.seller)}`
              : `Kupac: ${personName(chat.buyer)}`;
            const preview = chat.messages?.[0]?.body ?? 'Još nema poruka';
            const image = chat.listingImageUrl ?? chat.listing?.images?.[0]?.url;
            return (
              <Link
                key={chat.id}
                href={`/chats/${chat.id}`}
                className="relative block rounded-xl border border-[var(--line)] p-3 transition hover:bg-[var(--line)]"
              >
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg)]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={chat.listing?.title ?? 'Oglas'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)]">Bez slike</div>
                    )}
                  </div>
                  <div className="relative min-w-0 flex-1 pr-14">
                    <p className="truncate pr-8 font-semibold">{chat.listing?.title ?? 'Razgovor o oglasu'}</p>
                    <p className="text-xs text-[var(--muted)]">{counterparty}</p>
                    <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2 pr-2">{preview}</p>
                    <p className="absolute bottom-0 right-0 text-[11px] text-[var(--muted)]">
                      {formatLastMessageAt(chat.lastMessageAt)}
                    </p>
                  </div>
                </div>
                {(chat.unreadCount ?? 0) > 0 && (
                  <span className="absolute right-3 top-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                    {chat.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
