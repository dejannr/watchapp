'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';

function VerifyEmailPageContent() {
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
            setSuccess('Email verified. You can now login.');
          } catch (err) {
            if (err instanceof ApiError) {
              setError(err.message);
              return;
            }
            setError('Verification failed');
          }
        }}
        className="card mx-auto max-w-md space-y-3 p-5"
      >
        <h1 className="text-xl font-bold">Verify Email</h1>
        <input
          className="w-full rounded border p-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Verification token"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <button className="rounded bg-[var(--brand)] px-4 py-2 text-white">Verify</button>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
