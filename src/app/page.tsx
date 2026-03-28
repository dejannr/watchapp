import Link from 'next/link';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { ListingCard } from '@/components/listing-card';
import { API_URL } from '@/lib/config';

export default async function Home() {
  const featuredRaw = await fetch(`${API_URL}/listings?limit=6`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => ({ items: [] }));
  const brandsRaw = await fetch(`${API_URL}/brands`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => []);

  const featuredItems: any[] = Array.isArray(featuredRaw?.items) ? featuredRaw.items : [];
  const brands = Array.isArray(brandsRaw) ? brandsRaw : [];
  const citySet = new Set<string>();
  for (const item of featuredItems) {
    if (typeof item?.locationCity === 'string' && item.locationCity.trim().length > 0) {
      citySet.add(item.locationCity);
    }
  }
  const cities = Array.from(citySet).slice(0, 8);

  return (
    <div className="container space-y-10">
      <AnalyticsPageView eventName="homepage_view" />
      <section className="card grid gap-4 p-8 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-soft)]">Watch Marketplace</p>
          <h1 className="text-4xl font-bold leading-tight">Buy and Sell Authentic Timepieces Offline</h1>
          <p className="text-[var(--muted)]">
            Discover listings from private sellers and dealers. Search by brand, model, condition, and location.
          </p>
          <div className="flex gap-3">
            <Link href="/browse" className="rounded bg-[var(--brand)] px-5 py-2 text-white">
              Browse Listings
            </Link>
            <Link href="/sell" className="rounded border border-[var(--line)] px-5 py-2">
              Become Seller
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
          <p>How it works:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Register and verify email.</li>
            <li>Apply as seller and get approved.</li>
            <li>Create listings and manage inquiries.</li>
          </ol>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Featured Listings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Brands</h2>
        <div className="flex flex-wrap gap-2">
          {brands.slice(0, 18).map((brand: any) => (
            <Link
              key={brand.id}
              href={`/browse?brand=${brand.slug}`}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-sm"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="card grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Sell Watches on ChronoMarket</h2>
          <p className="text-[var(--muted)]">
            Apply as a seller, get reviewed by admin, and publish trusted inventory for serious buyers.
          </p>
        </div>
        <Link href="/sell" className="rounded bg-[var(--brand)] px-5 py-2 text-white">
          Become a Seller
        </Link>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Explore by Brand & City</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {brands.slice(0, 10).map((brand: any) => (
            <Link
              key={brand.id}
              href={`/browse/brand/${brand.slug}`}
              className="rounded border border-[var(--line)] px-3 py-1"
            >
              {brand.name}
            </Link>
          ))}
          {cities.map((city) => (
            <Link
              key={city}
              href={`/browse/city/${encodeURIComponent(city)}`}
              className="rounded border border-[var(--line)] px-3 py-1"
            >
              {city}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
