'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

export default function ProdavacApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const app = useQuery({
    queryKey: ['seller-application', id],
    queryFn: () => apiRequest<any>(`/admin/seller-applications/${id}`, 'GET', undefined, true),
  });

  const approve = async () => {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/admin/seller-applications/${id}/approve`, 'POST', {}, true);
      setSuccess('Prijava prodavca je odobrena.');
      await app.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Odobravanje nije uspelo');
    }
  };

  const reject = async () => {
    setError('');
    setSuccess('');
    try {
      await apiRequest(
        `/admin/seller-applications/${id}/reject`,
        'POST',
        { reasonCode: 'OTHER', rejectionNote: 'Odbijeno nakon administratorske provere.' },
        true,
      );
      setSuccess('Prijava prodavca je odbijena.');
      await app.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Odbijanje nije uspelo');
    }
  };

  const data = app.data;

  return (
    <div className="container space-y-4">
      <Link href="/admin/seller-applications" className="text-sm text-[var(--brand)]">
        Nazad na prijave prodavaca
      </Link>
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Detalji prijave prodavca</h1>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-700">{success}</p>}

        {data && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Podnosilac:</span> {data.user?.email}</p>
              <p><span className="font-semibold">Javno ime:</span> {data.displayName}</p>
              <p><span className="font-semibold">Tip prodavca:</span> {data.sellerType}</p>
              <p><span className="font-semibold">Status:</span> {data.status}</p>
              <p><span className="font-semibold">Grad/Država:</span> {data.publicLocationCity}, {data.publicLocationCountry}</p>
              <p><span className="font-semibold">Telefon:</span> {data.phone}</p>
              <p><span className="font-semibold">Veb sajt:</span> {data.website || '-'}</p>
              <p><span className="font-semibold">Instagram:</span> {data.instagramHandle || '-'}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">O prodavcu</p>
              <p className="rounded border border-[var(--line)] p-2 text-[var(--muted)]">{data.about}</p>
              <p><span className="font-semibold">Poslato:</span> {new Date(data.submittedAt).toLocaleString()}</p>
              <p><span className="font-semibold">Pregledano:</span> {data.reviewedAt ? new Date(data.reviewedAt).toLocaleString() : '-'}</p>
              <p><span className="font-semibold">Razlog odbijanja:</span> {data.rejectionReasonCode || '-'}</p>
              <p><span className="font-semibold">Napomena odbijanja:</span> {data.rejectionNote || '-'}</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2 text-sm">
          <button
            className="rounded bg-[var(--brand)] px-3 py-1.5 text-white disabled:opacity-60"
            disabled={!data || data.status !== 'PENDING'}
            onClick={() => void approve()}
          >
            Odobri
          </button>
          <button
            className="rounded border border-[var(--line)] px-3 py-1.5 disabled:opacity-60"
            disabled={!data || data.status !== 'PENDING'}
            onClick={() => void reject()}
          >
            Odbij
          </button>
        </div>
      </div>
    </div>
  );
}
