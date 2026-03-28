'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function AdministratorBrendoviPage() {
  const brands = useQuery({
    queryKey: ['brands'],
    queryFn: () => apiRequest<any[]>('/brands'),
  });
  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Brendovi</h1>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(brands.data ?? []).map((brand) => (
            <div key={brand.id} className="rounded border p-3 text-sm">
              {brand.name} ({brand._count?.models ?? 0} models)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
