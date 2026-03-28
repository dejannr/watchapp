'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNotify } from '@/components/notifications-provider';
import { ApiError, apiRequest } from '@/lib/api';
import { sellerApplySchema } from '@/lib/validations';

type FormValues = z.infer<typeof sellerApplySchema>;

export function SellerApplyForm({
  initialValues,
  submitLabel = 'Apply',
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
      locationCountry: initialValues?.locationCountry ?? '',
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
      setSuccess('Application submitted successfully.');
      notify.success('Seller application submitted successfully.');
      onSubmitted?.();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('You must login before submitting seller application. Redirecting to login...');
        notify.info('Please login first. Redirecting...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 900);
        return;
      }
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  });

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-xl space-y-3 p-5">
      <h1 className="text-xl font-bold">Seller Application</h1>
      <select className="w-full rounded border p-2" {...register('sellerType')}>
        <option value="PRIVATE">Private Seller</option>
        <option value="BUSINESS">Business / Dealer</option>
      </select>
      <input className="w-full rounded border p-2" placeholder="Display name" {...register('displayName')} />
      <input className="w-full rounded border p-2" placeholder="Business name (if business)" {...register('businessName')} />
      <input className="w-full rounded border p-2" placeholder="Public slug" {...register('slug')} />
      <textarea className="w-full rounded border p-2" placeholder="Short bio" {...register('bio')} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" placeholder="City" {...register('locationCity')} />
        <input
          className="w-full rounded border p-2"
          placeholder="Country"
          {...register('locationCountry')}
        />
      </div>
      <input className="w-full rounded border p-2" placeholder="Contact email" {...register('contactEmail')} />
      <input className="w-full rounded border p-2" placeholder="Contact phone" {...register('contactPhone')} />
      <input className="w-full rounded border p-2" placeholder="Website URL" {...register('websiteUrl')} />
      <input className="w-full rounded border p-2" placeholder="Instagram handle" {...register('instagramHandle')} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <button
        className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? 'Submitting...' : submitLabel}
      </button>
    </form>
  );
}
