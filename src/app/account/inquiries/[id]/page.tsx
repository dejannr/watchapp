'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

export default function AccountInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inquiry = useQuery({
    queryKey: ['buyer-inquiry-detail', id],
    queryFn: () => apiRequest<any>(`/buyer/inquiries/${id}`, 'GET', undefined, true),
  });

  const close = async () => {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/buyer/inquiries/${id}/close`, 'POST', { reason: 'Closed by buyer' }, true);
      setSuccess('Inquiry closed.');
      await inquiry.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to close inquiry');
    }
  };

  const data = inquiry.data;

  return (
    <div className="container space-y-4">
      <Link href="/account/inquiries" className="text-sm text-[var(--brand)]">
        Back to inquiries
      </Link>
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Inquiry Detail</h1>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
        {data && (
          <div className="mt-3 space-y-2 text-sm">
            <p><span className="font-semibold">Listing:</span> {data.listing?.title}</p>
            <p><span className="font-semibold">Seller:</span> {data.seller?.email}</p>
            <p><span className="font-semibold">Status:</span> {data.status}</p>
            <p><span className="font-semibold">Subject:</span> {data.subject || '-'}</p>
            <p className="rounded border border-[var(--line)] p-3 text-[var(--muted)]">{data.message}</p>
            {data.chat?.id && (
              <p>
                <Link href={`/chats/${data.chat.id}`} className="text-[var(--brand)]">Open Chat</Link>
              </p>
            )}
          </div>
        )}
        <button className="mt-4 rounded border border-[var(--line)] px-3 py-1.5 text-sm" onClick={() => void close()}>
          Close Inquiry
        </button>
      </div>
    </div>
  );
}
