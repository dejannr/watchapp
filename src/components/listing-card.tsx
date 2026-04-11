'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotify } from '@/components/notifications-provider';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

type Listing = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  priceAmount: number;
  currency: string;
  locationCity?: string | null;
  locationCountry?: string | null;
  brand?: { name: string };
  images?: Array<{ url: string }>;
};

export function ListingCard({ listing, showDescription = true }: { listing: Listing; showDescription?: boolean }) {
  const qc = useQueryClient();
  const notify = useNotify();
  const image = listing.images?.[0]?.url;
  const city = listing.locationCity || 'Grad nije naveden';
  const country = listing.locationCountry || 'Država nije navedena';
  const flagByDržava: Record<string, string> = {
    Srbija: '🇷🇸',
    'Crna Gora': '🇲🇪',
    'Bosna i Hercegovina': '🇧🇦',
    Hrvatska: '🇭🇷',
    Slovenija: '🇸🇮',
    Makedonija: '🇲🇰',
  };
  const flag = listing.locationCountry ? (flagByDržava[listing.locationCountry] ?? '🌍') : '🌍';
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
  const isFavorited = (favoriteIds.data ?? []).includes(listing.id);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      if (!token) {
        notify.info('Prijavite se da biste sačuvali oglas u favorite.');
        return;
      }
      if (isFavorited) {
        await apiRequest(`/listings/${listing.id}/favorite`, 'DELETE', undefined, true);
      } else {
        await apiRequest(`/listings/${listing.id}/favorite`, 'POST', {}, true);
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
    <div className="group/card relative">
      <button
        type="button"
        aria-label={isFavorited ? 'Ukloni iz favorita' : 'Dodaj u favorite'}
        className={`absolute right-2 top-2 z-20 rounded-full border p-1.5 transition ${
          isFavorited
            ? 'border-[var(--brand)] bg-[var(--brand)] text-white opacity-100'
            : 'border-white/80 bg-black/35 text-white opacity-0 group-hover/card:opacity-100'
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          favoriteMutation.mutate();
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M12 21s-6.7-4.4-9.2-8.2C.9 9.8 2.1 6 5.5 5c2.1-.6 4.2.2 5.5 1.9C12.3 5.2 14.4 4.4 16.5 5c3.4 1 4.6 4.8 2.7 7.8C18.7 16.6 12 21 12 21z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <Link href={`/listing/${listing.slug}`} className="card block">
        <div className="aspect-[4/3] overflow-hidden rounded-t-[16px] bg-stone-200">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover/card:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
              Nema slike
            </div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="truncate text-[13px] font-semibold">{listing.title}</h3>
          {showDescription && (
            <p
              className="text-xs text-[var(--muted)]"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textAlign: 'justify',
              }}
            >
              {listing.description || 'Nema opisa'}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[13px] font-medium">
              {listing.priceAmount.toLocaleString()} {listing.currency}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="group/city relative inline-flex items-center">
                <span className="text-sm leading-none" aria-label={city}>
                  <svg
                    className="h-4 w-4 text-[var(--muted)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-max max-w-52 rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--text)] shadow group-hover/city:block">
                  {city}
                </span>
              </span>
              <span className="group/country relative inline-flex items-center">
                <span className="text-lg leading-none" aria-label={country}>
                  {flag}
                </span>
                <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-max max-w-52 rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--text)] shadow group-hover/country:block">
                  {country}
                </span>
              </span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
