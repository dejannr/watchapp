'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNotify } from '@/components/notifications-provider';
import { ApiError, apiRequest } from '@/lib/api';
import { countryOptions, sellerApplySchema } from '@/lib/validations';

type FormValues = z.infer<typeof sellerApplySchema>;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  const { register, handleSubmit, formState, setValue } = useForm<FormValues>({
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
      const payload = {
        ...values,
        businessName: values.displayName,
      };
      if (mode === 'resubmit' && applicationId) {
        await apiRequest(`/seller-application/${applicationId}/resubmit`, 'PATCH', payload, true);
      } else {
        await apiRequest('/seller-application', 'POST', payload, true);
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
    <form onSubmit={onSubmit} className="card mx-auto max-w-xl space-y-4 p-5">
      <h1 className="text-xl font-bold">Prijava za prodavca</h1>

      <section className="space-y-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Tip prodavca <span className="text-red-600">*</span>
          </label>
          <select className="w-full rounded border p-2" {...register('sellerType')}>
            <option value="PRIVATE">Privatni prodavac</option>
            <option value="BUSINESS">Kompanija / Diler</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Javno ime <span className="text-red-600">*</span>
          </label>
          <input
            className="w-full rounded border p-2"
            placeholder="Javno ime"
            {...register('displayName', {
              onChange: (event) => {
                const nextSlug = toSlug(String(event.target.value ?? ''));
                setValue('slug', nextSlug, { shouldValidate: true, shouldDirty: true });
              },
            })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Javni slug <span className="text-red-600">*</span>
          </label>
          <input className="w-full rounded border p-2" placeholder="Javni slug" {...register('slug')} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Kratka biografija <span className="text-red-600">*</span>
          </label>
          <textarea className="w-full rounded border p-2" placeholder="Kratka biografija" {...register('bio')} />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Država <span className="text-red-600">*</span>
            </label>
            <select className="w-full rounded border p-2" {...register('locationCountry')}>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Grad <span className="text-red-600">*</span>
            </label>
            <input className="w-full rounded border p-2" placeholder="Grad" {...register('locationCity')} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Kontakt e-pošta</label>
          <input className="w-full rounded border p-2" placeholder="Kontakt e-pošta" {...register('contactEmail')} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Kontakt telefon</label>
          <input className="w-full rounded border p-2" placeholder="Kontakt telefon" {...register('contactPhone')} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Veb sajt URL</label>
          <input className="w-full rounded border p-2" placeholder="Veb sajt URL" {...register('websiteUrl')} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Instagram korisničko ime</label>
          <input
            className="w-full rounded border p-2"
            placeholder="Instagram korisničko ime"
            {...register('instagramHandle')}
          />
        </div>
      </section>

      <div className="space-y-1.5">
        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
      </div>

      <div>
        <button
          className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? 'Slanje...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
