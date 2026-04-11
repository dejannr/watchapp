import { ListingCard } from '@/components/listing-card';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { API_URL } from '@/lib/config';

type SellerListing = {
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

type SellerReview = {
  id: string;
  rating: number;
  comment?: string | null;
  reviewer?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  } | null;
  listing?: {
    title: string;
    slug: string;
  } | null;
};

function personName(person?: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
}) {
  const full = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (person?.displayName) return person.displayName;
  return 'Korisnik';
}

function stars(rating: number) {
  const safe = Math.max(1, Math.min(5, rating || 0));
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/sellers/${slug}`, { cache: 'no-store' });
  if (!res.ok) {
    return { title: 'Prodavac not found' };
  }
  const data = await res.json();
  return {
    title: `${data.displayName} | Prodavac | Satovi24`,
    description: data.bio?.slice(0, 160) ?? 'Prodavac profile',
    alternates: { canonical: `/seller/${slug}` },
  };
}

export default async function ProdavacPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/sellers/${slug}`, { cache: 'no-store' });
  if (!res.ok) {
    notFound();
  }
  const data = await res.json();
  const listings = Array.isArray(data?.listings) ? (data.listings as SellerListing[]) : [];
  const reviews = Array.isArray(data?.reviews) ? (data.reviews as SellerReview[]) : [];
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
        <h2 className="mb-4 text-xl font-bold">Published Oglasi</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="text-xl font-bold">Recenzije</h2>
        {reviews.length === 0 && (
          <p className="mt-2 text-sm text-[var(--muted)]">Još nema recenzija.</p>
        )}
        <div className="mt-3 space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{personName(review.reviewer)}</p>
                <p className="text-sm tracking-wide text-amber-600">{stars(review.rating)}</p>
              </div>
              {review.comment && <p className="mt-2 text-sm text-[var(--text)]">{review.comment}</p>}
              {review.listing?.slug && (
                <Link href={`/listing/${review.listing.slug}`} className="mt-2 inline-flex text-xs text-[var(--brand)] hover:underline">
                  {review.listing.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
