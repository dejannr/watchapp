'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

export default function NalogSellerProfilPage() {
  const sellerProfile = useQuery({
    queryKey: ['seller-profile-me'],
    queryFn: async () => {
      try {
        return await apiRequest('/seller/me', 'GET', undefined, true);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Seller profil</h1>
        {sellerProfile.isLoading ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Učitavanje...</p>
        ) : sellerProfile.data ? (
          <pre className="mt-3 overflow-auto text-sm">
            {JSON.stringify(sellerProfile.data, null, 2)}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Seller profil još ne postoji za ovaj nalog.
          </p>
        )}
      </div>
    </div>
  );
}
