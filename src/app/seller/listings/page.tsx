'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotify } from '@/components/notifications-provider';
import { ApiError, apiRequest } from '@/lib/api';

type ProdavacListing = {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'SOLD' | 'HIDDEN';
  updatedAt?: string;
  createdAt?: string;
};

const STATUS_OPTIONS = [
  'ALL',
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
  'SOLD',
  'HIDDEN',
] as const;

export default function ProdavacOglasiPage() {
  const qc = useQueryClient();
  const notify = useNotify();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('ALL');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const listings = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => apiRequest<ProdavacListing[]>('/seller/listings', 'GET', undefined, true),
  });

  const action = useMutation({
    mutationFn: async ({
      listingId,
      op,
    }: {
      listingId: string;
      op: 'submit' | 'archive' | 'unarchive' | 'sold' | 'delete';
    }) => {
      if (op === 'delete') {
        await apiRequest(`/seller/listings/${listingId}`, 'DELETE', undefined, true);
        return;
      }
      const path =
        op === 'submit'
          ? `/seller/listings/${listingId}/submit`
          : op === 'archive'
            ? `/seller/listings/${listingId}/archive`
            : op === 'unarchive'
              ? `/seller/listings/${listingId}/unarchive`
              : `/seller/listings/${listingId}/mark-sold`;
      await apiRequest(path, 'POST', {}, true);
    },
    onSuccess: async (_, vars) => {
      notify.success(
        vars.op === 'submit'
          ? 'Oglas je poslat na proveru.'
          : vars.op === 'archive'
            ? 'Oglas je arhiviran.'
            : vars.op === 'unarchive'
              ? 'Oglas je vraćen u nacrt.'
              : vars.op === 'sold'
                ? 'Oglas je označen kao prodat.'
                : 'Oglas je obrisan.',
      );
      setActiveAction(null);
      await qc.invalidateQueries({ queryKey: ['seller-listings'] });
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : 'Akcija nije uspela';
      notify.error(msg);
      setActiveAction(null);
    },
  });

  const items = useMemo(() => {
    const all = listings.data ?? [];
    if (statusFilter === 'ALL') return all;
    return all.filter((row) => row.status === statusFilter);
  }, [listings.data, statusFilter]);

  const runAction = async (
    listingId: string,
    op: 'submit' | 'archive' | 'unarchive' | 'sold' | 'delete',
  ) => {
    if (op === 'delete') {
      const ok = window.confirm('Obrisati ovaj oglas trajno?');
      if (!ok) return;
    }
    setActiveAction(`${listingId}:${op}`);
    await action.mutateAsync({ listingId, op });
  };

  return (
    <div className="container">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Moji oglasi</h1>
          <Link href="/seller-dashboard/listings/new" className="rounded bg-[var(--brand)] px-3 py-2 text-white">
            Novi oglas
          </Link>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm text-[var(--muted)]" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            className="rounded border border-[var(--line)] p-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          {items.map((listing) => {
            const busy = activeAction?.startsWith(`${listing.id}:`) || false;
            const canSubmit = listing.status === 'DRAFT' || listing.status === 'REJECTED';
            const canArhiviraj =
              listing.status === 'PUBLISHED' || listing.status === 'PENDING_REVIEW';
            const canUnarchive = listing.status === 'ARCHIVED';
            const canMarkSold =
              listing.status === 'PUBLISHED' || listing.status === 'ARCHIVED';
            return (
              <div key={listing.id} className="rounded border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{listing.title}</p>
                    <p className="text-sm text-[var(--muted)]">{listing.status}</p>
                    {listing.updatedAt && (
                      <p className="text-xs text-[var(--muted)]">
                        Ažurirano {new Date(listing.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link href={`/seller-dashboard/listings/${listing.id}`} className="text-sm text-[var(--brand)]">
                      Izmeni
                    </Link>
                    {listing.status === 'PUBLISHED' && (
                      <Link href={`/listing/${listing.slug}`} className="text-sm text-[var(--brand)]">
                        Javna stranica
                      </Link>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canSubmit && (
                    <button
                      className="rounded border border-[var(--line)] px-2 py-1 text-xs disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'submit')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:submit` ? 'Slanje...' : 'Pošalji na proveru'}
                    </button>
                  )}
                  {canArhiviraj && (
                    <button
                      className="rounded border border-[var(--line)] px-2 py-1 text-xs disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'archive')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:archive` ? 'Arhiviranje...' : 'Arhiviraj'}
                    </button>
                  )}
                  {canUnarchive && (
                    <button
                      className="rounded border border-[var(--line)] px-2 py-1 text-xs disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'unarchive')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:unarchive` ? 'Vraćanje...' : 'Vrati u nacrt'}
                    </button>
                  )}
                  {canMarkSold && (
                    <button
                      className="rounded border border-[var(--line)] px-2 py-1 text-xs disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'sold')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:sold` ? 'Ažuriranje...' : 'Označi kao prodato'}
                    </button>
                  )}
                  <button
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-60"
                    onClick={() => void runAction(listing.id, 'delete')}
                    disabled={busy}
                  >
                    {activeAction === `${listing.id}:delete` ? 'Brisanje...' : 'Obriši'}
                  </button>
                </div>
              </div>
            );
          })}
          {!listings.isLoading && items.length === 0 && (
            <div className="rounded border border-dashed p-4 text-sm text-[var(--muted)]">
              {statusFilter === 'ALL'
                ? 'Još nema oglasa. Kreirajte svoj prvi oglas.'
                : `Nema oglasa sa statusom ${statusFilter}.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
