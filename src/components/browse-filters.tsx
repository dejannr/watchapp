'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCities, useCountries } from '@/hooks/use-locations';

type BrandOption = {
  name: string;
  slug: string;
};

type BrowseFiltersProps = {
  brands: BrandOption[];
};

export function BrowseFilters({ brands }: BrowseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const defaults = useMemo(
    () => ({
      q: searchParams.get('q') ?? '',
      brand: searchParams.get('brand') ?? '',
      model: searchParams.get('model') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      yearFrom: searchParams.get('yearFrom') ?? '',
      yearTo: searchParams.get('yearTo') ?? '',
      condition: searchParams.get('condition') ?? '',
      locationCountry: searchParams.get('locationCountry') ?? '',
      locationCity: searchParams.get('locationCity') ?? '',
      hasBox: searchParams.get('hasBox') ?? '',
      hasPapers: searchParams.get('hasPapers') ?? '',
      sellerVerification: searchParams.get('sellerVerification') ?? '',
      sort: searchParams.get('sort') ?? 'newest',
    }),
    [searchParams],
  );
  const hasSelectedBrand = useMemo(
    () => brands.some((brand) => brand.slug === defaults.brand),
    [brands, defaults.brand],
  );
  const [selectedCountry, setSelectedCountry] = useState(defaults.locationCountry);
  const [selectedCity, setSelectedCity] = useState(defaults.locationCity);
  const countries = useCountries();
  const cities = useCities(selectedCountry);

  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
          const text = String(value).trim();
          if (!text) continue;
          query.set(key, text);
        }
        if (selectedCountry.trim()) {
          query.set('locationCountry', selectedCountry.trim());
        } else {
          query.delete('locationCountry');
        }
        if (selectedCity.trim()) {
          query.set('locationCity', selectedCity.trim());
        } else {
          query.delete('locationCity');
        }
        router.push(`${pathname}?${query.toString()}`);
      }}
    >
      <h2 className="font-semibold">Pronađite svoj sat</h2>

      <div className="grid gap-2 md:grid-cols-6">
        <input
          name="q"
          defaultValue={defaults.q}
          className="rounded border p-2 text-sm md:col-span-2"
          placeholder="Pretraga"
        />
        <select name="brand" defaultValue={defaults.brand} className="rounded border p-2 text-sm">
          <option value="">Svi brendovi</option>
          {!hasSelectedBrand && defaults.brand && <option value={defaults.brand}>{defaults.brand}</option>}
          {brands.map((brand) => (
            <option key={brand.slug} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </select>
        <input
          name="minPrice"
          defaultValue={defaults.minPrice}
          className="rounded border p-2 text-sm"
          placeholder="Min cena"
        />
        <input
          name="maxPrice"
          defaultValue={defaults.maxPrice}
          className="rounded border p-2 text-sm"
          placeholder="Maks cena"
        />
        <select name="condition" defaultValue={defaults.condition} className="rounded border p-2 text-sm">
          <option value="">Bilo koje stanje</option>
          <option value="NEW">Novo</option>
          <option value="LIKE_NEW">Kao novo</option>
          <option value="VERY_GOOD">Vrlo dobro</option>
          <option value="GOOD">Dobro</option>
          <option value="FAIR">Solidno</option>
        </select>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <select name="sort" defaultValue={defaults.sort} className="w-full rounded border p-2 text-sm">
          <option value="newest">Najnovije</option>
          <option value="price_asc">Cena od niže ka višoj</option>
          <option value="price_desc">Cena od više ka nižoj</option>
          <option value="year_desc">Godina opadajuće</option>
        </select>
        <button className="rounded bg-[var(--brand)] px-3 py-1.5 text-sm text-white" type="submit">
          Primeni
        </button>
        <button
          className="rounded border border-[var(--line)] px-3 py-1.5 text-sm"
          type="button"
          onClick={() => {
            setSelectedCountry('');
            setSelectedCity('');
            router.push('/browse');
          }}
        >
          Obriši
        </button>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : 'rotate-0'}`}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Napredni filteri
      </button>

      {advancedOpen && (
        <div className="grid gap-2 border-t border-[var(--line)] pt-3 md:grid-cols-4">
          <input name="model" defaultValue={defaults.model} className="rounded border p-2 text-sm" placeholder="Slug modela" />
          <input name="yearFrom" defaultValue={defaults.yearFrom} className="rounded border p-2 text-sm" placeholder="Godina od" />
          <input name="yearTo" defaultValue={defaults.yearTo} className="rounded border p-2 text-sm" placeholder="Godina do" />
          <select
            name="sellerVerification"
            defaultValue={defaults.sellerVerification}
            className="rounded border p-2 text-sm"
          >
            <option value="">Bilo koja verifikacija prodavca</option>
            <option value="BASIC_VERIFIED">Osnovno verifikovan</option>
            <option value="ENHANCED_VERIFIED">Napredno verifikovan</option>
          </select>
          <select
            name="locationCountry"
            value={selectedCountry}
            className="rounded border p-2 text-sm"
            onChange={(e) => {
              const nextCountry = e.target.value;
              setSelectedCountry(nextCountry);
              setSelectedCity('');
            }}
          >
            <option value="">Sve države</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <select
            name="locationCity"
            value={selectedCity}
            className="rounded border p-2 text-sm disabled:opacity-60"
            disabled={!selectedCountry}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">{selectedCountry ? 'Svi gradovi' : 'Prvo izaberite državu'}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select name="hasBox" defaultValue={defaults.hasBox} className="rounded border p-2 text-sm">
            <option value="">Kutija: bilo koja</option>
            <option value="true">Sa kutijom</option>
            <option value="false">Bez kutije</option>
          </select>
          <select name="hasPapers" defaultValue={defaults.hasPapers} className="rounded border p-2 text-sm">
            <option value="">Papiri: bilo koji</option>
            <option value="true">Sa papirima</option>
            <option value="false">Bez papira</option>
          </select>
        </div>
      )}
    </form>
  );
}
