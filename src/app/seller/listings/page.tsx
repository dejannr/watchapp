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
  images?: Array<{ url: string }>;
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

const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  ALL: 'Svi statusi',
  DRAFT: 'Nacrt',
  PENDING_REVIEW: 'Na proveri',
  PUBLISHED: 'Aktivan',
  REJECTED: 'Odbijen',
  ARCHIVED: 'Arhiviran',
  SOLD: 'Prodat',
  HIDDEN: 'Sakriven',
};

const STATUS_BADGE_CLASS: Record<ProdavacListing['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  ARCHIVED: 'bg-zinc-200 text-zinc-800 border-zinc-300',
  SOLD: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  HIDDEN: 'bg-neutral-200 text-neutral-800 border-neutral-300',
};

export default function ProdavacOglasiPage() {
  const qc = useQueryClient();
  const notify = useNotify();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('ALL');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const listings = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () =>
      apiRequest<ProdavacListing[]>('/seller/listings', 'GET', undefined, true, {
        suppressLoadingIndicator: true,
      }),
  });

  const getNextStatus = (
    op: 'submit' | 'archive' | 'unarchive' | 'sold' | 'relist' | 'delete',
  ) => {
    if (op === 'submit') return 'PENDING_REVIEW' as const;
    if (op === 'archive') return 'ARCHIVED' as const;
    if (op === 'unarchive') return 'DRAFT' as const;
    if (op === 'sold') return 'SOLD' as const;
    if (op === 'relist') return 'PUBLISHED' as const;
    return null;
  };

  const action = useMutation({
    mutationFn: async ({
      listingId,
      op,
    }: {
      listingId: string;
      op: 'submit' | 'archive' | 'unarchive' | 'sold' | 'relist' | 'delete';
    }) => {
      if (op === 'delete') {
        await apiRequest(`/seller/listings/${listingId}`, 'DELETE', undefined, true, {
          suppressLoadingIndicator: true,
          suppressErrorToast: true,
        });
        return;
      }
      const path =
        op === 'submit'
          ? `/seller/listings/${listingId}/submit`
          : op === 'archive'
            ? `/seller/listings/${listingId}/archive`
            : op === 'unarchive'
              ? `/seller/listings/${listingId}/unarchive`
              : op === 'relist'
                ? `/seller/listings/${listingId}/mark-available`
                : `/seller/listings/${listingId}/mark-sold`;
      await apiRequest(path, 'POST', {}, true, {
        suppressLoadingIndicator: true,
        suppressErrorToast: true,
      });
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['seller-listings'] });
      const previous = qc.getQueryData<ProdavacListing[]>(['seller-listings']) ?? [];

      qc.setQueryData<ProdavacListing[]>(
        ['seller-listings'],
        (current) => {
          const rows = current ?? [];
          if (vars.op === 'delete') {
            return rows.filter((row) => row.id !== vars.listingId);
          }
          const nextStatus = getNextStatus(vars.op);
          if (!nextStatus) return rows;
          return rows.map((row) =>
            row.id === vars.listingId
              ? { ...row, status: nextStatus, updatedAt: new Date().toISOString() }
              : row,
          );
        },
      );

      return { previous };
    },
    onSuccess: (_, vars) => {
      notify.success(
        vars.op === 'submit'
          ? 'Oglas je poslat na proveru.'
          : vars.op === 'archive'
            ? 'Oglas je arhiviran.'
            : vars.op === 'unarchive'
              ? 'Oglas je vraćen u nacrt.'
              : vars.op === 'sold'
                ? 'Oglas je označen kao prodat.'
                : vars.op === 'relist'
                  ? 'Oglas je ponovo aktivan.'
                : 'Oglas je obrisan.',
      );
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['seller-listings'], ctx.previous);
      }
      const msg = e instanceof ApiError ? e.message : 'Akcija nije uspela';
      notify.error(msg);
    },
    onSettled: () => {
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
    op: 'submit' | 'archive' | 'unarchive' | 'sold' | 'relist' | 'delete',
  ) => {
    if (op === 'delete') {
      const ok = window.confirm('Obrisati ovaj oglas trajno?');
      if (!ok) return;
    }
    setActiveAction(`${listingId}:${op}`);
    action.mutate({ listingId, op });
  };

  return (
    <div className="container">
      <div className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Moji oglasi</h1>
            <p className="text-sm text-[var(--muted)]">Upravljajte statusima i objavama na jednom mestu.</p>
          </div>
          <Link
            href="/seller-dashboard/listings/new"
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white"
          >
            Novi oglas
          </Link>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Ukupno</p>
            <p className="mt-1 text-xl font-semibold">{listings.data?.length ?? 0}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Aktivni</p>
            <p className="mt-1 text-xl font-semibold">
              {listings.data?.filter((row) => row.status === 'PUBLISHED').length ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Prodati</p>
            <p className="mt-1 text-xl font-semibold">
              {listings.data?.filter((row) => row.status === 'SOLD').length ?? 0}
            </p>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-[var(--muted)]" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {items.map((listing) => {
            const busy = activeAction?.startsWith(`${listing.id}:`) || false;
            const firstImage = listing.images?.[0]?.url;
            const canSubmit = listing.status === 'DRAFT' || listing.status === 'REJECTED';
            const canArhiviraj =
              listing.status === 'PUBLISHED' || listing.status === 'PENDING_REVIEW';
            const canUnarchive = listing.status === 'ARCHIVED';
            const canMarkSold =
              listing.status === 'PUBLISHED' || listing.status === 'ARCHIVED';
            const canRelist = listing.status === 'SOLD';
            return (
              <div key={listing.id} className="rounded-xl border border-[var(--line)] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-soft)]">
                    {firstImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstImage} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)]">
                        Bez slike
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold leading-tight">{listing.title}</p>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[listing.status]}`}
                      >
                        {STATUS_LABELS[listing.status]}
                      </span>
                      {listing.updatedAt && (
                        <p className="text-xs text-[var(--muted)]">
                          Ažurirano {new Date(listing.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/seller-dashboard/listings/${listing.id}`}
                        className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-medium text-[var(--brand)]"
                      >
                        Izmeni
                      </Link>
                      {listing.status === 'PUBLISHED' && (
                        <Link
                          href={`/listing/${listing.slug}`}
                          className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-medium text-[var(--brand)]"
                        >
                          Javna stranica
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canSubmit && (
                    <button
                      className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'submit')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:submit` ? 'Slanje...' : 'Pošalji na proveru'}
                    </button>
                  )}
                  {canArhiviraj && (
                    <button
                      className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'archive')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:archive` ? 'Arhiviranje...' : 'Arhiviraj'}
                    </button>
                  )}
                  {canUnarchive && (
                    <button
                      className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'unarchive')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:unarchive` ? 'Vraćanje...' : 'Vrati u nacrt'}
                    </button>
                  )}
                  {canMarkSold && (
                    <button
                      className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'sold')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:sold` ? 'Ažuriranje...' : 'Označi kao prodato'}
                    </button>
                  )}
                  {canRelist && (
                    <button
                      className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--brand)] disabled:opacity-60"
                      onClick={() => void runAction(listing.id, 'relist')}
                      disabled={busy}
                    >
                      {activeAction === `${listing.id}:relist` ? 'Ažuriranje...' : 'Vrati u prodaju'}
                    </button>
                  )}
                  <button
                    className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] disabled:opacity-60"
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
                : `Nema oglasa sa statusom "${STATUS_LABELS[statusFilter]}".`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
