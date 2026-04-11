'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { LoadingCard } from '@/components/loading-card';
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
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
  seller?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
  saleProposal?: {
    id: string;
    proposerId: string;
    message?: string | null;
    proposedPriceAmount?: number | null;
    proposedCurrency?: string | null;
    proposerAcceptedAt?: string | null;
    counterpartyAcceptedAt?: string | null;
    acceptedAt?: string | null;
    soldMarkedAt?: string | null;
    reviews?: Array<{
      id: string;
      rating: number;
      comment?: string | null;
      reviewerId: string;
      revieweeId: string;
      reviewer?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        displayName?: string | null;
      };
    }>;
  } | null;
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
  const [proposalPrice, setProposalPrice] = useState('');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDealMenuOpen, setIsDealMenuOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
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

  const createProposal = useMutation({
    mutationFn: async () => {
      await apiRequest(
        `/chats/${chatId}/sale-proposal`,
        'POST',
        {
          proposedPriceAmount: proposalPrice.trim() ? Number(proposalPrice) : 0,
        },
        true,
      );
    },
    onSuccess: async () => {
      setProposalPrice('');
      setIsProposalModalOpen(false);
      setIsDealMenuOpen(false);
      setError('');
      await qc.invalidateQueries({ queryKey: ['chat-detail', chatId] });
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : 'Kreiranje predloga nije uspelo');
    },
  });

  const acceptProposal = useMutation({
    mutationFn: async () => {
      await apiRequest(`/chats/${chatId}/sale-proposal/accept`, 'POST', {}, true);
    },
    onSuccess: async () => {
      setError('');
      setIsDealMenuOpen(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['chat-detail', chatId] }),
        qc.invalidateQueries({ queryKey: ['chats-inbox'] }),
      ]);
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : 'Prihvatanje predloga nije uspelo');
    },
  });

  const createReview = useMutation({
    mutationFn: async () => {
      await apiRequest(
        `/chats/${chatId}/sale-proposal/review`,
        'POST',
        {
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        },
        true,
      );
    },
    onSuccess: async () => {
      setReviewComment('');
      setReviewRating(5);
      setIsReviewModalOpen(false);
      setIsDealMenuOpen(false);
      setError('');
      await qc.invalidateQueries({ queryKey: ['chat-detail', chatId] });
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : 'Slanje recenzije nije uspelo');
    },
  });

  const title = useMemo(() => chat.data?.listing?.title ?? 'Razgovor', [chat.data?.listing?.title]);
  const listingImage = useMemo(
    () => chat.data?.listingImageUrl ?? chat.data?.listing?.images?.[0]?.url ?? '',
    [chat.data?.listingImageUrl, chat.data?.listing?.images],
  );
  const counterparty = useMemo(() => {
    if (!chat.data || !currentKorisnik) {
      return { label: 'Učitavanje razgovora...', name: '', href: null as string | null };
    }
    if (currentKorisnik.id === chat.data.buyerId) {
      return {
        label: 'Prodavac',
        name: personName(chat.data.seller),
        href: chat.data.seller?.id ? `/user/${chat.data.seller.id}` : null,
      };
    }
    if (currentKorisnik.id === chat.data.sellerId) {
      return {
        label: 'Kupac',
        name: personName(chat.data.buyer),
        href: chat.data.buyer?.id ? `/user/${chat.data.buyer.id}` : null,
      };
    }
    return { label: 'Učitavanje razgovora...', name: '', href: null as string | null };
  }, [chat.data, currentKorisnik]);

  const dealView = useMemo(() => {
    const proposal = chat.data?.saleProposal;
    const me = currentKorisnik?.id ?? '';
    if (!proposal) {
      return {
        exists: false,
        canCreate: Boolean(me),
      };
    }
    const isProposer = proposal.proposerId === me;
    const acceptedByBoth = Boolean(proposal.acceptedAt);
    const myReview = (proposal.reviews ?? []).find((row) => row.reviewerId === me);
    return {
      exists: true,
      proposal,
      isProposer,
      acceptedByBoth,
      reviewCount: proposal.reviews?.length ?? 0,
      canAccept: Boolean(me && !isProposer && !acceptedByBoth),
      canReview: Boolean(me && acceptedByBoth && !myReview),
      myReview,
    };
  }, [chat.data, currentKorisnik]);

  const dealBadge = useMemo(() => {
    if (!dealView.exists) return { count: 0, statusText: 'Nema aktivnog predloga.' };
    let count = 0;
    if (dealView.canAccept) count += 1;
    if (dealView.canReview) count += 1;
    const statusText = dealView.canAccept
      ? 'Čeka tvoju potvrdu.'
      : dealView.canReview
        ? 'Možeš ostaviti recenziju.'
        : dealView.acceptedByBoth
          ? 'Dogovor potvrđen.'
          : 'Čeka potvrdu druge strane.';
    return { count, statusText };
  }, [dealView]);

  if (chat.isLoading && !chat.data) {
    return (
      <div className="container py-3">
        <LoadingCard message="Učitavanje razgovora..." />
      </div>
    );
  }

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
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="min-w-0">
                {chat.data?.listing?.slug ? (
                  <Link
                    href={`/listing/${chat.data.listing.slug}`}
                    className="group inline-flex max-w-full items-center gap-1 text-lg font-semibold hover:text-[var(--brand)]"
                  >
                    <span className="truncate decoration-1 underline-offset-2 group-hover:underline">{title}</span>
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[14px] opacity-80" aria-hidden="true" />
                  </Link>
                ) : (
                  <h1 className="truncate text-lg font-semibold">{title}</h1>
                )}
                <div className="text-xs text-[var(--muted)]">
                  {counterparty.href ? (
                    <p>
                      <span>{counterparty.label}: </span>
                      <Link href={counterparty.href} className="text-[var(--brand)] hover:underline">
                        {counterparty.name}
                      </Link>
                    </p>
                  ) : (
                    <p>
                      {counterparty.label}
                      {counterparty.name ? `: ${counterparty.name}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDealMenuOpen((v) => !v)}
                  className={`relative rounded-lg border px-2.5 py-1.5 text-sm leading-none transition ${
                    dealView.exists && dealView.acceptedByBoth
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : dealBadge.count > 0
                      ? 'border-[var(--brand)]/30 bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/15'
                      : 'border-[var(--line)] bg-[var(--card)] hover:bg-[var(--line)]'
                  }`}
                  aria-label="Opcije prodaje"
                >
                  <FontAwesomeIcon icon={faHandshake} className="text-[13px]" aria-hidden="true" />
                  {dealView.canReview ? (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-semibold text-white">
                      ★
                    </span>
                  ) : dealBadge.count > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {dealBadge.count}
                    </span>
                  ) : null}
                </button>
                {isDealMenuOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-[var(--line)] bg-[var(--card)] p-2 shadow-lg">
                    <div className="mb-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-2">
                      <p className="text-[11px] font-semibold text-[var(--text)]">Prodaja</p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">{dealBadge.statusText}</p>
                    </div>

                    {!dealView.exists && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDealMenuOpen(false);
                          setIsProposalModalOpen(true);
                        }}
                        className="w-full rounded-md bg-[var(--brand)] px-3 py-2 text-left text-xs font-semibold text-white hover:opacity-90"
                      >
                        Predloži cenu
                      </button>
                    )}

                    {dealView.exists && dealView.proposal && (
                      <div className="space-y-2">
                        <div className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-2">
                          <p className="text-[11px] text-[var(--muted)]">Status</p>
                          <p className="text-xs font-semibold">
                            {dealView.acceptedByBoth ? 'Potvrđeno' : 'Na čekanju'}
                          </p>
                          <p className="mt-1 text-xs font-semibold">
                            {dealView.proposal.proposedPriceAmount?.toLocaleString() ?? '-'} EUR
                          </p>
                        </div>

                        {dealView.canAccept && (
                          <button
                            type="button"
                            onClick={() => acceptProposal.mutate()}
                            className="w-full rounded-md bg-[var(--brand)] px-3 py-2 text-left text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={acceptProposal.isPending}
                          >
                            {acceptProposal.isPending ? 'Potvrda...' : 'Prihvati predlog'}
                          </button>
                        )}

                        {dealView.canReview && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsDealMenuOpen(false);
                              setIsReviewModalOpen(true);
                            }}
                            className="w-full rounded-md border border-[var(--line)] px-3 py-2 text-left text-xs font-medium hover:bg-[var(--line)]"
                          >
                            Ostavi recenziju
                          </button>
                        )}

                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div ref={messagesRef} className="flex-1 space-y-2 overflow-y-auto bg-[var(--bg)] p-3 sm:p-4">
          {messages.isLoading && (messages.data?.length ?? 0) === 0 && (
            <LoadingCard message="Učitavanje poruka..." />
          )}
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

      {isProposalModalOpen && !dealView.exists && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-xl">
            <h2 className="text-base font-semibold">Predloži cenu</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Unesite finalnu cenu u EUR.</p>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                createProposal.mutate();
              }}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                  EUR
                </span>
                <input
                  value={proposalPrice}
                  onChange={(e) => setProposalPrice(e.target.value)}
                  placeholder="Unesi cenu"
                  inputMode="numeric"
                  autoFocus
                  className="h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 text-sm font-medium"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-medium hover:bg-[var(--line)]"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={createProposal.isPending || !proposalPrice.trim()}
                >
                  {createProposal.isPending ? 'Slanje...' : 'Pošalji predlog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReviewModalOpen && dealView.exists && dealView.canReview && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-xl">
            <h2 className="text-base font-semibold">Ostavi recenziju</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Oceni iskustvo i napiši testimonial.</p>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                createReview.mutate();
              }}
            >
              <div>
                <p className="mb-1 text-xs font-medium text-[var(--muted)]">Ocena</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl leading-none transition ${
                        star <= reviewRating
                          ? 'text-[var(--brand)]'
                          : 'text-slate-300 hover:text-[var(--brand)]/60'
                      }`}
                      aria-label={`${star} zvezdica`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-[var(--muted)]">Testimonial</p>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Podeli kratko iskustvo (opciono)"
                  rows={4}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-medium hover:bg-[var(--line)]"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={createReview.isPending}
                >
                  {createReview.isPending ? 'Slanje...' : 'Pošalji recenziju'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
