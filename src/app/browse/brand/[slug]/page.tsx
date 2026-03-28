import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingCard } from '@/components/listing-card';
import { API_URL } from '@/lib/config';

export default async function BrendPretragaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [brandRes, listingRes] = await Promise.all([
    fetch(`${API_URL}/brands`, { cache: 'no-store' }),
    fetch(`${API_URL}/listings?brand=${slug}&limit=48`, { cache: 'no-store' }),
  ]);
  if (!brandRes.ok || !listingRes.ok) notFound();
  const brands = await brandRes.json();
  const listingsData = await listingRes.json();
  const brand = (Array.isArray(brands) ? brands : []).find((b: any) => b.slug === slug);
  if (!brand) notFound();
  const items = Array.isArray(listingsData?.items) ? listingsData.items : [];

  return (
    <div className="container space-y-4">
      <div className="card p-4">
        <h1 className="text-2xl font-bold">{brand.name} Oglasi</h1>
        <p className="text-sm text-[var(--muted)]">
          Pretraga all published {brand.name} satove na tržištu.
        </p>
        <Link href={`/browse?brand=${slug}`} className="text-sm text-[var(--brand)]">
          Otvori napredne filtere
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
