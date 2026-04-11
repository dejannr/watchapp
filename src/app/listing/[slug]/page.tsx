import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { FavoriteToggleButton } from '@/components/favorite-toggle-button';
import { InquiryForm } from '@/components/forms/inquiry-form';
import { ListingBackBreadcrumb } from '@/components/listing-back-breadcrumb';
import { ListingGallery } from '@/components/listing-gallery';
import { API_URL } from '@/lib/config';

type ListingImage = {
  id?: string;
  url: string;
  altText?: string | null;
};

function formatCondition(value?: string) {
  const map: Record<string, string> = {
    NEW: 'Novo',
    LIKE_NEW: 'Kao novo',
    VERY_GOOD: 'Vrlo dobro',
    GOOD: 'Dobro',
    FAIR: 'Solidno',
  };
  return value ? (map[value] ?? value) : '-';
}

function formatMovement(value?: string) {
  const map: Record<string, string> = {
    AUTOMATIC: 'Automatski',
    MANUAL: 'Ručni',
    QUARTZ: 'Quartz',
    SMART: 'Pametni',
    OTHER: 'Drugo',
  };
  return value ? (map[value] ?? value) : '-';
}

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

  const images: ListingImage[] = Array.isArray(listing?.images) ? listing.images : [];
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
      availability:
        listing.status === 'PUBLISHED'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  const location = [listing.locationCity, listing.locationCountry].filter(Boolean).join(', ');

  return (
    <div className="container space-y-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnalyticsPageView
        eventName="listing_view"
        properties={{ listingId: listing.id, sellerId: listing.seller?.id, brand: listing.brand?.name }}
      />

      <div className="space-y-2">
        <ListingBackBreadcrumb />
        <h1 className="text-3xl font-bold leading-tight">{listing.title}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr] lg:items-start">
        <section className="space-y-6">
          <div className="w-full max-w-[760px]">
            <ListingGallery images={images} title={listing.title} />
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold">Specifikacije</h2>
            <div className="mt-4 grid grid-cols-1 gap-0 border border-[var(--line)] text-sm sm:grid-cols-2">
              {[
                ['Stanje', formatCondition(listing.condition)],
                ['Mehanizam', formatMovement(listing.movementType)],
                ['Referentni broj', listing.referenceNumber ?? '-'],
                ['Godina proizvodnje', listing.yearOfProduction ?? '-'],
                ['Grad', listing.locationCity ?? '-'],
                ['Država', listing.locationCountry ?? '-'],
                [
                  'Kutija',
                  listing.hasBox ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      <span aria-hidden="true">✓</span>
                      Uključena
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                      <span aria-hidden="true">✕</span>
                      Nije uključena
                    </span>
                  ),
                ],
                [
                  'Papiri',
                  listing.hasPapers ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      <span aria-hidden="true">✓</span>
                      Uključeni
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                      <span aria-hidden="true">✕</span>
                      Nisu uključeni
                    </span>
                  ),
                ],
              ].map(([label, value], index) => (
                <div
                  key={`${label}-${index}`}
                  className="grid grid-cols-[140px_1fr] gap-2 border-b border-[var(--line)] p-3 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
                >
                  <span className="text-[var(--muted)]">{label}</span>
                  <span className="font-medium">{value as any}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold">Opis</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--muted)]">
              {listing.description || 'Prodavac nije uneo dodatni opis.'}
            </p>
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-5">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--muted)]">Cena</p>
            <p className="mt-1 text-3xl font-bold">
              {listing.priceAmount.toLocaleString()} {listing.currency}
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">Cena je informativna. Detalji dogovora idu direktno sa prodavcem.</p>
            <FavoriteToggleButton listingId={listing.id} />
          </div>

          <div className="card space-y-2 p-5">
            <h3 className="font-semibold">Prodavac</h3>
            {sellerSlug ? (
              <Link
                href={`/seller/${sellerSlug}`}
                className="group inline-flex items-center gap-1 text-sm text-[var(--brand)]"
              >
                <span className="decoration-1 underline-offset-2 group-hover:underline">
                  {sellerDisplayName || 'Prodavac'}
                </span>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-2.5 w-2.5 opacity-80" aria-hidden="true" />
              </Link>
            ) : (
              <p className="text-sm">{sellerDisplayName || 'Prodavac'}</p>
            )}
          </div>

          <InquiryForm listingId={listing.id} />
        </aside>
      </div>
    </div>
  );
}
