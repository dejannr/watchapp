'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { faBoxOpen, faCheck, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError, apiFormRequest, apiRequest } from '@/lib/api';
import { useCities, useCountries } from '@/hooks/use-locations';
import { listingSchema } from '@/lib/validations';
import { useNotify } from '@/components/notifications-provider';

type ListingResponse = {
  id: string;
  title: string;
  description: string;
  brandId: string;
  priceAmount: number;
  discountedPriceAmount?: number;
  condition: 'NEW' | 'LIKE_NEW' | 'VERY_GOOD' | 'GOOD' | 'FAIR';
  locationCity?: string;
  locationCountry?: string;
  referenceNumber?: string;
  yearOfProduction?: number;
  movementType?:
    | 'AUTOMATIC'
    | 'MANUAL'
    | 'QUARTZ'
    | 'SOLAR'
    | 'KINETIC'
    | 'DIGITAL'
    | 'SMART'
    | 'OTHER';
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
type PendingImage = {
  id: string;
  file: File;
  url: string;
};
type PreviewImage = {
  id: string;
  url: string;
  isLocal: boolean;
  file?: File;
};
const MAX_IMAGES = 10;
const CURRENT_YEAR = new Date().getFullYear();
const BRACELET_MATERIAL_OPTIONS = [
  'Koža',
  'Metal',
  'Guma',
  'Silikon',
  'Najlon',
  'Tekstil',
  'Plastika',
  'Keramika',
  'Titanijum',
  'Drugo',
] as const;
const CASE_MATERIAL_OPTIONS = [
  'Nerđajući čelik',
  'Titanijum',
  'Aluminijum',
  'Zlato',
  'Platina',
  'Keramika',
  'Bronza',
  'Mesing',
  'Plastika',
  'Smola',
  'Drugo',
] as const;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Učitavanje slike ${file.name} nije uspelo`));
    reader.readAsDataURL(file);
  });
}

export function ListingForm({ listingId }: { listingId?: string }) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [brands, setBrendovi] = useState<Brend[]>([]);
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [isFileDropActive, setIsFileDropActive] = useState(false);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [isLoadingListing, setIsLoadingListing] = useState(Boolean(listingId));
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [sellerDefaultCountry, setSellerDefaultCountry] = useState('');
  const [sellerDefaultCity, setSellerDefaultCity] = useState('');
  const [listingStatus, setListingStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();
  const isIzmeni = Boolean(listingId);

  const { register, handleSubmit, formState, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      brandId: '',
      priceAmount: undefined,
      discountedPriceAmount: undefined,
      condition: 'VERY_GOOD',
      locationCity: '',
      locationCountry: '',
      referenceNumber: '',
      yearOfProduction: undefined,
      movementType: undefined,
      caseMaterial: '',
      braceletMaterial: '',
      hasBox: false,
      hasPapers: false,
      inquiryEnabled: true,
    },
  });

  const targetId = useMemo(() => listingId ?? createdId, [listingId, createdId]);
  const locationCountryField = register('locationCountry');
  const locationCityField = register('locationCity');
  const selectedDržava = watch('locationCountry');
  const selectedGrad = watch('locationCity');
  const selectedCaseMaterial = watch('caseMaterial');
  const selectedBraceletMaterial = watch('braceletMaterial');
  const hasBoxSelected = watch('hasBox');
  const hasPapersSelected = watch('hasPapers');
  const countries = useCountries();
  const cities = useCities(selectedDržava ?? '');
  const cityOptions = useMemo(() => {
    if (!selectedGrad) return cities;
    if (cities.includes(selectedGrad)) return cities;
    return [selectedGrad, ...cities];
  }, [cities, selectedGrad]);
  const braceletMaterialOptions = useMemo(() => {
    if (!selectedBraceletMaterial) return [...BRACELET_MATERIAL_OPTIONS];
    if ((BRACELET_MATERIAL_OPTIONS as readonly string[]).includes(selectedBraceletMaterial)) {
      return [...BRACELET_MATERIAL_OPTIONS];
    }
    return [selectedBraceletMaterial, ...BRACELET_MATERIAL_OPTIONS];
  }, [selectedBraceletMaterial]);
  const caseMaterialOptions = useMemo(() => {
    if (!selectedCaseMaterial) return [...CASE_MATERIAL_OPTIONS];
    if ((CASE_MATERIAL_OPTIONS as readonly string[]).includes(selectedCaseMaterial)) {
      return [...CASE_MATERIAL_OPTIONS];
    }
    return [selectedCaseMaterial, ...CASE_MATERIAL_OPTIONS];
  }, [selectedCaseMaterial]);

  useEffect(() => {
    if (isIzmeni) return;
    let active = true;
    void apiRequest<{ locationCountry?: string; locationCity?: string }>(
      '/seller/default-location',
      'GET',
      undefined,
      true,
      {
        suppressErrorToast: true,
        suppressLoadingIndicator: true,
      },
    )
      .then((resolved) => {
        if (!active) return;
        console.log('[listing-prefill] /seller/default-location response:', resolved);
        const country = resolved?.locationCountry?.trim() || '';
        const city = resolved?.locationCity?.trim() || '';
        console.log('[listing-prefill] resolved country/city:', { country, city });
        setSellerDefaultCountry(country);
        setSellerDefaultCity(city);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isIzmeni]);

  useEffect(() => {
    if (isIzmeni) return;
    if (!sellerDefaultCountry) return;
    const currentCountry = (selectedDržava ?? '').trim();
    console.log('[listing-prefill] apply country check:', {
      sellerDefaultCountry,
      currentCountry,
    });
    if (currentCountry.length > 0) return;
    console.log('[listing-prefill] applying country:', sellerDefaultCountry);
    setValue('locationCountry', sellerDefaultCountry, { shouldDirty: false });
  }, [isIzmeni, sellerDefaultCountry, selectedDržava, setValue]);

  useEffect(() => {
    if (isIzmeni) return;
    if (!sellerDefaultCity) return;
    const currentCity = (selectedGrad ?? '').trim();
    console.log('[listing-prefill] apply city check:', {
      sellerDefaultCity,
      currentCity,
      selectedCountry: selectedDržava,
      cityOptionsCount: cityOptions.length,
    });
    if (currentCity.length > 0) return;
    console.log('[listing-prefill] applying city:', sellerDefaultCity);
    setValue('locationCity', sellerDefaultCity, { shouldDirty: false });
  }, [isIzmeni, sellerDefaultCity, selectedGrad, selectedDržava, cityOptions.length, setValue]);

  const queueFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const freeSlots = Math.max(0, MAX_IMAGES - previewImages.length);
    if (freeSlots <= 0) {
      notify.error('Maksimalno 10 slika po oglasu.');
      return;
    }
    const accepted = incoming.slice(0, freeSlots);
    if (incoming.length > freeSlots) {
      notify.error('Neke slike nisu dodate jer je maksimum 10.');
    }
    void Promise.all(
      accepted.map(async (file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: await readFileAsDataUrl(file),
      })),
    ).then((next) => {
      setPendingImages((prev) => [...prev, ...next]);
      setPreviewImages((prev) => [
        ...prev,
        ...next.map((img) => ({
          id: img.id,
          url: img.url,
          isLocal: true,
          file: img.file,
        })),
      ]);
    });
  };

  const removePendingImage = (imageId: string) => {
    setPendingImages((prev) => prev.filter((image) => image.id !== imageId));
    setPreviewImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const removeExistingImage = async (imageId: string) => {
    const editableId = targetId;
    if (!editableId) return;
    try {
      await apiRequest(`/uploads/listings/${editableId}/images/${imageId}`, 'DELETE', undefined, true, {
        suppressErrorToast: true,
        suppressLoadingIndicator: true,
      });
      setImages((prev) => prev.filter((image) => image.id !== imageId));
      setPreviewImages((prev) => prev.filter((image) => image.id !== imageId));
      notify.success('Slika je uklonjena.');
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Brisanje slike nije uspelo');
    }
  };

  const reorderImages = async (
    fromImageId: string,
    toImageId: string,
  ) => {
    if (fromImageId === toImageId) return;
    const fromIndex = previewImages.findIndex((img) => img.id === fromImageId);
    const toIndex = previewImages.findIndex((img) => img.id === toImageId);
    if (fromIndex < 0 || toIndex < 0) return;
    const reordered = [...previewImages];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setPreviewImages(reordered);
    setImages(
      reordered
        .filter((img) => !img.isLocal)
        .map((img) => ({ id: img.id, url: img.url })),
    );
    setPendingImages(
      reordered
        .filter((img) => img.isLocal && img.file)
        .map((img) => ({
          id: img.id,
          file: img.file!,
          url: img.url,
        })),
    );
  };

  const pendingFilesInOrder = useMemo(
    () =>
      previewImages
        .filter((img): img is PreviewImage & { isLocal: true; file: File } => img.isLocal && Boolean(img.file))
        .map((img) => img.file),
    [previewImages],
  );

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

  const loadListing = async (id: string) => {
    const data = await apiRequest<ListingResponse>(`/seller/listings/${id}`, 'GET', undefined, true, {
      suppressLoadingIndicator: true,
      suppressErrorToast: true,
    });
    reset({
      title: data.title ?? '',
      description: data.description ?? '',
      brandId: data.brandId ?? '',
      priceAmount: data.priceAmount ?? undefined,
      discountedPriceAmount: data.discountedPriceAmount,
      condition: data.condition ?? 'VERY_GOOD',
      locationCity: data.locationCity ?? '',
      locationCountry: data.locationCountry ?? '',
      referenceNumber: data.referenceNumber ?? '',
      yearOfProduction: data.yearOfProduction,
      movementType: data.movementType ?? undefined,
      caseMaterial: data.caseMaterial ?? '',
      braceletMaterial: data.braceletMaterial ?? '',
      hasBox: Boolean(data.hasBox),
      hasPapers: Boolean(data.hasPapers),
      inquiryEnabled: data.inquiryEnabled ?? true,
    });
    setImages(Array.isArray(data.images) ? data.images : []);
    setPendingImages([]);
    setPreviewImages(
      Array.isArray(data.images)
        ? data.images.map((img) => ({
            id: img.id,
            url: img.url,
            isLocal: false,
          }))
        : [],
    );
    setListingStatus(data.status ?? null);
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
    const payload = {
      ...values,
      movementType: values.movementType || undefined,
      inquiryEnabled: true,
    };
    const editableId = listingId ?? createdId;
    if (editableId) {
      const updated = await apiRequest<ListingResponse>(
        `/seller/listings/${editableId}`,
        'PATCH',
        payload,
        true,
      );
      return { id: editableId, status: updated.status };
    }
    const created = await apiRequest<ListingResponse>('/seller/listings', 'POST', payload, true);
    setCreatedId(created.id);
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
    if (
      values.discountedPriceAmount &&
      Number(values.discountedPriceAmount) >= Number(values.priceAmount)
    ) {
      notify.error('Snižena cena mora biti manja od regularne cene.');
      return;
    }
    if (!values.locationCountry || values.locationCountry.trim().length === 0) {
      notify.error('Država je obavezna.');
      return;
    }
    if (previewImages.length === 0) {
      notify.error('Slika je obavezna pre čuvanja oglasa.');
      return;
    }
    try {
      const result = await upsertDraft(values);
      const desiredOrder = previewImages.map((image) => image.id);
      const existingImageIds = previewImages
        .filter((image) => !image.isLocal)
        .map((image) => image.id);
      let uploadedImageIds: string[] = [];
      if (pendingFilesInOrder.length > 0) {
        const form = new FormData();
        pendingFilesInOrder.forEach((file) => form.append('files', file));
        const uploadResult = await apiFormRequest<{ items?: Array<{ id: string }> }>(
          `/uploads/listings/${result.id}/images`,
          'POST',
          form,
          true,
        );
        uploadedImageIds = Array.isArray(uploadResult.items)
          ? uploadResult.items.map((item) => item.id)
          : [];
      }
      const finalImageIds = desiredOrder.map((imageId) => {
        const previewImage = previewImages.find((image) => image.id === imageId);
        if (!previewImage) return imageId;
        if (!previewImage.isLocal) return imageId;
        return uploadedImageIds.shift() ?? imageId;
      });
      if (finalImageIds.length > 0) {
        await apiRequest(
          `/uploads/listings/${result.id}/images/order`,
          'PATCH',
          { imageIds: finalImageIds },
          true,
          {
            suppressErrorToast: true,
            suppressLoadingIndicator: true,
          },
        );
      } else if (existingImageIds.length > 0) {
        await apiRequest(
          `/uploads/listings/${result.id}/images/order`,
          'PATCH',
          { imageIds: existingImageIds },
          true,
          {
            suppressErrorToast: true,
            suppressLoadingIndicator: true,
          },
        );
      }
      await loadListing(result.id);
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
        throw new Error('Prvo sačuvajte oglas.');
      }
      await apiRequest(`/seller/listings/${id}/submit`, 'POST', {}, true);
      notify.success('Oglas je poslat administratoru na proveru.');
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Slanje nije uspelo');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isIzmeni && isLoadingListing) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="card flex items-center gap-3 p-4 text-sm text-[var(--muted)]">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
          Učitavanje oglasa...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSaveDraft} className="mx-auto max-w-6xl space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-bold">{isIzmeni ? 'Izmeni oglas' : 'Kreiraj oglas'}</h1>
        <p className="text-sm text-[var(--muted)]">
          Možete sačuvati oglas u bilo kom trenutku. Pošaljite ga kada su obavezni podaci i slike kompletni.
        </p>
      </div>

      {isIzmeni && (
        <ListingModerationFeedback listingId={listingId!} />
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

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--muted)]">
              Pregled slika ({previewImages.length}){' '}
              {previewImages.length > 1 ? '· prevucite za redosled prikaza' : ''}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previewImages.map((img, index) => (
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
                  className={`group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm transition duration-200 ${
                    draggingImageId === img.id ? 'scale-[0.98] opacity-70' : 'hover:-translate-y-0.5 hover:shadow-md'
                  } ${img.isLocal ? 'ring-1 ring-dashed ring-[var(--brand)]/35' : ''}`}
                >
                  <img
                    src={img.url}
                    alt={`Listing ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  <button
                    type="button"
                    className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
                    onClick={() => {
                      if (img.isLocal) {
                        removePendingImage(img.id);
                        return;
                      }
                      void removeExistingImage(img.id);
                    }}
                    aria-label={img.isLocal ? 'Ukloni novu sliku' : 'Ukloni postojeću sliku'}
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      style={{ width: 8, height: 8 }}
                      aria-hidden="true"
                    />
                  </button>
                  {img.isLocal && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                      Novi
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {index + 1}
                  </span>
                </div>
              ))}
              {previewImages.length === 0 && (
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                Naslov <span className="text-red-600">*</span>
              </label>
              <input className="w-full rounded border p-2" placeholder="Naslov" {...register('title')} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                Brend <span className="text-red-600">*</span>
              </label>
              <select className="w-full rounded border p-2" {...register('brandId')}>
                <option value="">Izaberite</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Referentni broj</label>
              <input className="w-full rounded border p-2" placeholder="Referentni broj" {...register('referenceNumber')} />
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Detalji i specifikacije</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Godina proizvodnje</label>
                <input
                  className="w-full rounded border p-2"
                  type="number"
                  placeholder="Godina proizvodnje"
                  min={1900}
                  max={CURRENT_YEAR}
                  {...register('yearOfProduction', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Mehanizam</label>
                <select className="w-full rounded border p-2" {...register('movementType')}>
                  <option value="">Izaberite</option>
                  <option value="QUARTZ">Kvarcni</option>
                  <option value="AUTOMATIC">Automatski</option>
                  <option value="MANUAL">Ručno navijanje</option>
                  <option value="SOLAR">Solarni</option>
                  <option value="KINETIC">Kinetički</option>
                  <option value="DIGITAL">Digitalni</option>
                  <option value="SMART">Pametni</option>
                  <option value="OTHER">Drugo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Materijal kućišta</label>
                <select className="w-full rounded border p-2" {...register('caseMaterial')}>
                  <option value="">Izaberite</option>
                  {caseMaterialOptions.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Materijal narukvice</label>
                <select className="w-full rounded border p-2" {...register('braceletMaterial')}>
                  <option value="">Izaberite</option>
                  {braceletMaterialOptions.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Stanje i oprema</h2>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                Stanje <span className="text-red-600">*</span>
              </label>
              <select className="w-full rounded border p-2" {...register('condition')}>
                <option value="NEW">Novo</option>
                <option value="LIKE_NEW">Kao novo</option>
                <option value="VERY_GOOD">Vrlo dobro</option>
                <option value="GOOD">Dobro</option>
                <option value="FAIR">Solidno</option>
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="group relative">
                <input type="checkbox" className="peer sr-only" {...register('hasBox')} />
                <div
                  className={`relative flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    hasBoxSelected
                      ? 'border-[var(--brand)] bg-[var(--line)] shadow-[0_0_0_1px_var(--brand)]'
                      : 'border-[var(--line)] bg-[var(--card)]'
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                      hasBoxSelected
                        ? 'bg-[var(--bg)] text-[var(--text)]'
                        : 'bg-[var(--bg)] text-[var(--muted)]'
                    }`}
                  >
                    <FontAwesomeIcon icon={faBoxOpen} className={`h-4 w-4 ${hasBoxSelected ? '' : 'opacity-85'}`} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      className={`transition ${
                        hasBoxSelected ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--muted)]'
                      }`}
                    >
                      Kutija uključena
                    </span>
                  </span>
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                      hasBoxSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                        : 'border-[var(--line)] bg-[var(--bg)] text-transparent'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCheck} className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </label>
              <label className="group relative">
                <input type="checkbox" className="peer sr-only" {...register('hasPapers')} />
                <div
                  className={`relative flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    hasPapersSelected
                      ? 'border-[var(--brand)] bg-[var(--line)] shadow-[0_0_0_1px_var(--brand)]'
                      : 'border-[var(--line)] bg-[var(--card)]'
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                      hasPapersSelected
                        ? 'bg-[var(--bg)] text-[var(--text)]'
                        : 'bg-[var(--bg)] text-[var(--muted)]'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFileLines} className={`h-4 w-4 ${hasPapersSelected ? '' : 'opacity-85'}`} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      className={`transition ${
                        hasPapersSelected ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--muted)]'
                      }`}
                    >
                      Papiri uključeni
                    </span>
                  </span>
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                      hasPapersSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                        : 'border-[var(--line)] bg-[var(--bg)] text-transparent'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCheck} className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </label>
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Cena i lokacija</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Cena <span className="text-red-600">*</span>
                </label>
                <input className="w-full rounded border p-2" type="number" placeholder="Cena" {...register('priceAmount', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Snižena cena</label>
                <input
                  className="w-full rounded border p-2"
                  type="number"
                  placeholder="Snižena cena"
                  {...register('discountedPriceAmount', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Država <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full rounded border p-2"
                  name={locationCountryField.name}
                  ref={locationCountryField.ref}
                  onBlur={locationCountryField.onBlur}
                  onChange={locationCountryField.onChange}
                  value={selectedDržava ?? ''}
                >
                  <option value="">Izaberite</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Grad</label>
                <select
                  className="w-full rounded border p-2"
                  name={locationCityField.name}
                  ref={locationCityField.ref}
                  onBlur={locationCityField.onBlur}
                  onChange={locationCityField.onChange}
                  value={selectedGrad ?? ''}
                >
                  <option value="">
                    {selectedDržava ? 'Izaberite' : 'Prvo izaberite državu'}
                  </option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold">Opis</h2>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                Opis <span className="text-red-600">*</span>
              </label>
              <textarea
                className="w-full rounded border p-2"
                rows={8}
                placeholder="Detaljan opis"
                {...register('description')}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <button
          className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={formState.isSubmitting}
          type="submit"
        >
          {formState.isSubmitting ? 'Čuvanje...' : 'Sačuvaj oglas'}
        </button>
        {listingStatus !== 'PUBLISHED' && (
          <button
            className="rounded border border-[var(--line)] px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmittingReview}
            type="button"
            onClick={() => void submitForReview()}
          >
            {isSubmittingReview ? 'Slanje...' : 'Pošalji na proveru'}
          </button>
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
      <p className="font-semibold">Povratna informacija moderacije</p>
      <p>Razlog: {data.rejectionReasonCode || 'Nije navedeno'}</p>
      <p>Napomena: {data.rejectionNote || 'Nema dodatne napomene.'}</p>
    </div>
  );
}
