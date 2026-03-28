'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function AdminInquiriesPage() {
  const inquiries = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => apiRequest<any[]>('/admin/inquiries', 'GET', undefined, true),
  });
  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <div className="mt-3 space-y-2">
          {(inquiries.data ?? []).map((row) => (
            <div key={row.id} className="rounded border p-3 text-sm">
              <p className="font-semibold">{row.listing.title}</p>
              <p>{row.message}</p>
              <p className="text-[var(--muted)]">
                From {row.sender.email} to {row.seller.email}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
