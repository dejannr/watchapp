'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError, apiFormRequest, apiRequest } from '@/lib/api';
import { listingSchema } from '@/lib/validations';
import { useNotify } from '@/components/notifications-provider';

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

type Brend = {
  id: string;
  name: string;
  slug: string;
};

type FormValues = z.infer<typeof listingSchema>;

const COUNTRY_OPTIONS = [
  'Srbija',
  'Crna Gora',
  'Bosna i Hercegovina',
  'Hrvatska',
  'Slovenija',
  'Makedonija',
] as const;
const MAX_IMAGES = 10;

export function ListingForm({ listingId }: { listingId?: string }) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [brands, setBrendovi] = useState<Brend[]>([]);
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isFileDropActive, setIsFileDropActive] = useState(false);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [isLoadingListing, setIsLoadingListing] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();
  const isIzmeni = Boolean(listingId);

  const { register, handleSubmit, formState, reset, watch, setValue } = useForm<FormValues>({
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
  const selectedDržava = watch('locationCountry');

  const queueFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    setPendingFiles((prev) => {
      const freeSlots = Math.max(0, MAX_IMAGES - images.length - prev.length);
      if (freeSlots <= 0) {
        notify.error('Maksimalno 10 slika po oglasu.');
        return prev;
      }
      const next = [...prev, ...incoming.slice(0, freeSlots)];
      if (incoming.length > freeSlots) {
        notify.error('Neke slike nisu dodate jer je maksimum 10.');
      }
      return next;
    });
  };

  const reorderImages = async (
    fromImageId: string,
    toImageId: string,
  ) => {
    if (fromImageId === toImageId) return;
    const fromIndex = images.findIndex((img) => img.id === fromImageId);
    const toIndex = images.findIndex((img) => img.id === toImageId);
    if (fromIndex < 0 || toIndex < 0) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setImages(reordered);
    if (!targetId) return;
    try {
      await apiRequest(
        `/uploads/listings/${targetId}/images/order`,
        'PATCH',
        { imageIds: reordered.map((img) => img.id) },
        true,
        {
          suppressErrorToast: true,
          suppressLoadingIndicator: true,
        },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Čuvanje redosleda slika nije uspelo';
      notify.error(msg);
      await loadListing(targetId);
    }
  };

  useEffect(() => {
    let active = true;
    void apiRequest<Brend[]>('/brands', 'GET', undefined, false, {
      suppressLoadingIndicator: true,
      suppressErrorToast: true,
    })
      .then((data) => {
        if (!active) return;
        setBrendovi(Array.isArray(data) ? data : []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isIzmeni) return;
    if (selectedDržava && selectedDržava.trim().length > 0) return;
    let active = true;
    void apiRequest<{ locationCountry?: string }>('/seller/me', 'GET', undefined, true, {
      suppressErrorToast: true,
      suppressLoadingIndicator: true,
    })
      .then((profile) => {
        if (!active) return;
        if (profile?.locationCountry) {
          setValue('locationCountry', profile.locationCountry);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isIzmeni, selectedDržava, setValue]);

  const loadListing = async (id: string) => {
    const data = await apiRequest<ListingResponse>(`/seller/listings/${id}`, 'GET', undefined, true, {
      suppressLoadingIndicator: true,
      suppressErrorToast: true,
    });
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
    if (!isIzmeni) return;
    let active = true;
    setIsLoadingListing(true);
    void loadListing(listingId!)
      .then(() => {
        if (!active) return;
      })
      .catch((e) => {
        if (!active) return;
        notify.error(e instanceof Error ? e.message : 'Učitavanje oglasa nije uspelo');
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingListing(false);
      });
    return () => {
      active = false;
    };
  }, [isIzmeni, listingId, reset, notify]);

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
    if (!values.title || values.title.trim().length < 10) {
      notify.error('Naslov je obavezan (min 10 karaktera).');
      return;
    }
    if (!values.description || values.description.trim().length < 30) {
      notify.error('Opis je obavezan (min 30 karaktera).');
      return;
    }
    if (!values.brandId) {
      notify.error('Brend je obavezan.');
      return;
    }
    if (!values.priceAmount || Number(values.priceAmount) < 1) {
      notify.error('Cena je obavezna.');
      return;
    }
    if (!values.locationCountry || values.locationCountry.trim().length === 0) {
      notify.error('Država je obavezna.');
      return;
    }
    if (pendingFiles.length === 0 && images.length === 0) {
      notify.error('Slika je obavezna pre čuvanja nacrta.');
      return;
    }
    try {
      const result = await upsertDraft(values);
      if (pendingFiles.length > 0) {
        const form = new FormData();
        pendingFiles.forEach((file) => form.append('files', file));
        await apiFormRequest(`/uploads/listings/${result.id}/images`, 'POST', form, true);
        setPendingFiles([]);
        await loadListing(result.id);
      }
      notify.success(`Nacrt je sačuvan (${result.status ?? 'updated'}).`);
    } catch (e) {
      if (e instanceof ApiError) {
        notify.error(e.message);
        return;
      }
      notify.error(e instanceof Error ? e.message : 'Čuvanje oglasa nije uspelo');
    }
  });

  const submitForReview = async () => {
    setIsSubmittingReview(true);
    try {
      const id = targetId;
      if (!id) {
        throw new Error('Prvo sačuvajte nacrt.');
      }
      await apiRequest(`/seller/listings/${id}/submit`, 'POST', {}, true);
      notify.success('Oglas je poslat administratoru na proveru.');
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Slanje nije uspelo');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <form onSubmit={onSaveDraft} className="mx-auto max-w-6xl space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-bold">{isIzmeni ? 'Izmeni oglas' : 'Kreiraj oglas'}</h1>
        <p className="text-sm text-[var(--muted)]">
          Sačuvajte kao nacrt u bilo kom trenutku. Pošaljite kada su obavezni podaci i slike kompletni.
        </p>
      </div>

      {isIzmeni && (
        <ListingModerationFeedback listingId={listingId!} />
      )}

      {isIzmeni && isLoadingListing && (
        <div className="card flex items-center gap-3 p-4 text-sm text-[var(--muted)]">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
          Učitavanje oglasa...
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <section className="card space-y-4 p-5 lg:sticky lg:top-4">
          <h2 className="text-lg font-semibold">Slike</h2>
          <p className="text-xs text-[var(--muted)]">
            Prevucite slike u zonu ispod ili kliknite na dugme. Maksimum je 10 slika po oglasu.
          </p>
          <div
            className={`rounded-lg border border-dashed p-4 transition ${
              isFileDropActive ? 'border-[var(--brand)] bg-[var(--line)]' : 'border-[var(--line)] bg-[var(--bg)]'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsFileDropActive(true);
            }}
            onDragLeave={() => setIsFileDropActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsFileDropActive(false);
              queueFiles(Array.from(e.dataTransfer.files ?? []));
            }}
          >
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                queueFiles(Array.from(e.currentTarget.files ?? []));
                e.currentTarget.value = '';
              }}
            />
            <div className="space-y-2 text-sm">
              <p>Drag & drop slike ovde</p>
              <button
                type="button"
                className="rounded border border-[var(--line)] px-3 py-1.5 text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Izaberi slike
              </button>
            </div>
          </div>

          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)]">
                Nove slike za upload ({pendingFiles.length})
              </p>
              <div className="space-y-1">
                {pendingFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded border border-[var(--line)] px-2 py-1 text-xs">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      className="ml-2 rounded border border-[var(--line)] px-2 py-0.5"
                      onClick={() => {
                        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      Ukloni
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--muted)]">
              Trenutne slike ({images.length}) {images.length > 1 ? '· prevucite za redosled prikaza' : ''}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => setDraggingImageId(img.id)}
                  onDragEnd={() => setDraggingImageId(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!draggingImageId) return;
                    void reorderImages(draggingImageId, img.id);
                    setDraggingImageId(null);
                  }}
                  className={`relative rounded border border-[var(--line)] ${draggingImageId === img.id ? 'opacity-60' : ''}`}
                >
                  <img
                    src={img.url}
                    alt={`Listing ${index + 1}`}
                    className="aspect-square w-full rounded bg-[var(--bg)] object-contain p-1"
                  />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {index + 1}
                  </span>
                </div>
              ))}
              {images.length === 0 && (
                <p className="col-span-2 text-xs text-[var(--muted)] sm:col-span-3">
                  {isLoadingListing ? 'Učitavanje slika...' : 'Još nema sačuvanih slika.'}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Osnovno</h2>
            <label className="text-sm font-medium">
              Naslov <span className="text-red-600">*</span>
            </label>
            <input className="w-full rounded border p-2" placeholder="Naslov" {...register('title')} />
            <label className="text-sm font-medium">
              Brend <span className="text-red-600">*</span>
            </label>
            <select className="w-full rounded border p-2" {...register('brandId')}>
              <option value="">Izaberite brend</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <input className="w-full rounded border p-2" placeholder="Referentni broj" {...register('referenceNumber')} />
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Detalji i specifikacije</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="rounded border p-2" type="number" placeholder="Godina proizvodnje" {...register('yearOfProduction', { valueAsNumber: true })} />
              <select className="rounded border p-2" {...register('movementType')}>
                <option value="AUTOMATIC">Automatski</option>
                <option value="MANUAL">Ručni</option>
                <option value="QUARTZ">Quartz</option>
                <option value="SMART">Pametni</option>
                <option value="OTHER">Drugo</option>
              </select>
              <input className="rounded border p-2" placeholder="Materijal kućišta" {...register('caseMaterial')} />
              <input className="rounded border p-2" placeholder="Materijal narukvice" {...register('braceletMaterial')} />
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Stanje i oprema</h2>
            <label className="text-sm font-medium">
              Stanje <span className="text-red-600">*</span>
            </label>
            <select className="w-full rounded border p-2" {...register('condition')}>
              <option value="NEW">Novi oglas</option>
              <option value="LIKE_NEW">Like Novi oglas</option>
              <option value="VERY_GOOD">Vrlo dobro</option>
              <option value="GOOD">Dobro</option>
              <option value="FAIR">Solidno</option>
            </select>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('hasBox')} /> Kutija uključena
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('hasPapers')} /> Papiri uključeni
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('inquiryEnabled')} /> Upiti omogućeni
              </label>
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Cena i lokacija</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                Cena <span className="text-red-600">*</span>
              </label>
              <input className="rounded border p-2" type="number" placeholder="Cena" {...register('priceAmount', { valueAsNumber: true })} />
              <select className="rounded border p-2" {...register('locationCountry')}>
                <option value="">Izaberite državu *</option>
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <input
                className="rounded border p-2 disabled:opacity-60"
                placeholder={selectedDržava ? 'Grad' : 'Prvo izaberite državu'}
                disabled={!selectedDržava}
                {...register('locationCity')}
              />
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Opis</h2>
            <label className="text-sm font-medium">
              Opis <span className="text-red-600">*</span>
            </label>
            <textarea
              className="w-full rounded border p-2"
              rows={8}
              placeholder="Detaljan opis"
              {...register('description')}
            />
          </section>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <button
          className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={formState.isSubmitting}
          type="submit"
        >
          {formState.isSubmitting ? 'Čuvanje...' : 'Sačuvaj nacrt'}
        </button>
        <button
          className="rounded border border-[var(--line)] px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmittingReview}
          type="button"
          onClick={() => void submitForReview()}
        >
          {isSubmittingReview ? 'Slanje...' : 'Pošalji na proveru'}
        </button>
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
      <p className="font-semibold">Povratna informacija moderacije</p>
      <p>Razlog: {data.rejectionReasonCode || 'Nije navedeno'}</p>
      <p>Napomena: {data.rejectionNote || 'Nema dodatne napomene.'}</p>
    </div>
  );
}
