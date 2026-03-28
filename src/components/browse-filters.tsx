'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function BrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      <h2 className="font-semibold">Filters</h2>
      <input name="q" defaultValue={defaults.q} className="w-full rounded border p-2 text-sm" placeholder="Search brand/model/reference" />
      <input name="brand" defaultValue={defaults.brand} className="w-full rounded border p-2 text-sm" placeholder="Brand slug (e.g. rolex)" />
      <input name="model" defaultValue={defaults.model} className="w-full rounded border p-2 text-sm" placeholder="Model slug" />
      <div className="grid grid-cols-2 gap-2">
        <input name="minPrice" defaultValue={defaults.minPrice} className="rounded border p-2 text-sm" placeholder="Min price" />
        <input name="maxPrice" defaultValue={defaults.maxPrice} className="rounded border p-2 text-sm" placeholder="Max price" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="yearFrom" defaultValue={defaults.yearFrom} className="rounded border p-2 text-sm" placeholder="Year from" />
        <input name="yearTo" defaultValue={defaults.yearTo} className="rounded border p-2 text-sm" placeholder="Year to" />
      </div>
      <select name="condition" defaultValue={defaults.condition} className="w-full rounded border p-2 text-sm">
        <option value="">Any condition</option>
        <option value="NEW">New</option>
        <option value="LIKE_NEW">Like New</option>
        <option value="VERY_GOOD">Very Good</option>
        <option value="GOOD">Good</option>
        <option value="FAIR">Fair</option>
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input name="locationCountry" defaultValue={defaults.locationCountry} className="rounded border p-2 text-sm" placeholder="Country" />
        <input name="locationCity" defaultValue={defaults.locationCity} className="rounded border p-2 text-sm" placeholder="City" />
      </div>
      <select
        name="sellerVerification"
        defaultValue={defaults.sellerVerification}
        className="w-full rounded border p-2 text-sm"
      >
        <option value="">Any seller verification</option>
        <option value="BASIC_VERIFIED">Basic verified</option>
        <option value="ENHANCED_VERIFIED">Enhanced verified</option>
      </select>
      <select name="hasBox" defaultValue={defaults.hasBox} className="w-full rounded border p-2 text-sm">
        <option value="">Box: any</option>
        <option value="true">With box</option>
        <option value="false">No box</option>
      </select>
      <select name="hasPapers" defaultValue={defaults.hasPapers} className="w-full rounded border p-2 text-sm">
        <option value="">Papers: any</option>
        <option value="true">With papers</option>
        <option value="false">No papers</option>
      </select>
      <select name="sort" defaultValue={defaults.sort} className="w-full rounded border p-2 text-sm">
        <option value="newest">Newest</option>
        <option value="price_asc">Price low to high</option>
        <option value="price_desc">Price high to low</option>
        <option value="year_desc">Year desc</option>
      </select>
      <div className="flex gap-2">
        <button className="rounded bg-[var(--brand)] px-3 py-1.5 text-sm text-white" type="submit">
          Apply
        </button>
        <button
          className="rounded border border-[var(--line)] px-3 py-1.5 text-sm"
          type="button"
          onClick={() => router.push('/browse')}
        >
          Clear filters
        </button>
      </div>
    </form>
  );
}
