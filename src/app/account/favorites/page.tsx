'use client';

import { useQuery } from '@tanstack/react-query';
import { ListingCard } from '@/components/listing-card';
import { apiRequest } from '@/lib/api';

export default function FavoritesPage() {
  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiRequest<any[]>('/me/favorites', 'GET', undefined, true),
  });

  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-bold">Favoriti</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(favorites.data ?? []).map((fav) => (
          <ListingCard key={fav.id} listing={fav.listing} />
        ))}
      </div>
    </div>
  );
}
