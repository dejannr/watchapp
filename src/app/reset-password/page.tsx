'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export default function ResetujLozinkaPage() {
  const [token, setToken] = useState('');
  const [password, setLozinka] = useState('');
  return (
    <div className="container">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await apiRequest('/auth/reset-password', 'POST', { token, password });
          alert('Lozinka reset complete');
        }}
        className="card mx-auto max-w-md space-y-3 p-5"
      >
        <h1 className="text-xl font-bold">Resetuj Lozinka</h1>
        <input
          className="w-full rounded border p-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token za reset"
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setLozinka(e.target.value)}
          placeholder="Novi oglas password"
        />
        <button className="rounded bg-[var(--brand)] px-4 py-2 text-white">Resetuj</button>
      </form>
    </div>
  );
}
