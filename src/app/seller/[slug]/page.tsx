import { ListingCard } from '@/components/listing-card';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { API_URL } from '@/lib/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/sellers/${slug}`, { cache: 'no-store' });
  if (!res.ok) {
    return { title: 'Seller not found' };
  }
  const data = await res.json();
  return {
    title: `${data.displayName} | Seller | ChronoMarket`,
    description: data.bio?.slice(0, 160) ?? 'Seller profile',
    alternates: { canonical: `/seller/${slug}` },
  };
}

export default async function SellerPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/sellers/${slug}`, { cache: 'no-store' });
  if (!res.ok) {
    notFound();
  }
  const data = await res.json();
  const listings = Array.isArray(data?.listings) ? data.listings : [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.displayName,
    url: `/seller/${slug}`,
    address: [data.locationCity, data.locationCountry].filter(Boolean).join(', '),
  };

  return (
    <div className="container space-y-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnalyticsPageView eventName="seller_profile_view" properties={{ sellerSlug: slug }} />
      <section className="card p-5">
        <h1 className="text-3xl font-bold">{data.displayName}</h1>
        <p className="mt-2 text-[var(--muted)]">{data.bio}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {[data.locationCity, data.locationCountry].filter(Boolean).join(', ')}
        </p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Published Listings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
