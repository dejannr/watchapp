'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError, apiFormRequest, apiRequest } from '@/lib/api';
import { listingSchema } from '@/lib/validations';

type ListingResponse = {
  id: string;
  title: string;
  description: string;
  brandId: string;
  priceAmount: number;
  condition: 'NEW' | 'LIKE_NEW' | 'VERY_GOOD' | 'GOOD' | 'FAIR';
  locationCity?: string;
  locationCountry?: string;
  referenceNumber?: string;
  yearOfProduction?: number;
  movementType?: 'AUTOMATIC' | 'MANUAL' | 'QUARTZ' | 'SMART' | 'OTHER';
  caseMaterial?: string;
  braceletMaterial?: string;
  hasBox?: boolean;
  hasPapers?: boolean;
  inquiryEnabled?: boolean;
  images?: Array<{ id: string; url: string }>;
  status?: string;
  rejectionReasonCode?: string;
  rejectionNote?: string;
};

type Brand = {
  id: string;
  name: string;
  slug: string;
};

type FormValues = z.infer<typeof listingSchema>;

export function ListingForm({ listingId }: { listingId?: string }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const isEdit = Boolean(listingId);

  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      brandId: '',
      priceAmount: 1,
      condition: 'VERY_GOOD',
      locationCity: '',
      locationCountry: '',
      referenceNumber: '',
      yearOfProduction: undefined,
      movementType: 'AUTOMATIC',
      caseMaterial: '',
      braceletMaterial: '',
      hasBox: false,
      hasPapers: false,
      inquiryEnabled: true,
    },
  });

  const targetId = useMemo(() => listingId ?? createdId, [listingId, createdId]);

  useEffect(() => {
    let active = true;
    void apiRequest<Brand[]>('/brands')
      .then((data) => {
        if (!active) return;
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const loadListing = async (id: string) => {
    const data = await apiRequest<ListingResponse>(`/seller/listings/${id}`, 'GET', undefined, true);
    reset({
      title: data.title ?? '',
      description: data.description ?? '',
      brandId: data.brandId ?? '',
      priceAmount: data.priceAmount ?? 1,
      condition: data.condition ?? 'VERY_GOOD',
      locationCity: data.locationCity ?? '',
      locationCountry: data.locationCountry ?? '',
      referenceNumber: data.referenceNumber ?? '',
      yearOfProduction: data.yearOfProduction,
      movementType: data.movementType ?? 'AUTOMATIC',
      caseMaterial: data.caseMaterial ?? '',
      braceletMaterial: data.braceletMaterial ?? '',
      hasBox: Boolean(data.hasBox),
      hasPapers: Boolean(data.hasPapers),
      inquiryEnabled: data.inquiryEnabled ?? true,
    });
    setImages(Array.isArray(data.images) ? data.images : []);
  };

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    void loadListing(listingId!)
      .then(() => {
        if (!active) return;
      })
      .catch((e) => {
        if (!active) return;
        setLoadError(e instanceof Error ? e.message : 'Failed to load listing');
      });
    return () => {
      active = false;
    };
  }, [isEdit, listingId, reset]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!formState.isDirty || formState.isSubmitting) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [formState.isDirty, formState.isSubmitting]);

  const upsertDraft = async (values: FormValues) => {
    const payload = { ...values };
    const editableId = listingId ?? createdId;
    if (editableId) {
      const updated = await apiRequest<ListingResponse>(
        `/seller/listings/${editableId}`,
        'PATCH',
        payload,
        true,
      );
      await loadListing(editableId);
      return { id: editableId, status: updated.status };
    }
    const created = await apiRequest<ListingResponse>('/seller/listings', 'POST', payload, true);
    setCreatedId(created.id);
    await loadListing(created.id);
    return { id: created.id, status: created.status };
  };

  const onSaveDraft = handleSubmit(async (values) => {
    setError('');
    setSuccess('');
    setNotice(null);
    if (!values.title || values.title.trim().length < 10) {
      const msg = 'Title is required (min 10 characters).';
      setError(msg);
      setNotice({ type: 'error', message: msg });
      return;
    }
    if (!values.description || values.description.trim().length < 30) {
      const msg = 'Description is required (min 30 characters).';
      setError(msg);
      setNotice({ type: 'error', message: msg });
      return;
    }
    if (!values.brandId) {
      const msg = 'Brand is required.';
      setError(msg);
      setNotice({ type: 'error', message: msg });
      return;
    }
    if (!values.priceAmount || Number(values.priceAmount) < 1) {
      const msg = 'Price is required.';
      setError(msg);
      setNotice({ type: 'error', message: msg });
      return;
    }
    if (pendingFiles.length === 0 && images.length === 0) {
      const msg = 'Image is required before saving draft.';
      setError(msg);
      setNotice({ type: 'error', message: msg });
      return;
    }
    try {
      const result = await upsertDraft(values);
      if (pendingFiles.length > 0) {
        const form = new FormData();
        form.append('files', pendingFiles[0]);
        await apiFormRequest(`/uploads/listings/${result.id}/images`, 'POST', form, true);
        setPendingFiles([]);
        await loadListing(result.id);
      }
      setSuccess(`Draft saved (${result.status ?? 'updated'}).`);
      setNotice({ type: 'success', message: `Draft saved (${result.status ?? 'updated'}).` });
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setNotice({ type: 'error', message: e.message });
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to save listing');
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Failed to save listing' });
    }
  });

  const submitForReview = async () => {
    setError('');
    setSuccess('');
    setIsSubmittingReview(true);
    try {
      const id = targetId;
      if (!id) {
        throw new Error('Save draft first.');
      }
      await apiRequest(`/seller/listings/${id}/submit`, 'POST', {}, true);
      setSuccess('Listing submitted for admin review.');
      setNotice({ type: 'success', message: 'Listing submitted for admin review.' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Submit failed' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <form onSubmit={onSaveDraft} className="mx-auto max-w-3xl space-y-4">
      {notice && (
        <div
          className={`card sticky top-3 z-20 border p-3 text-sm ${
            notice.type === 'success' ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          {notice.message}
        </div>
      )}
      <div className="card p-5">
        <h1 className="text-xl font-bold">{isEdit ? 'Edit Listing' : 'Create Listing'}</h1>
        <p className="text-sm text-[var(--muted)]">
          Save as draft anytime. Submit when required details and images are complete.
        </p>
      </div>

      {loadError && <div className="card p-4 text-sm text-red-700">{loadError}</div>}

      {isEdit && (
        <ListingModerationFeedback listingId={listingId!} />
      )}

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Basics</h2>
        <label className="text-sm font-medium">
          Title <span className="text-red-600">*</span>
        </label>
        <input className="w-full rounded border p-2" placeholder="Title" {...register('title')} />
        <label className="text-sm font-medium">
          Brand <span className="text-red-600">*</span>
        </label>
        <select className="w-full rounded border p-2" {...register('brandId')}>
          <option value="">Select brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
        <input className="w-full rounded border p-2" placeholder="Reference number" {...register('referenceNumber')} />
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Details & Specs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded border p-2" type="number" placeholder="Year of production" {...register('yearOfProduction', { valueAsNumber: true })} />
          <select className="rounded border p-2" {...register('movementType')}>
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
            <option value="QUARTZ">Quartz</option>
            <option value="SMART">Smart</option>
            <option value="OTHER">Other</option>
          </select>
          <input className="rounded border p-2" placeholder="Case material" {...register('caseMaterial')} />
          <input className="rounded border p-2" placeholder="Bracelet material" {...register('braceletMaterial')} />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Condition & Scope</h2>
        <label className="text-sm font-medium">
          Condition <span className="text-red-600">*</span>
        </label>
        <select className="w-full rounded border p-2" {...register('condition')}>
          <option value="NEW">New</option>
          <option value="LIKE_NEW">Like New</option>
          <option value="VERY_GOOD">Very Good</option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
        </select>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('hasBox')} /> Box included
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('hasPapers')} /> Papers included
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('inquiryEnabled')} /> Inquiry enabled
          </label>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Price & Location</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">
            Price <span className="text-red-600">*</span>
          </label>
          <input className="rounded border p-2" type="number" placeholder="Price" {...register('priceAmount', { valueAsNumber: true })} />
          <input className="rounded border p-2" placeholder="City" {...register('locationCity')} />
          <input className="rounded border p-2" placeholder="Country" {...register('locationCountry')} />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Media</h2>
        <p className="text-xs text-[var(--muted)]">
          Add exactly 1 image before submitting for review <span className="text-red-600">*</span>
        </p>
        <input
          className="w-full rounded border p-2"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const selected = Array.from(e.currentTarget.files ?? []);
            setPendingFiles(selected);
          }}
        />
        <p className="text-xs text-[var(--muted)]">
          {pendingFiles.length > 0
            ? `${pendingFiles[0].name} selected. It will upload when you click Save Draft.`
            : images.length > 0
              ? 'Current image is saved.'
              : 'Choose one image (required).'}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="Listing"
              className="h-24 w-full rounded border object-cover"
            />
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Description</h2>
        <label className="text-sm font-medium">
          Description <span className="text-red-600">*</span>
        </label>
        <textarea
          className="w-full rounded border p-2"
          rows={8}
          placeholder="Detailed description"
          {...register('description')}
        />
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <button
          className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={formState.isSubmitting}
          type="submit"
        >
          {formState.isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          className="rounded border border-[var(--line)] px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmittingReview}
          type="button"
          onClick={() => void submitForReview()}
        >
          {isSubmittingReview ? 'Submitting...' : 'Submit for Review'}
        </button>
        {targetId && (
          <Link href={`/seller-dashboard/listings/${targetId}`} className="text-sm text-[var(--brand)]">
            Open Listing Editor
          </Link>
        )}
      </div>
    </form>
  );
}

function ListingModerationFeedback({ listingId }: { listingId: string }) {
  const [data, setData] = useState<ListingResponse | null>(null);
  useEffect(() => {
    let active = true;
    void apiRequest<ListingResponse>(`/seller/listings/${listingId}`, 'GET', undefined, true)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [listingId]);

  if (!data || data.status !== 'REJECTED') return null;
  return (
    <div className="card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Moderation feedback</p>
      <p>Reason: {data.rejectionReasonCode || 'Not specified'}</p>
      <p>Note: {data.rejectionNote || 'No additional note.'}</p>
    </div>
  );
}
