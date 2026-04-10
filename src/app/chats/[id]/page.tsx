'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';

type RazgovorDetail = {
  id: string;
  buyerId: string;
  sellerId: string;
  listing?: { title?: string; slug?: string; images?: Array<{ url: string }> };
  inquiry?: { id: string; status: string };
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
};

type RazgovorMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
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

export default function RazgovorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: chatId } = use(params);
  const qc = useQueryClient();
  const { data: currentKorisnik } = useCurrentUser();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const chat = useQuery({
    queryKey: ['chat-detail', chatId],
    queryFn: () => apiRequest<RazgovorDetail>(`/chats/${chatId}`, 'GET', undefined, true),
  });

  const messages = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => apiRequest<RazgovorMessage[]>(`/chats/${chatId}/messages`, 'GET', undefined, true),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!messages.data) return;
    void Promise.all([
      qc.invalidateQueries({ queryKey: ['chats-inbox'] }),
      qc.invalidateQueries({ queryKey: ['chats-unread'] }),
    ]);
  }, [messages.dataUpdatedAt, messages.data, qc]);

  const send = useMutation({
    mutationFn: async () => {
      const text = body.trim();
      if (!text) return;
      await apiRequest(`/chats/${chatId}/messages`, 'POST', { body: text }, true);
    },
    onSuccess: async () => {
      setBody('');
      setError('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['chat-messages', chatId] }),
        qc.invalidateQueries({ queryKey: ['chats-inbox'] }),
        qc.invalidateQueries({ queryKey: ['chats-unread'] }),
      ]);
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : 'Slanje poruke nije uspelo');
    },
  });

  const title = useMemo(() => chat.data?.listing?.title ?? 'Razgovor', [chat.data?.listing?.title]);
  const listingImage = useMemo(() => chat.data?.listing?.images?.[0]?.url ?? '', [chat.data?.listing?.images]);
  const counterpartyLine = useMemo(() => {
    if (!chat.data || !currentKorisnik) return 'Učitavanje razgovora...';
    if (currentKorisnik.id === chat.data.buyerId) {
      return `Prodavac: ${personName(chat.data.seller)}`;
    }
    if (currentKorisnik.id === chat.data.sellerId) {
      return `Kupac: ${personName(chat.data.buyer)}`;
    }
    return 'Učitavanje razgovora...';
  }, [chat.data, currentKorisnik]);

  return (
    <div className="container space-y-4">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Link
          href="/chats"
          className="inline-flex items-center gap-1 font-medium transition hover:text-[var(--text)]"
        >
          <span aria-hidden="true">‹</span>
          Razgovori
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate">Detalji razgovora</span>
      </div>
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            {listingImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listingImage} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)]">Bez slike</div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{title}</h1>
            <p className="text-xs text-[var(--muted)]">{counterpartyLine}</p>
            {chat.data?.listing?.slug && (
              <Link href={`/listing/${chat.data.listing.slug}`} className="text-xs text-[var(--brand)] hover:underline">
                Otvori oglas
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="card space-y-3 p-3 sm:p-4">
        <div className="max-h-[58vh] space-y-2 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3">
          {(messages.data ?? []).map((msg) => {
            const mine = currentKorisnik?.id === msg.senderId;
            return (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-xl border border-[var(--line)] p-2 text-sm ${mine ? 'ml-auto bg-[var(--line)]' : 'bg-[var(--card)]'}`}
              >
                <p className="text-xs text-[var(--muted)]">{mine ? 'Vi' : personName(msg.sender)}</p>
                <p>{msg.body}</p>
              </div>
            );
          })}
          {messages.isLoading && <p className="text-sm text-[var(--muted)]">Učitavanje poruka...</p>}
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Napišite poruku..."
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2"
          />
          <button
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={send.isPending || !body.trim()}
          >
            {send.isPending ? 'Slanje...' : 'Pošalji'}
          </button>
        </form>
      </div>
    </div>
  );
}
