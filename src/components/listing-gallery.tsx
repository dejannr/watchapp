'use client';

import { useEffect, useMemo, useState } from 'react';

type ListingImage = {
  id?: string;
  url: string;
  altText?: string | null;
};

export function ListingGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const safeImages = useMemo(() => images.filter((img) => typeof img?.url === 'string' && img.url.length > 0), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const hasMultiple = safeImages.length > 1;
  const goPrev = () => {
    if (!hasMultiple) return;
    setActiveIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
  };
  const goNext = () => {
    if (!hasMultiple) return;
    setActiveIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
      if (event.key === 'ArrowLeft' && hasMultiple) {
        setActiveIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
      }
      if (event.key === 'ArrowRight' && hasMultiple) {
        setActiveIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, hasMultiple, safeImages.length]);

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
      <div className="group card relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.altText ?? title}
          className="aspect-square w-full cursor-zoom-in bg-[var(--bg)] object-cover"
          onClick={() => setIsOpen(true)}
        />
        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Prethodna fotografija"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-black/10 bg-white/90 p-2 text-black shadow-md transition hover:bg-white md:opacity-0 md:group-hover:opacity-100"
              onClick={goPrev}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Sledeća fotografija"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-black/10 bg-white/90 p-2 text-black shadow-md transition hover:bg-white md:opacity-0 md:group-hover:opacity-100"
              onClick={goNext}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
              {activeIndex + 1} / {safeImages.length}
            </div>
          </>
        )}
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

      {isOpen && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/88 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative w-full max-w-7xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between text-sm text-white/85">
              <span>{title}</span>
              <button type="button" aria-label="Zatvori galeriju" className="rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.url}
                alt={active.altText ?? title}
                className="max-h-[84vh] w-full rounded bg-black object-contain"
              />
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    aria-label="Prethodna fotografija"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow-md hover:bg-white"
                    onClick={goPrev}
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Sledeća fotografija"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow-md hover:bg-white"
                    onClick={goNext}
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                    {activeIndex + 1} / {safeImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
