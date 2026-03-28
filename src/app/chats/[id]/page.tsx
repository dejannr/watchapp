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
  listing?: { title?: string; slug?: string };
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
      <Link href="/chats" className="text-sm text-[var(--brand)]">Nazad na razgovore</Link>
      <div className="card p-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-xs text-[var(--muted)]">{counterpartyLine}</p>
      </div>
      <div className="card space-y-3 p-4">
        <div className="max-h-[55vh] space-y-2 overflow-auto pr-1">
          {(messages.data ?? []).map((msg) => {
            const mine = currentKorisnik?.id === msg.senderId;
            return (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded border p-2 text-sm ${mine ? 'ml-auto bg-stone-100' : 'bg-white'}`}
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
            className="w-full rounded border px-3 py-2"
          />
          <button
            className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={send.isPending || !body.trim()}
          >
            {send.isPending ? 'Slanje...' : 'Pošalji'}
          </button>
        </form>
      </div>
    </div>
  );
}
