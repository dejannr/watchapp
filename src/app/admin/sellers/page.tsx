'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LoadingCard } from '@/components/loading-card';
import { ApiError, apiRequest } from '@/lib/api';

type SellerApplicationListItem = {
  id: string;
  status: string;
  sellerType?: string;
  displayName?: string;
  user: {
    email: string;
  };
};

type SellerApplicationListResponse = {
  items: SellerApplicationListItem[];
  pagination: { page: number; pageCount: number; total: number };
};

function AdministratorProdavacsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'PENDING';
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? '1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const applications = useQuery({
    queryKey: ['admin-seller-applications', status, q, page],
    queryFn: () =>
      apiRequest<SellerApplicationListResponse>(
        `/admin/seller-applications?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}&page=${page}&pageSize=12`,
        'GET',
        undefined,
        true,
      ),
  });

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Odobrenja prodavaca</h1>
        <form
          className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const nextStatus = String(fd.get('status') || 'PENDING');
            const nextQ = String(fd.get('q') || '').trim();
            const params = new URLSearchParams();
            if (nextStatus) params.set('status', nextStatus);
            if (nextQ) params.set('q', nextQ);
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <select name="status" defaultValue={status} className="rounded border p-2 text-sm">
            <option value="PENDING">Na čekanju</option>
            <option value="APPROVED">Odobrid</option>
            <option value="REJECTED">Odbijed</option>
            <option value="NONE">Nijedno</option>
          </select>
          <input
            name="q"
            defaultValue={q}
            className="rounded border p-2 text-sm"
            placeholder="Pretraga po e-pošti ili javnom imenu"
          />
          <button className="rounded bg-[var(--brand)] px-3 py-2 text-sm text-white" type="submit">
            Primeni
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-700">{success}</p>}
        {applications.isLoading && (
          <div className="mt-3">
            <LoadingCard message="Učitavanje prijava..." />
          </div>
        )}
        <div className="mt-3 space-y-2">
          {(applications.data?.items ?? []).map((app) => (
            <div key={app.id} className="space-y-2 rounded border p-3 text-sm">
              <p className="font-semibold">{app.user.email}</p>
              <p className="text-[var(--muted)]">
                {app.displayName} · {app.sellerType} · {app.status}
              </p>
              <Link href={`/admin/seller-applications/${app.id}`} className="inline-block text-xs text-[var(--brand)]">
                Otvori detalje
              </Link>
              <div className="flex gap-2">
                <button
                  className="rounded bg-[var(--brand)] px-3 py-1 text-white"
                  disabled={app.status !== 'PENDING'}
                  onClick={async () => {
                    setError('');
                    setSuccess('');
                    try {
                      await apiRequest(`/admin/seller-applications/${app.id}/approve`, 'POST', {}, true);
                      setSuccess(`Odobreno ${app.user.email}`);
                      await applications.refetch();
                    } catch (e) {
                      setError(e instanceof ApiError ? e.message : 'Odobravanje prodavca nije uspelo');
                    }
                  }}
                >
                  Odobri
                </button>
                <button
                  className="rounded border border-[var(--line)] px-3 py-1"
                  disabled={app.status !== 'PENDING'}
                  onClick={async () => {
                    setError('');
                    setSuccess('');
                    try {
                      await apiRequest(
                        `/admin/seller-applications/${app.id}/reject`,
                        'POST',
                        { reasonCode: 'OTHER', rejectionNote: 'Odbijeno nakon administratorske provere' },
                        true,
                      );
                      setSuccess(`Odbijeno ${app.user.email}`);
                      await applications.refetch();
                    } catch (e) {
                      setError(e instanceof ApiError ? e.message : 'Odbijanje prodavca nije uspelo');
                    }
                  }}
                >
                  Odbij
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-[var(--muted)]">Ukupno: {applications.data?.pagination?.total ?? 0}</p>
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
              disabled={page >= (applications.data?.pagination?.pageCount ?? 1)}
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

export default function AdministratorProdavacsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-4">
          <LoadingCard />
        </div>
      }
    >
      <AdministratorProdavacsPageContent />
    </Suspense>
  );
}
