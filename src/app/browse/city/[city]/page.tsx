import Link from 'next/link';
import { ListingCard } from '@/components/listing-card';
import { API_URL } from '@/lib/config';

export default async function CityBrowsePage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const decoded = decodeURIComponent(city);
  const listingsData = await fetch(`${API_URL}/listings?locationCity=${encodeURIComponent(decoded)}&limit=48`, {
    cache: 'no-store',
  })
    .then((r) => r.json())
    .catch(() => ({ items: [] }));
  const items = Array.isArray(listingsData?.items) ? listingsData.items : [];

  return (
    <div className="container space-y-4">
      <div className="card p-4">
        <h1 className="text-2xl font-bold">{decoded} Watch Listings</h1>
        <p className="text-sm text-[var(--muted)]">
          Current published watch inventory in {decoded}.
        </p>
        <Link href={`/browse?locationCity=${encodeURIComponent(decoded)}`} className="text-sm text-[var(--brand)]">
          Open advanced filters
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
