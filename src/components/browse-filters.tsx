'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function BrowseFilters() {
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
        router.push(`${pathname}?${query.toString()}`);
      }}
    >
      <h2 className="font-semibold">Find Your Watch</h2>

      <div className="grid gap-2 md:grid-cols-6">
        <input
          name="q"
          defaultValue={defaults.q}
          className="rounded border p-2 text-sm md:col-span-2"
          placeholder="Search"
        />
        <input
          name="brand"
          defaultValue={defaults.brand}
          className="rounded border p-2 text-sm"
          placeholder="Brand slug"
        />
        <input
          name="minPrice"
          defaultValue={defaults.minPrice}
          className="rounded border p-2 text-sm"
          placeholder="Min price"
        />
        <input
          name="maxPrice"
          defaultValue={defaults.maxPrice}
          className="rounded border p-2 text-sm"
          placeholder="Max price"
        />
        <select name="condition" defaultValue={defaults.condition} className="rounded border p-2 text-sm">
          <option value="">Any condition</option>
          <option value="NEW">New</option>
          <option value="LIKE_NEW">Like New</option>
          <option value="VERY_GOOD">Very Good</option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
        </select>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <select name="sort" defaultValue={defaults.sort} className="w-full rounded border p-2 text-sm">
          <option value="newest">Newest</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
          <option value="year_desc">Year desc</option>
        </select>
        <button className="rounded bg-[var(--brand)] px-3 py-1.5 text-sm text-white" type="submit">
          Apply
        </button>
        <button
          className="rounded border border-[var(--line)] px-3 py-1.5 text-sm"
          type="button"
          onClick={() => router.push('/browse')}
        >
          Clear
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
        Advanced filters
      </button>

      {advancedOpen && (
        <div className="grid gap-2 border-t border-[var(--line)] pt-3 md:grid-cols-4">
          <input name="model" defaultValue={defaults.model} className="rounded border p-2 text-sm" placeholder="Model slug" />
          <input name="yearFrom" defaultValue={defaults.yearFrom} className="rounded border p-2 text-sm" placeholder="Year from" />
          <input name="yearTo" defaultValue={defaults.yearTo} className="rounded border p-2 text-sm" placeholder="Year to" />
          <select
            name="sellerVerification"
            defaultValue={defaults.sellerVerification}
            className="rounded border p-2 text-sm"
          >
            <option value="">Any seller verification</option>
            <option value="BASIC_VERIFIED">Basic verified</option>
            <option value="ENHANCED_VERIFIED">Enhanced verified</option>
          </select>
          <input name="locationCountry" defaultValue={defaults.locationCountry} className="rounded border p-2 text-sm" placeholder="Country" />
          <input name="locationCity" defaultValue={defaults.locationCity} className="rounded border p-2 text-sm" placeholder="City" />
          <select name="hasBox" defaultValue={defaults.hasBox} className="rounded border p-2 text-sm">
            <option value="">Box: any</option>
            <option value="true">With box</option>
            <option value="false">No box</option>
          </select>
          <select name="hasPapers" defaultValue={defaults.hasPapers} className="rounded border p-2 text-sm">
            <option value="">Papers: any</option>
            <option value="true">With papers</option>
            <option value="false">No papers</option>
          </select>
        </div>
      )}
    </form>
  );
}
