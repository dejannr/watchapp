import Link from 'next/link';

type Listing = {
  id: string;
  slug: string;
  title: string;
  priceAmount: number;
  currency: string;
  locationCity?: string | null;
  locationCountry?: string | null;
  brand?: { name: string };
  images?: Array<{ url: string }>;
};

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images?.[0]?.url;
  return (
    <Link href={`/listing/${listing.slug}`} className="card block overflow-hidden">
      <div className="aspect-[4/3] bg-stone-200">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            No image
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase text-[var(--muted)]">{listing.brand?.name}</p>
        <h3 className="font-semibold">{listing.title}</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">
            {listing.priceAmount.toLocaleString()} {listing.currency}
          </span>
          <span className="text-[var(--muted)]">
            {[listing.locationCity, listing.locationCountry].filter(Boolean).join(', ')}
          </span>
        </div>
      </div>
    </Link>
  );
}
