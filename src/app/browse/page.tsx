import type { Metadata } from 'next';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { BrowseFilters } from '@/components/browse-filters';
import { ListingCard } from '@/components/listing-card';
import { API_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Browse Watches | ChronoMarket',
  description: 'Browse verified watch listings with structured filters.',
  alternates: { canonical: '/browse' },
};

export default async function BrowsePage({
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
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="container grid gap-6 md:grid-cols-[260px_1fr]">
      <AnalyticsPageView eventName="browse_view" properties={{ resultCount: items.length }} />
      <aside>
        <BrowseFilters />
      </aside>
      <section className="space-y-4">
        <div className="card flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Browse Listings</h1>
          <span className="text-sm text-[var(--muted)]">
            {data.meta ? `${data.meta.total} total` : ''}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing: any) => (
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
