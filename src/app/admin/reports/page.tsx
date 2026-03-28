'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function AdminReportsPage() {
  const reports = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => apiRequest<any[]>('/admin/reports', 'GET', undefined, true),
  });

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="mt-3 space-y-2">
          {(reports.data ?? []).map((report) => (
            <div key={report.id} className="rounded border p-3 text-sm">
              <p className="font-semibold">{report.entityType}</p>
              <p>{report.reasonCode}</p>
              <p className="text-[var(--muted)]">{report.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
