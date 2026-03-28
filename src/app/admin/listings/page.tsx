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

function AdministratorOglasiPageContent() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? '';
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
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Moderacija oglasa</h1>
        <form
          className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
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
          <select name="status" defaultValue={status} className="rounded border p-2 text-sm">
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
            className="rounded border p-2 text-sm"
            placeholder="Prodavac ID"
          />
          <input
            name="brandId"
            defaultValue={brandId}
            className="rounded border p-2 text-sm"
            placeholder="Brend ID"
          />
          <input
            name="createdFrom"
            defaultValue={createdFrom}
            className="rounded border p-2 text-sm"
            placeholder="Kreirano od (GGGG-MM-DD)"
          />
          <div className="flex gap-2">
            <button className="rounded bg-[var(--brand)] px-3 py-2 text-sm text-white" type="submit">
              Primeni
            </button>
            <button
              className="rounded border border-[var(--line)] px-3 py-2 text-sm"
              type="button"
              onClick={() => router.push(pathname)}
            >
              Obriši
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-700">{success}</p>}
        <div className="mt-3 space-y-2">
          {(listings.data?.items ?? []).map((listing) => (
            <div key={listing.id} className="rounded border p-3">
              <p className="font-semibold">{listing.title}</p>
              <p className="text-sm text-[var(--muted)]">{listing.status}</p>
              <Link href={`/admin/listings/${listing.id}`} className="mt-1 inline-block text-xs text-[var(--brand)]">
                Otvori detalje
              </Link>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'approve')}
                >
                  {activeAction === `${listing.id}:approve` ? 'Odobravanje...' : 'Odobri'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'reject')}
                >
                  {activeAction === `${listing.id}:reject` ? 'Odbijanje...' : 'Odbij'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'hide')}
                >
                  {activeAction === `${listing.id}:hide` ? 'Sakrivanje...' : 'Sakrij'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'restore')}
                >
                  {activeAction === `${listing.id}:restore` ? 'Vraćanje...' : 'Vrati'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'mark-sold')}
                >
                  {activeAction === `${listing.id}:mark-sold` ? 'Ažuriranje...' : 'Označi kao prodato'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-[var(--muted)]">Ukupno: {listings.data?.pagination?.total ?? 0}</p>
          <div className="flex gap-2">
            <button
              className="rounded border border-[var(--line)] px-3 py-1 disabled:opacity-50"
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
              className="rounded border border-[var(--line)] px-3 py-1 disabled:opacity-50"
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
