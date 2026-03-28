'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { NotificationCenter } from '@/components/notification-center';
import { apiRequest } from '@/lib/api';

const links = [
  ['/admin/users', 'Korisnici'],
  ['/admin/seller-applications', 'Odobrenja prodavaca'],
  ['/admin/listings', 'Oglasi'],
  ['/admin/reports', 'Prijave'],
  ['/admin/risk-flags', 'Rizične oznake'],
  ['/admin/notification-jobs', 'Poslovi obaveštenja'],
  ['/admin/inquiries', 'Upiti'],
  ['/admin/brands', 'Brendovi'],
] as const;

export default function AdministratorHomePage() {
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
      <h1 className="text-3xl font-bold">Administratorska kontrolna tabla</h1>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Korisnici</p>
          <p className="text-2xl font-bold">{dashboard7.data?.users ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Prodavci na čekanju</p>
          <p className="text-2xl font-bold">{dashboard7.data?.sellersPending ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Upiti</p>
          <p className="text-2xl font-bold">{dashboard7.data?.inquiryCount ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Oglasi na čekanju</p>
          <p className="text-2xl font-bold">{dashboard7.data?.kpis?.pendingListings ?? 0}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Registracije (7d)</p>
          <p className="text-2xl font-bold">{dashboard7.data?.kpis?.registrationsWindow ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Registracije (30d)</p>
          <p className="text-2xl font-bold">{dashboard30.data?.kpis?.registrationsWindow ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Objavljeno (7d)</p>
          <p className="text-2xl font-bold">{dashboard7.data?.kpis?.publishedWindow ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">Visoko rizične oznake</p>
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
