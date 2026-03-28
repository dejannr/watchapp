'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function AdministratorKorisniciPage() {
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest<any[]>('/admin/users', 'GET', undefined, true),
  });
  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Korisnici</h1>
        <div className="mt-3 space-y-2">
          {(users.data ?? []).map((user) => (
            <div key={user.id} className="rounded border p-3 text-sm">
              {user.email} · {user.role} · {user.status} · {user.sellerStatus}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
