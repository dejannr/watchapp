'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

type SellerDashboardData = {
  listingCounts?: Record<string, number>;
  latestInquiries?: Array<{
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

export default function SellerDashboardPage() {
  const dashboard = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => apiRequest<SellerDashboardData>('/seller/dashboard', 'GET', undefined, true),
  });
  const listingCounts = dashboard.data?.listingCounts ?? {};
  const totalListings = (Object.values(listingCounts) as Array<number | string | null | undefined>)
    .reduce((sum: number, value) => sum + Number(value ?? 0), 0);
  const totalInquiries = dashboard.data?.latestInquiries?.length ?? 0;

  return (
    <div className="container space-y-4">
      <h1 className="text-3xl font-bold">Seller Dashboard</h1>
      <div className="pt-1 pb-2">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/seller-dashboard/listings/new"
            className="inline-flex rounded bg-[var(--brand)] px-4 py-2 text-white"
          >
            Create Listing
          </Link>
          <Link
            href="/seller-dashboard/listings"
            className="inline-flex rounded border border-[var(--line)] px-4 py-2"
          >
            My Listings
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
          <p className="text-sm text-[var(--muted)]">Recent Inquiries</p>
          <p className="text-2xl font-bold">{totalInquiries}</p>
        </div>
      </div>
      {totalListings === 0 && (
        <div className="card p-4 text-sm text-[var(--muted)]">
          You do not have any listings yet. Create your first listing to start receiving buyer inquiries.
        </div>
      )}
    </div>
  );
}
