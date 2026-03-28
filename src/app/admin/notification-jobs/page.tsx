'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

export default function AdministratorNotificationJobsPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const jobs = useQuery({
    queryKey: ['admin-notification-jobs'],
    queryFn: () => apiRequest<any[]>('/admin/notification-jobs', 'GET', undefined, true),
  });

  const processPending = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await apiRequest<{ processed: number; sent: number; failed: number }>(
        '/admin/notification-jobs/process',
        'POST',
        { batch: 50 },
        true,
      );
      setSuccess(`Obrađeno ${res.processed}, poslato ${res.sent}, neuspešno ${res.failed}.`);
      await jobs.refetch();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Obrada poslova nije uspela');
    }
  };

  return (
    <div className="container">
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Poslovi obaveštenja</h1>
          <button className="rounded bg-[var(--brand)] px-3 py-1.5 text-white" onClick={() => void processPending()}>
            Obradi na čekanju
          </button>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <div className="mt-3 space-y-2">
          {(jobs.data ?? []).map((job) => (
            <div key={job.id} className="rounded border p-3 text-sm">
              <p className="font-semibold">{job.toEmail}</p>
              <p className="text-[var(--muted)]">
                {job.status} · pokušaji {job.attempts}/{job.maxAttempts}
              </p>
              <p className="text-xs text-[var(--muted)]">{job.subject}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
