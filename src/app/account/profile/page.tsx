'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function AccountProfilePage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => apiRequest('/users/me', 'GET', undefined, true),
  });

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Profile</h1>
        <pre className="mt-3 overflow-auto text-sm">{JSON.stringify(me.data, null, 2)}</pre>
      </div>
    </div>
  );
}
