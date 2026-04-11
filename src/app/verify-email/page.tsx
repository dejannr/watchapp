'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';
import { LoadingCard } from '@/components/loading-card';

function VerifikujEmailPageContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') ?? '';
  const [token, setToken] = useState(initialToken);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <div className="container">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setSuccess('');
          try {
            await apiRequest('/auth/verify-email', 'POST', { token });
            setSuccess('E-pošta je verifikovana. Sada se možete prijaviti.');
          } catch (err) {
            if (err instanceof ApiError) {
              setError(err.message);
              return;
            }
            setError('Verifikacija nije uspela');
          }
        }}
        className="card mx-auto max-w-md space-y-3 p-5"
      >
        <h1 className="text-xl font-bold">Verifikuj e-poštu</h1>
        <input
          className="w-full rounded border p-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Verifikacioni token"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <button className="rounded bg-[var(--brand)] px-4 py-2 text-white">Verifikuj</button>
      </form>
    </div>
  );
}

export default function VerifikujEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="mx-auto max-w-md">
            <LoadingCard />
          </div>
        </div>
      }
    >
      <VerifikujEmailPageContent />
    </Suspense>
  );
}
