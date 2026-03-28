'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNotify } from '@/components/notifications-provider';
import { ApiError, apiRequest } from '@/lib/api';
import { countryOptions, sellerApplySchema } from '@/lib/validations';

type FormValues = z.infer<typeof sellerApplySchema>;

export function SellerApplyForm({
  initialValues,
  submitLabel = 'Primeni',
  onSubmitted,
  mode = 'create',
  applicationId,
}: {
  initialValues?: Partial<FormValues>;
  submitLabel?: string;
  onSubmitted?: () => void;
  mode?: 'create' | 'resubmit';
  applicationId?: string;
}) {
  const notify = useNotify();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(sellerApplySchema),
    defaultValues: {
      sellerType: initialValues?.sellerType ?? 'PRIVATE',
      displayName: initialValues?.displayName ?? '',
      businessName: initialValues?.businessName ?? '',
      slug: initialValues?.slug ?? '',
      bio: initialValues?.bio ?? '',
      locationCity: initialValues?.locationCity ?? '',
      locationCountry: initialValues?.locationCountry ?? countryOptions[0],
      contactEmail: initialValues?.contactEmail ?? '',
      contactPhone: initialValues?.contactPhone ?? '',
      websiteUrl: initialValues?.websiteUrl ?? '',
      instagramHandle: initialValues?.instagramHandle ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    setSuccess('');
    try {
      if (mode === 'resubmit' && applicationId) {
        await apiRequest(`/seller-application/${applicationId}/resubmit`, 'PATCH', values, true);
      } else {
        await apiRequest('/seller-application', 'POST', values, true);
      }
      setSuccess('Prijava je uspešno poslata.');
      notify.success('Prijava za prodavca je uspešno poslata.');
      onSubmitted?.();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Morate se prijaviti pre slanja prijave za prodavca. Preusmeravanje na prijavu...');
        notify.info('Molimo prvo se prijavite. Preusmeravanje...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 900);
        return;
      }
      setError(e instanceof Error ? e.message : 'Došlo je do greške');
    }
  });

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-xl space-y-3 p-5">
      <h1 className="text-xl font-bold">Prijava za prodavca</h1>
      <select className="w-full rounded border p-2" {...register('sellerType')}>
        <option value="PRIVATE">Privatni prodavac</option>
        <option value="BUSINESS">Kompanija / Diler</option>
      </select>
      <input className="w-full rounded border p-2" placeholder="Javno ime" {...register('displayName')} />
      <input className="w-full rounded border p-2" placeholder="Naziv firme (ako je kompanija)" {...register('businessName')} />
      <input className="w-full rounded border p-2" placeholder="Javni slug" {...register('slug')} />
      <textarea className="w-full rounded border p-2" placeholder="Kratka biografija" {...register('bio')} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" placeholder="Grad" {...register('locationCity')} />
        <select className="w-full rounded border p-2" {...register('locationCountry')}>
          {countryOptions.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      <input className="w-full rounded border p-2" placeholder="Kontakt e-pošta" {...register('contactEmail')} />
      <input className="w-full rounded border p-2" placeholder="Kontakt telefon" {...register('contactPhone')} />
      <input className="w-full rounded border p-2" placeholder="Veb sajt URL" {...register('websiteUrl')} />
      <input className="w-full rounded border p-2" placeholder="Instagram korisničko ime" {...register('instagramHandle')} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <button
        className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? 'Slanje...' : submitLabel}
      </button>
    </form>
  );
}
