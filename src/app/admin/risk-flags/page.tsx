'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function AdministratorRiskFlagsPage() {
  const flags = useQuery({
    queryKey: ['admin-risk-flags'],
    queryFn: () => apiRequest<any[]>('/admin/risk-flags', 'GET', undefined, true),
  });

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Rizične oznake</h1>
        <div className="mt-3 space-y-2">
          {(flags.data ?? []).map((flag) => (
            <div key={flag.id} className="rounded border p-3 text-sm">
              <p className="font-semibold">{flag.type}</p>
              <p>
                {flag.entityType} · {flag.severity} · {flag.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
