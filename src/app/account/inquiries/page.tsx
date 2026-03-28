'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function AccountInquiriesPage() {
  const inquiries = useQuery({
    queryKey: ['inquiries-sent'],
    queryFn: () => apiRequest<any[]>('/buyer/inquiries', 'GET', undefined, true),
  });

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Sent Inquiries</h1>
        <div className="mt-3 space-y-2">
          {(inquiries.data ?? []).map((row) => (
            <div key={row.id} className="rounded border p-3">
              <p className="font-semibold">{row.listing.title}</p>
              <p className="text-sm text-[var(--muted)]">{row.message}</p>
              <p className="text-xs text-[var(--muted)]">Status: {row.status}</p>
              <Link href={`/account/inquiries/${row.id}`} className="text-xs text-[var(--brand)]">
                Open detail
              </Link>
              {row.chat?.id && (
                <Link href={`/chats/${row.chat.id}`} className="ml-3 text-xs text-[var(--brand)]">
                  Open chat
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
