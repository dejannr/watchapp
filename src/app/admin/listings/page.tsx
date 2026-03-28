'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

type AdministratorListingListItem = {
  id: string;
  title: string;
  status: string;
  updatedAt?: string;
  sellerId?: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type AdministratorOglasiResponse = {
  items: AdministratorListingListItem[];
  pagination: {
    page: number;
    pageCount: number;
    total: number;
  };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Na proveri',
  PUBLISHED: 'Objavljeno',
  REJECTED: 'Odbijeno',
  HIDDEN: 'Sakriveno',
  SOLD: 'Prodato',
  ARCHIVED: 'Arhivirano',
  DRAFT: 'Nacrt',
};

const STATUS_BADGES: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  HIDDEN: 'bg-neutral-200 text-neutral-800 border-neutral-300',
  SOLD: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ARCHIVED: 'bg-zinc-200 text-zinc-800 border-zinc-300',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
};

function AdministratorOglasiPageContent() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'PENDING_REVIEW';
  const sellerId = searchParams.get('sellerId') ?? '';
  const brandId = searchParams.get('brandId') ?? '';
  const createdFrom = searchParams.get('createdFrom') ?? '';
  const page = Number(searchParams.get('page') ?? '1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const listings = useQuery({
    queryKey: ['admin-listings', status, sellerId, brandId, createdFrom, page],
    queryFn: () =>
      apiRequest<AdministratorOglasiResponse>(
        `/admin/listings?status=${encodeURIComponent(status)}&sellerId=${encodeURIComponent(sellerId)}&brandId=${encodeURIComponent(brandId)}&createdFrom=${encodeURIComponent(createdFrom)}&page=${page}&pageSize=12`,
        'GET',
        undefined,
        true,
        { suppressLoadingIndicator: true },
      ),
    staleTime: 30_000,
  });

  const moderate = async (id: string, action: 'approve' | 'reject' | 'hide' | 'restore' | 'mark-sold') => {
    setError('');
    setSuccess('');
    setActiveAction(`${id}:${action}`);
    try {
      await apiRequest(`/admin/listings/${id}/${action}`, 'POST', {}, true, {
        suppressLoadingIndicator: true,
      });
      const nextStatus =
        action === 'approve' || action === 'restore'
          ? 'PUBLISHED'
          : action === 'reject'
            ? 'REJECTED'
            : action === 'hide'
              ? 'HIDDEN'
              : 'SOLD';
      qc.setQueryData<AdministratorOglasiResponse>(
        ['admin-listings', status, sellerId, brandId, createdFrom, page],
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((item) =>
                  item.id === id ? { ...item, status: nextStatus } : item,
                ),
              }
            : prev,
      );
      setSuccess(`Akcija ${action} je uspešna.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Akcija ${action} nad oglasom nije uspela`);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="container">
      <div className="card p-5 sm:p-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Moderacija oglasa</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pregledajte oglase, filtrirajte rezultate i brzo izvršite administrativne akcije.
          </p>
        </div>
        <form
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const params = new URLSearchParams();
            for (const key of ['status', 'sellerId', 'brandId', 'createdFrom']) {
              const val = String(fd.get(key) || '').trim();
              if (val) params.set(key, val);
            }
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border border-[var(--line)] bg-white p-2 text-sm"
          >
            <option value="">Svi statusi</option>
            <option value="PENDING_REVIEW">Na čekanju provere</option>
            <option value="PUBLISHED">Objavljeno</option>
            <option value="REJECTED">Odbijeno</option>
            <option value="HIDDEN">Sakriveno</option>
            <option value="SOLD">Prodato</option>
            <option value="ARCHIVED">Arhivirano</option>
            <option value="DRAFT">Nacrt</option>
          </select>
          <input
            name="sellerId"
            defaultValue={sellerId}
            className="rounded-md border border-[var(--line)] bg-white p-2 text-sm"
            placeholder="Prodavac ID"
          />
          <input
            name="brandId"
            defaultValue={brandId}
            className="rounded-md border border-[var(--line)] bg-white p-2 text-sm"
            placeholder="Brend ID"
          />
          <input
            name="createdFrom"
            defaultValue={createdFrom}
            className="rounded-md border border-[var(--line)] bg-white p-2 text-sm"
            placeholder="Kreirano od (GGGG-MM-DD)"
          />
          <div className="flex gap-2">
            <button className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white" type="submit">
              Primeni
            </button>
            <button
              className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
              type="button"
              onClick={() => router.push(pathname)}
            >
              Obriši
            </button>
          </div>
        </form>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Ukupno</p>
            <p className="mt-1 text-xl font-semibold">{listings.data?.pagination?.total ?? 0}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Stranica</p>
            <p className="mt-1 text-xl font-semibold">
              {listings.data?.pagination?.page ?? page}/{listings.data?.pagination?.pageCount ?? 1}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Filter status</p>
            <p className="mt-1 text-xl font-semibold">{status ? (STATUS_LABELS[status] ?? status) : 'Svi'}</p>
          </div>
        </div>
        {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
        <div className="mt-4 space-y-3">
          {(listings.data?.items ?? []).map((listing) => (
            <div key={listing.id} className="rounded-xl border border-[var(--line)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold">{listing.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGES[listing.status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </span>
                    {listing.updatedAt && (
                      <span className="text-xs text-[var(--muted)]">
                        Ažurirano: {new Date(listing.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/admin/listings/${listing.id}`}
                  className="shrink-0 rounded-md border border-[var(--line)] px-2 py-1 text-xs font-medium text-[var(--brand)]"
                >
                  Otvori detalje
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 font-medium disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'approve')}
                >
                  {activeAction === `${listing.id}:approve` ? 'Odobravanje...' : 'Odobri'}
                </button>
                <button
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 font-medium disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'reject')}
                >
                  {activeAction === `${listing.id}:reject` ? 'Odbijanje...' : 'Odbij'}
                </button>
                <button
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 font-medium disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'hide')}
                >
                  {activeAction === `${listing.id}:hide` ? 'Sakrivanje...' : 'Sakrij'}
                </button>
                <button
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 font-medium disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'restore')}
                >
                  {activeAction === `${listing.id}:restore` ? 'Vraćanje...' : 'Vrati'}
                </button>
                <button
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 font-medium disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'mark-sold')}
                >
                  {activeAction === `${listing.id}:mark-sold` ? 'Ažuriranje...' : 'Označi kao prodato'}
                </button>
              </div>
            </div>
          ))}
          {!listings.isLoading && (listings.data?.items?.length ?? 0) === 0 && (
            <div className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
              Nema oglasa za izabrane filtere.
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm">
          <p className="text-[var(--muted)]">
            Ukupno: {listings.data?.pagination?.total ?? 0}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-[var(--line)] px-3 py-1.5 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(Math.max(1, page - 1)));
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              Prethodna
            </button>
            <button
              className="rounded-md border border-[var(--line)] px-3 py-1.5 disabled:opacity-50"
              disabled={page >= (listings.data?.pagination?.pageCount ?? 1)}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page + 1));
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              Sledeća
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdministratorOglasiPage() {
  return (
    <Suspense fallback={<div className="container">Učitavanje...</div>}>
      <AdministratorOglasiPageContent />
    </Suspense>
  );
}
