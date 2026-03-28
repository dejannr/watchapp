'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

type ActionType = 'approve' | 'reject' | 'hide' | 'restore' | 'mark-sold';

export default function AdminListingDetailPage({ params }: { params: { id: string } }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const listing = useQuery({
    queryKey: ['admin-listing-detail', params.id],
    queryFn: () => apiRequest<any>(`/admin/listings/${params.id}`, 'GET', undefined, true),
  });

  const moderate = async (action: ActionType) => {
    setError('');
    setSuccess('');
    const note = window.prompt('Admin note (optional):') || undefined;
    try {
      await apiRequest(`/admin/listings/${params.id}/${action}`, 'POST', { note }, true);
      setSuccess(`Listing ${action} successful.`);
      await listing.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Failed to ${action} listing`);
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
                {images.map((img: any) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt={img.altText || data.title} className="h-40 w-full rounded border object-cover" />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2 text-sm">
          <button className="rounded border px-3 py-1.5" onClick={() => void moderate('approve')}>Approve</button>
          <button className="rounded border px-3 py-1.5" onClick={() => void moderate('reject')}>Reject</button>
          <button className="rounded border px-3 py-1.5" onClick={() => void moderate('hide')}>Hide</button>
          <button className="rounded border px-3 py-1.5" onClick={() => void moderate('restore')}>Restore</button>
          <button className="rounded border px-3 py-1.5" onClick={() => void moderate('mark-sold')}>Mark Sold</button>
        </div>
      </div>
    </div>
  );
}
