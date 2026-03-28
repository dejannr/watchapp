import type { Metadata } from 'next';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { PretragaFilters } from '@/components/browse-filters';
import { ListingCard } from '@/components/listing-card';
import { API_URL } from '@/lib/config';

type PretragaListing = {
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

export const metadata: Metadata = {
  title: 'Pretraga satova | WatchStock',
  description: 'Pretraga verified watch listings with structured filters.',
  alternates: { canonical: '/browse' },
};

export default async function PretragaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (!val) continue;
    q.set(key, Array.isArray(val) ? val[0] : val);
  }
  const queryString = q.toString();
  const data = await fetch(`${API_URL}/listings?${queryString}`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => ({ items: [], meta: null }));
  const items: PretragaListing[] = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="container space-y-4">
      <AnalyticsPageView eventName="browse_view" properties={{ resultCount: items.length }} />
      <PretragaFilters />
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {items.length === 0 && (
          <div className="card p-4 text-sm text-[var(--muted)]">
            No results found. Try clearing filters, widening price range, or selecting another brand.
          </div>
        )}
      </section>
    </div>
  );
}
