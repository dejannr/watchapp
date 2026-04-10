'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';

type RazgovorDetail = {
  id: string;
  buyerId: string;
  sellerId: string;
  listingImageUrl?: string | null;
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
  const messagesRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages.dataUpdatedAt]);

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
  const listingImage = useMemo(
    () => chat.data?.listingImageUrl ?? chat.data?.listing?.images?.[0]?.url ?? '',
    [chat.data?.listingImageUrl, chat.data?.listing?.images],
  );
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
    <div className="container space-y-3">
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
      <div className="card flex h-[calc(100vh-185px)] min-h-[560px] flex-col overflow-hidden">
        <div className="border-b border-[var(--line)] p-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg)]">
              {listingImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listingImage} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)]">Bez slike</div>
              )}
            </div>
            <div className="min-w-0">
              {chat.data?.listing?.slug ? (
                <Link
                  href={`/listing/${chat.data.listing.slug}`}
                  className="group inline-flex max-w-full items-center gap-1 text-lg font-semibold hover:text-[var(--brand)]"
                >
                  <span className="truncate decoration-1 underline-offset-2 group-hover:underline">{title}</span>
                  <span aria-hidden="true" className="text-sm leading-none opacity-80">↗</span>
                </Link>
              ) : (
                <h1 className="truncate text-lg font-semibold">{title}</h1>
              )}
              <p className="text-xs text-[var(--muted)]">{counterpartyLine}</p>
            </div>
          </div>
        </div>

        <div ref={messagesRef} className="flex-1 space-y-2 overflow-y-auto bg-[var(--bg)] p-3 sm:p-4">
          {(messages.data ?? []).map((msg) => {
            const mine = currentKorisnik?.id === msg.senderId;
            return (
              <div
                key={msg.id}
                className={`max-w-[82%] rounded-2xl border border-[var(--line)] p-2.5 text-sm ${mine ? 'ml-auto bg-[var(--line)]' : 'bg-[var(--card)]'}`}
              >
                <p className="text-xs text-[var(--muted)]">{mine ? 'Vi' : personName(msg.sender)}</p>
                <p>{msg.body}</p>
              </div>
            );
          })}
          {messages.isLoading && <p className="text-sm text-[var(--muted)]">Učitavanje poruka...</p>}
        </div>

        <div className="border-t border-[var(--line)] bg-[var(--card)] p-3">
          {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
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
    </div>
  );
}
