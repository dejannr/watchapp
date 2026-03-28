'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

export default function ProdavacInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inquiry = useQuery({
    queryKey: ['seller-inquiry-detail', id],
    queryFn: () => apiRequest<any>(`/seller/inquiries/${id}`, 'GET', undefined, true),
  });

  const close = async () => {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/seller/inquiries/${id}/close`, 'POST', { reason: 'Zatvoreno od strane prodavca' }, true);
      setSuccess('Upit je zatvoren.');
      await inquiry.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Zatvaranje upita nije uspelo');
    }
  };

  const data = inquiry.data;

  return (
    <div className="container space-y-4">
      <Link href="/seller-dashboard/inquiries" className="text-sm text-[var(--brand)]">
        Nazad na upite
      </Link>
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Detalji upita</h1>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
        {data && (
          <div className="mt-3 space-y-2 text-sm">
            <p><span className="font-semibold">Oglas:</span> {data.listing?.title}</p>
            <p><span className="font-semibold">Kupac:</span> {data.sender?.email}</p>
            <p><span className="font-semibold">Status:</span> {data.status}</p>
            <p><span className="font-semibold">Naslov:</span> {data.subject || '-'}</p>
            <p className="rounded border border-[var(--line)] p-3 text-[var(--muted)]">{data.message}</p>
            {data.chat?.id && (
              <p>
                <Link href={`/chats/${data.chat.id}`} className="text-[var(--brand)]">Otvori razgovor</Link>
              </p>
            )}
          </div>
        )}
        <button className="mt-4 rounded border border-[var(--line)] px-3 py-1.5 text-sm" onClick={() => void close()}>
          Zatvori upit
        </button>
      </div>
    </div>
  );
}
