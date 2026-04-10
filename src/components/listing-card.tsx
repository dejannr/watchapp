import Link from 'next/link';

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

  return (
    <Link href={`/listing/${listing.slug}`} className="card block">
      <div className="aspect-[4/3] overflow-hidden rounded-t-[16px] bg-stone-200">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={listing.title} className="h-full w-full object-cover" />
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
            <span className="relative inline-flex items-center group">
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
              <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-max max-w-52 rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--text)] shadow group-hover:block">
                {city}
              </span>
            </span>
            <span className="relative inline-flex items-center group">
              <span className="text-lg leading-none" aria-label={country}>
                {flag}
              </span>
              <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-max max-w-52 rounded border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--text)] shadow group-hover:block">
                {country}
              </span>
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
