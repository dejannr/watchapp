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
          alert(`If account exists reset mail sent. Dev token: ${res.resetToken ?? 'n/a'}`);
        }}
        className="card mx-auto max-w-md space-y-3 p-5"
      >
        <h1 className="text-xl font-bold">Forgot Password</h1>
        <input
          className="w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button className="rounded bg-[var(--brand)] px-4 py-2 text-white">Send reset link</button>
      </form>
    </div>
  );
}
