'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { NotificationCenter } from '@/components/notification-center';
import { apiRequest } from '@/lib/api';

const links = [
  ['/admin/users', 'Users'],
  ['/admin/seller-applications', 'Seller Approvals'],
  ['/admin/listings', 'Listings'],
  ['/admin/reports', 'Reports'],
  ['/admin/risk-flags', 'Risk Flags'],
  ['/admin/notification-jobs', 'Notification Jobs'],
  ['/admin/inquiries', 'Inquiries'],
  ['/admin/brands', 'Brands'],
] as const;

export default function AdminHomePage() {
  const dashboard7 = useQuery({
    queryKey: ['admin-dashboard', 7],
    queryFn: () => apiRequest<any>('/admin/dashboard?days=7', 'GET', undefined, true),
  });
  const dashboard30 = useQuery({
    queryKey: ['admin-dashboard', 30],
    queryFn: () => apiRequest<any>('/admin/dashboard?days=30', 'GET', undefined, true),
  });

  return (
    <div className="container space-y-4">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Users</p>
          <p className="text-2xl font-bold">{dashboard7.data?.users ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Pending Sellers</p>
          <p className="text-2xl font-bold">{dashboard7.data?.sellersPending ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Inquiries</p>
          <p className="text-2xl font-bold">{dashboard7.data?.inquiryCount ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Pending Listings</p>
          <p className="text-2xl font-bold">{dashboard7.data?.kpis?.pendingListings ?? 0}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Registrations (7d)</p>
          <p className="text-2xl font-bold">{dashboard7.data?.kpis?.registrationsWindow ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Registrations (30d)</p>
          <p className="text-2xl font-bold">{dashboard30.data?.kpis?.registrationsWindow ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Published (7d)</p>
          <p className="text-2xl font-bold">{dashboard7.data?.kpis?.publishedWindow ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">High Risk Flags</p>
          <p className="text-2xl font-bold">{dashboard7.data?.kpis?.highRiskOpenFlags ?? 0}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {links.map(([href, label]) => (
          <Link href={href} key={href} className="card p-4">
            {label}
          </Link>
        ))}
      </div>
      <NotificationCenter compact />
    </div>
  );
}
