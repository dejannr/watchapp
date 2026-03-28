'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export default function SellerProfilePage() {
  const profile = useQuery({
    queryKey: ['seller-profile'],
    queryFn: () => apiRequest('/seller/me', 'GET', undefined, true),
  });

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Seller Profile</h1>
        <pre className="mt-3 overflow-auto text-sm">{JSON.stringify(profile.data, null, 2)}</pre>
      </div>
    </div>
  );
}
