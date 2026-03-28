'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

type ActionType = 'approve' | 'reject' | 'hide' | 'restore' | 'mark-sold';
type ListingImage = { id: string; url: string; altText?: string | null };
type AdminListingDetail = {
  id: string;
  title: string;
  status: string;
  sellerId?: string;
  seller?: { email?: string | null };
  brand?: { name?: string | null };
  watchModel?: { name?: string | null };
  priceAmount?: number;
  currency?: string;
  condition?: string;
  referenceNumber?: string | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  publishedAt?: string | null;
  lastReviewedAt?: string | null;
  rejectionReasonCode?: string | null;
  rejectionNote?: string | null;
  description?: string | null;
  images?: ListingImage[];
};

export default function AdminListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const qc = useQueryClient();
  const { id } = use(params);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModerating, setIsModerating] = useState(false);
  const listing = useQuery({
    queryKey: ['admin-listing-detail', id],
    queryFn: () =>
      apiRequest<AdminListingDetail>(`/admin/listings/${id}`, 'GET', undefined, true, {
        suppressLoadingIndicator: true,
      }),
  });

  const moderate = async (action: ActionType) => {
    setError('');
    setSuccess('');
    const note = window.prompt('Admin note (optional):') || undefined;
    setIsModerating(true);
    try {
      await apiRequest(`/admin/listings/${id}/${action}`, 'POST', { note }, true, {
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
      qc.setQueryData(['admin-listing-detail', id], (prev: unknown) =>
        prev && typeof prev === 'object' ? { ...(prev as Record<string, unknown>), status: nextStatus } : prev,
      );
      setSuccess(`Listing ${action} successful.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Failed to ${action} listing`);
    } finally {
      setIsModerating(false);
    }
  };

  const data = listing.data;
  const images = Array.isArray(data?.images) ? data.images : [];

  return (
    <div className="container space-y-4">
      <Link href="/admin/listings" className="text-sm text-[var(--brand)]">
        Back to moderation queue
      </Link>
      <div className="card space-y-4 p-5">
        <h1 className="text-2xl font-bold">Listing Detail</h1>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        {data && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Title:</span> {data.title}</p>
                <p><span className="font-semibold">Status:</span> {data.status}</p>
                <p><span className="font-semibold">Seller:</span> {data.seller?.email} ({data.sellerId})</p>
                <p><span className="font-semibold">Brand/Model:</span> {data.brand?.name} / {data.watchModel?.name || '-'}</p>
                <p><span className="font-semibold">Price:</span> {data.priceAmount} {data.currency}</p>
                <p><span className="font-semibold">Condition:</span> {data.condition}</p>
                <p><span className="font-semibold">Reference:</span> {data.referenceNumber || '-'}</p>
                <p><span className="font-semibold">Location:</span> {[data.locationCity, data.locationCountry].filter(Boolean).join(', ') || '-'}</p>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Published At:</span> {data.publishedAt ? new Date(data.publishedAt).toLocaleString() : '-'}</p>
                <p><span className="font-semibold">Last Reviewed At:</span> {data.lastReviewedAt ? new Date(data.lastReviewedAt).toLocaleString() : '-'}</p>
                <p><span className="font-semibold">Rejection Reason:</span> {data.rejectionReasonCode || '-'}</p>
                <p><span className="font-semibold">Rejection Note:</span> {data.rejectionNote || '-'}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-semibold">Description</p>
              <p className="rounded border border-[var(--line)] p-3 text-sm text-[var(--muted)]">{data.description}</p>
            </div>

            <div>
              <p className="mb-2 font-semibold">Images ({images.length})</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt={img.altText || data.title} className="h-40 w-full rounded border object-cover" />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2 text-sm">
          <button
            className="rounded border px-3 py-1.5 disabled:opacity-60"
            disabled={isModerating}
            onClick={() => void moderate('approve')}
          >
            {isModerating ? 'Working...' : 'Approve'}
          </button>
          <button className="rounded border px-3 py-1.5 disabled:opacity-60" disabled={isModerating} onClick={() => void moderate('reject')}>Reject</button>
          <button className="rounded border px-3 py-1.5 disabled:opacity-60" disabled={isModerating} onClick={() => void moderate('hide')}>Hide</button>
          <button className="rounded border px-3 py-1.5 disabled:opacity-60" disabled={isModerating} onClick={() => void moderate('restore')}>Restore</button>
          <button className="rounded border px-3 py-1.5 disabled:opacity-60" disabled={isModerating} onClick={() => void moderate('mark-sold')}>Mark Sold</button>
        </div>
      </div>
    </div>
  );
}
