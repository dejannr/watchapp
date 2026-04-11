'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotify } from '@/components/notifications-provider';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export function FavoriteToggleButton({ listingId }: { listingId: string }) {
  const qc = useQueryClient();
  const notify = useNotify();

  const favoriteIds = useQuery({
    queryKey: ['favorites-ids'],
    queryFn: async () => {
      try {
        const rows = await apiRequest<Array<{ listingId?: string; listing?: { id?: string } }>>(
          '/me/favorites',
          'GET',
          undefined,
          true,
          { suppressLoadingIndicator: true, suppressErrorToast: true },
        );
        return rows
          .map((row) => row.listingId ?? row.listing?.id ?? '')
          .filter((id): id is string => id.length > 0);
      } catch {
        return [] as string[];
      }
    },
    staleTime: 30_000,
  });

  const isFavorited = (favoriteIds.data ?? []).includes(listingId);

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      if (!token) {
        notify.info('Prijavite se da biste sačuvali oglas u favorite.');
        return;
      }
      if (isFavorited) {
        await apiRequest(`/listings/${listingId}/favorite`, 'DELETE', undefined, true);
      } else {
        await apiRequest(`/listings/${listingId}/favorite`, 'POST', {}, true);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['favorites-ids'] }),
        qc.invalidateQueries({ queryKey: ['favorites'] }),
        qc.invalidateQueries({ queryKey: ['account-count-favorites'] }),
      ]);
    },
  });

  return (
    <button
      type="button"
      className={`mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${
        isFavorited
          ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
          : 'border-[var(--line)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--line)]'
      }`}
      onClick={() => toggleFavorite.mutate()}
      disabled={toggleFavorite.isPending}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={isFavorited ? 'currentColor' : 'none'}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 21s-6.7-4.4-9.2-8.2C.9 9.8 2.1 6 5.5 5c2.1-.6 4.2.2 5.5 1.9C12.3 5.2 14.4 4.4 16.5 5c3.4 1 4.6 4.8 2.7 7.8C18.7 16.6 12 21 12 21z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {toggleFavorite.isPending
        ? 'Sačekajte...'
        : isFavorited
          ? 'Ukloni iz favorita'
          : 'Sačuvaj u favorite'}
    </button>
  );
}
