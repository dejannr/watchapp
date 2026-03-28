'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

type ProdavacDashboardData = {
  listingCounts?: Record<string, number>;
  latestUpiti?: Array<{
    id: string;
    createdAt: string;
  }>;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ProdavacDashboardPage() {
  const dashboard = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => apiRequest<ProdavacDashboardData>('/seller/dashboard', 'GET', undefined, true),
  });
  const listingCounts = dashboard.data?.listingCounts ?? {};
  const totalOglasi = (Object.values(listingCounts) as Array<number | string | null | undefined>)
    .reduce((sum: number, value) => sum + Number(value ?? 0), 0);
  const totalUpiti = dashboard.data?.latestUpiti?.length ?? 0;

  return (
    <div className="container space-y-4">
      <h1 className="text-3xl font-bold">Kontrolna tabla prodavca</h1>
      <div className="pt-1 pb-2">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/seller-dashboard/listings/new"
            className="inline-flex rounded bg-[var(--brand)] px-4 py-2 text-white"
          >
            Kreiraj oglas
          </Link>
          <Link
            href="/seller-dashboard/listings"
            className="inline-flex rounded border border-[var(--line)] px-4 py-2"
          >
            Moji oglasi
          </Link>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(listingCounts).map(([status, count]) => (
          <div key={status} className="card p-3">
            <p className="text-sm text-[var(--muted)]">{formatStatus(status)}</p>
            <p className="text-2xl font-bold">{String(count)}</p>
          </div>
        ))}
        <div className="card p-3">
          <p className="text-sm text-[var(--muted)]">Nedavni upiti</p>
          <p className="text-2xl font-bold">{totalUpiti}</p>
        </div>
      </div>
      {totalOglasi === 0 && (
        <div className="card p-4 text-sm text-[var(--muted)]">
          Još nemate nijedan oglas. Kreirajte prvi oglas da biste počeli da dobijate upite kupaca.
        </div>
      )}
    </div>
  );
}
