'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

type AdminListingListItem = {
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

type AdminListingsResponse = {
  items: AdminListingListItem[];
  pagination: {
    page: number;
    pageCount: number;
    total: number;
  };
};

function AdminListingsPageContent() {
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
      apiRequest<AdminListingsResponse>(
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
      qc.setQueryData<AdminListingsResponse>(
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
      setSuccess(`Listing ${action} successful.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Failed to ${action} listing`);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Listing Moderation</h1>
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
            <option value="">All statuses</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
            <option value="HIDDEN">Hidden</option>
            <option value="SOLD">Sold</option>
            <option value="ARCHIVED">Archived</option>
            <option value="DRAFT">Draft</option>
          </select>
          <input
            name="sellerId"
            defaultValue={sellerId}
            className="rounded border p-2 text-sm"
            placeholder="Seller ID"
          />
          <input
            name="brandId"
            defaultValue={brandId}
            className="rounded border p-2 text-sm"
            placeholder="Brand ID"
          />
          <input
            name="createdFrom"
            defaultValue={createdFrom}
            className="rounded border p-2 text-sm"
            placeholder="Created from (YYYY-MM-DD)"
          />
          <div className="flex gap-2">
            <button className="rounded bg-[var(--brand)] px-3 py-2 text-sm text-white" type="submit">
              Apply
            </button>
            <button
              className="rounded border border-[var(--line)] px-3 py-2 text-sm"
              type="button"
              onClick={() => router.push(pathname)}
            >
              Clear
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
                Open detail
              </Link>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'approve')}
                >
                  {activeAction === `${listing.id}:approve` ? 'Approving...' : 'Approve'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'reject')}
                >
                  {activeAction === `${listing.id}:reject` ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'hide')}
                >
                  {activeAction === `${listing.id}:hide` ? 'Hiding...' : 'Hide'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'restore')}
                >
                  {activeAction === `${listing.id}:restore` ? 'Restoring...' : 'Restore'}
                </button>
                <button
                  className="rounded border px-2 py-1 disabled:opacity-60"
                  disabled={Boolean(activeAction)}
                  type="button"
                  onClick={() => void moderate(listing.id, 'mark-sold')}
                >
                  {activeAction === `${listing.id}:mark-sold` ? 'Updating...' : 'Mark Sold'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-[var(--muted)]">Total: {listings.data?.pagination?.total ?? 0}</p>
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
              Prev
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
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminListingsPage() {
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <AdminListingsPageContent />
    </Suspense>
  );
}
