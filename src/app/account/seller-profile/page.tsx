'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';

export default function NalogSellerProfilPage() {
  const sellerProfile = useQuery({
    queryKey: ['seller-profile-me'],
    queryFn: async () => {
      try {
        return await apiRequest('/seller/me', 'GET', undefined, true);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const data = sellerProfile.data as Record<string, unknown> | null | undefined;
  const profileItems = data
    ? [
        { label: 'Javno ime', value: data.displayName },
        { label: 'Slug', value: data.slug },
        { label: 'Tip prodavca', value: data.sellerType },
        { label: 'Biografija', value: data.bio },
        { label: 'Grad', value: data.locationCity },
        { label: 'Država', value: data.locationCountry },
        { label: 'Kontakt e-pošta', value: data.contactEmail },
        { label: 'Kontakt telefon', value: data.contactPhone },
        { label: 'Veb sajt', value: data.websiteUrl },
        { label: 'Instagram', value: data.instagramHandle },
      ].filter((item) => String(item.value ?? '').trim().length > 0)
    : [];

  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Profil prodavca</h1>
        {sellerProfile.isLoading ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Učitavanje...</p>
        ) : sellerProfile.data ? (
          profileItems.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {profileItems.map((item) => (
                <div key={item.label} className="grid grid-cols-[160px_1fr] gap-2 text-sm">
                  <span className="text-[var(--muted)]">{item.label}</span>
                  <span className="font-medium break-all">{String(item.value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Profil prodavca je kreiran, ali trenutno nema dodatnih podataka za prikaz.
            </p>
          )
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Profil prodavca još ne postoji za ovaj nalog.
          </p>
        )}
      </div>
    </div>
  );
}
