'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LoadingCard } from '@/components/loading-card';
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
  saleProposal?: {
    id: string;
    proposerId: string;
    acceptedAt?: string | null;
    proposedPriceAmount?: number | null;
    proposedCurrency?: string | null;
    reviews?: Array<{ reviewerId: string }>;
  } | null;
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
        {chats.isLoading && <LoadingCard message="Učitavanje razgovora..." />}
        {!chats.isLoading && (chats.data ?? []).length === 0 && (
          <p className="text-sm text-[var(--muted)]">Još nema razgovora. Počnite slanjem upita na oglasu.</p>
        )}
        <div className="space-y-2">
          {(chats.data ?? []).map((chat) => {
            const isKupac = currentKorisnik?.id === chat.buyerId;
            const counterparty = isKupac
              ? `Prodavac: ${personName(chat.seller)}`
              : `Kupac: ${personName(chat.buyer)}`;
            const proposal = chat.saleProposal;
            const myId = currentKorisnik?.id ?? '';
            const myReviewDone = Boolean(proposal?.reviews?.some((row) => row.reviewerId === myId));
            const saleStatus = !proposal
              ? null
              : !proposal.acceptedAt
                ? proposal.proposerId === myId
                  ? { label: 'Čeka potvrdu', textClass: 'text-amber-700', dotClass: 'bg-amber-500' }
                  : { label: 'Čeka tvoju potvrdu', textClass: 'text-rose-700', dotClass: 'bg-rose-500' }
                : myReviewDone
                  ? { label: 'Prodato', textClass: 'text-emerald-700', dotClass: 'bg-emerald-500' }
                  : { label: 'Čeka recenziju', textClass: 'text-blue-700', dotClass: 'bg-blue-500' };
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
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold">{chat.listing?.title ?? 'Razgovor o oglasu'}</p>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <p className="text-[var(--muted)]">{counterparty}</p>
                      {saleStatus && (
                        <span className={`inline-flex items-center gap-1 ${saleStatus.textClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${saleStatus.dotClass}`} />
                          {saleStatus.label}
                        </span>
                      )}
                    </div>
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
