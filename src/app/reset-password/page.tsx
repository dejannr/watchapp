'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="container">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await apiRequest('/auth/reset-password', 'POST', { token, password });
          alert('Password reset complete');
        }}
        className="card mx-auto max-w-md space-y-3 p-5"
      >
        <h1 className="text-xl font-bold">Reset Password</h1>
        <input
          className="w-full rounded border p-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Reset token"
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
        />
        <button className="rounded bg-[var(--brand)] px-4 py-2 text-white">Reset</button>
      </form>
    </div>
  );
}
