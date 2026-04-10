'use client';

import { useMemo, useState } from 'react';

type ListingImage = {
  id?: string;
  url: string;
  altText?: string | null;
};

export function ListingGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const safeImages = useMemo(() => images.filter((img) => typeof img?.url === 'string' && img.url.length > 0), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (safeImages.length === 0) {
    return (
      <div className="card flex aspect-square items-center justify-center p-4 text-sm text-[var(--muted)]">
        Fotografije nisu dostupne za ovaj oglas.
      </div>
    );
  }

  const active = safeImages[Math.min(activeIndex, safeImages.length - 1)];

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.altText ?? title}
          className="aspect-square w-full bg-[var(--bg)] object-cover"
        />
      </div>
      {safeImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
          {safeImages.map((img, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={img.id ?? `${img.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`overflow-hidden rounded border transition ${
                  selected
                    ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]'
                    : 'border-[var(--line)] hover:border-[var(--text)]/50'
                }`}
                aria-label={`Fotografija ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.altText ?? `${title} thumbnail ${index + 1}`}
                  className="aspect-square w-full bg-[var(--bg)] object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
