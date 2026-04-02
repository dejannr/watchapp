import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { InquiryForm } from '@/components/forms/inquiry-form';
import { API_URL } from '@/lib/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/listings/${slug}`, { cache: 'no-store' });
  if (!res.ok) {
    return { title: 'Oglas nije pronađen' };
  }
  const listing = await res.json();
  return {
    title: `${listing.title} | Satovi24`,
    description: listing.description?.slice(0, 160) ?? 'Oglas sata',
    alternates: { canonical: `/listing/${slug}` },
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listingRes = await fetch(`${API_URL}/listings/${slug}`, { cache: 'no-store' });
  if (!listingRes.ok) {
    notFound();
  }
  const listing = await listingRes.json();

  const related = await fetch(`${API_URL}/listings?brand=${listing.brand?.slug ?? ''}&limit=8`, {
    cache: 'no-store',
  })
    .then((r) => r.json())
    .catch(() => ({ items: [] }));
  const relatedItems = (Array.isArray(related?.items) ? related.items : [])
    .filter((item: any) =>
      item &&
      item.id !== listing.id &&
      typeof item.slug === 'string' &&
      item.slug.trim().length > 0 &&
      item.status === 'PUBLISHED',
    )
    .slice(0, 4);
  const images = Array.isArray(listing?.images) ? listing.images : [];
  const sellerProfile =
    listing?.seller?.sellerProfile ??
    listing?.seller?.sellerProfil ??
    listing?.sellerProfile ??
    listing?.sellerProfil ??
    null;
  const sellerDisplayName =
    sellerProfile?.displayName ||
    [listing?.seller?.firstName, listing?.seller?.lastName].filter(Boolean).join(' ').trim() ||
    listing?.seller?.displayName ||
    listing?.seller?.email ||
    '';
  const sellerSlug = sellerProfile?.slug || '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    brand: listing.brand?.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: listing.currency,
      price: listing.priceAmount,
      availability: listing.status === 'PUBLISHED' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="container grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnalyticsPageView
        eventName="listing_view"
        properties={{ listingId: listing.id, sellerId: listing.seller?.id, brand: listing.brand?.name }}
      />
      <section className="space-y-4">
        <div className="card p-4">
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {listing.brand?.name} {listing.watchModel?.name ? `· ${listing.watchModel.name}` : ''}
          </p>
          <p className="mt-3 text-xl font-semibold">
            {listing.priceAmount.toLocaleString()} {listing.currency}
          </p>
        </div>
        <div className="card grid gap-2 p-4 sm:grid-cols-2">
          {images.map((img: any) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt={img.altText ?? listing.title} className="h-52 w-full rounded object-cover" />
          ))}
        </div>
        <div className="card space-y-3 p-4">
          <h2 className="text-xl font-semibold">Opis</h2>
          <p className="text-[var(--muted)]">{listing.description}</p>
          <table className="w-full text-sm">
            <tbody>
              <tr><td>Stanje</td><td>{listing.condition}</td></tr>
              <tr><td>Mehanizam</td><td>{listing.movementType ?? '-'}</td></tr>
              <tr><td>Referenca</td><td>{listing.referenceNumber ?? '-'}</td></tr>
              <tr><td>Godina</td><td>{listing.yearOfProduction ?? '-'}</td></tr>
              <tr><td>Lokacija</td><td>{[listing.locationCity, listing.locationCountry].filter(Boolean).join(', ')}</td></tr>
              <tr><td>Kutija/Papiri</td><td>{listing.hasBox ? 'Kutija' : 'Bez kutije'} / {listing.hasPapers ? 'Papiri' : 'Bez papira'}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <aside className="space-y-4">
        <div className="card p-4">
          <h3 className="font-semibold">Prodavac</h3>
          <p>{sellerDisplayName || 'Učitavanje prodavca...'}</p>
          {sellerSlug ? (
            <Link href={`/seller/${sellerSlug}`} className="text-sm text-[var(--brand)]">
              Pogledaj profil
            </Link>
          ) : (
            <p className="text-xs text-[var(--muted)]">Profil prodavca trenutno nije dostupan.</p>
          )}
        </div>
        <InquiryForm listingId={listing.id} />
        <div className="card p-4">
          <h3 className="mb-2 font-semibold">Slični oglasi</h3>
          <div className="space-y-2 text-sm">
            {relatedItems.length > 0 ? relatedItems.map((item: any) => (
              <Link key={item.id} href={`/listing/${item.slug}`} className="block rounded border p-2 hover:bg-stone-50">
                {item.title}
              </Link>
            )) : <p className="text-[var(--muted)]">Nema povezanih javnih oglasa.</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
