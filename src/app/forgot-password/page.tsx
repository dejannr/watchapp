'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  return (
    <div className="container">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await apiRequest<{ resetToken?: string }>('/auth/forgot-password', 'POST', { email });
          alert(`Ako nalog postoji, poslata je poruka za reset. Dev token: ${res.resetToken ?? 'n/a'}`);
        }}
        className="card mx-auto max-w-md space-y-3 p-5"
      >
        <h1 className="text-xl font-bold">Zaboravljena lozinka</h1>
        <input
          className="w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-pošta"
        />
        <button className="rounded bg-[var(--brand)] px-4 py-2 text-white">Pošalji reset link</button>
      </form>
    </div>
  );
}
