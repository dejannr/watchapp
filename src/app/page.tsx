import Link from 'next/link';
import { Suspense } from 'react';
import { AnalyticsPageView } from '@/components/analytics-page-view';
import { ListingCard } from '@/components/listing-card';
import { LoadingCard } from '@/components/loading-card';
import { API_URL } from '@/lib/config';

type HomeListing = {
  id: string;
  slug: string;
  title: string;
  priceAmount: number;
  currency: string;
  locationCity?: string | null;
  locationCountry?: string | null;
  images?: Array<{ url: string }>;
};

type HomeBrand = {
  id: string;
  name: string;
  slug: string;
};

async function fetchFeaturedListings(): Promise<HomeListing[]> {
  const featuredRaw = await fetch(`${API_URL}/listings?limit=10`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => ({ items: [] }));
  return Array.isArray(featuredRaw?.items) ? featuredRaw.items : [];
}

async function fetchBrands(): Promise<HomeBrand[]> {
  const brandsRaw = await fetch(`${API_URL}/brands`, { cache: 'no-store' })
    .then((r) => r.json())
    .catch(() => []);
  return Array.isArray(brandsRaw) ? brandsRaw : [];
}

async function FeaturedListingsSection() {
  const featuredItems = await fetchFeaturedListings();

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Istaknuti oglasi</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featuredItems.map((listing) => (
          <ListingCard key={listing.id} listing={listing} showDescription={false} />
        ))}
      </div>
    </section>
  );
}

function FeaturedListingsFallback() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Istaknuti oglasi</h2>
      <LoadingCard message="Učitavanje istaknutih oglasa..." />
    </section>
  );
}

async function PopularBrandsSection() {
  const brands = await fetchBrands();

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Popularni brendovi</h2>
      <div className="flex flex-wrap gap-2">
        {brands.slice(0, 18).map((brand) => (
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
  );
}

function PopularBrandsFallback() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Popularni brendovi</h2>
      <LoadingCard message="Učitavanje brendova..." />
    </section>
  );
}

export default function Home() {
  return (
    <div className="container space-y-10">
      <AnalyticsPageView eventName="homepage_view" />
      <section className="card grid gap-4 p-8 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-soft)]">Tržište satova</p>
          <h1 className="text-4xl font-bold leading-tight">Kupujte i prodajte proverene satove na jednom mestu</h1>
          <p className="text-[var(--muted)]">
            Pronađite oglase privatnih prodavaca i dilera. Pretražujte po brendu, modelu, stanju i lokaciji.
          </p>
          <div className="flex gap-3">
            <Link href="/browse" className="rounded bg-[var(--brand)] px-5 py-2 text-white">
              Pregledaj oglase
            </Link>
            <Link href="/sell" className="rounded border border-[var(--line)] px-5 py-2">
              Postani prodavac
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--card)]/70 p-6">
          <p className="text-sm font-semibold text-[var(--text)]">Kako početi</p>
          <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-xs text-[var(--text)]">
                1
              </span>
              <p>Napravite nalog i verifikujte e-poštu.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-xs text-[var(--text)]">
                2
              </span>
              <p>Pretražite oglase ili podnesite prijavu za prodavca.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-xs text-[var(--text)]">
                3
              </span>
              <p>Objavite sat i komunicirajte sa kupcima kroz poruke.</p>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<FeaturedListingsFallback />}>
        <FeaturedListingsSection />
      </Suspense>

      <Suspense fallback={<PopularBrandsFallback />}>
        <PopularBrandsSection />
      </Suspense>

      <section className="card grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Prodajte satove na Satovi24</h2>
          <p className="text-[var(--muted)]">
            Prijavite se kao prodavac, prođite proveru administratora i objavite pouzdan inventar za ozbiljne kupce.
          </p>
        </div>
        <Link href="/sell" className="rounded bg-[var(--brand)] px-5 py-2 text-white">
          Postani prodavac
        </Link>
      </section>
    </div>
  );
}
