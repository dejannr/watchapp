'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNotify } from '@/components/notifications-provider';
import { ApiError, apiRequest } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { getAccessToken } from '@/lib/auth';
import { inquirySchema } from '@/lib/validations';

type FormValues = z.infer<typeof inquirySchema>;

export function InquiryForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const notify = useNotify();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [started, setStarted] = useState(false);
  const draftKey = `watchapp_inquiry_draft:${listingId}`;
  const { register, handleSubmit, setValue, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(inquirySchema),
  });

  useEffect(() => {
    const draft = sessionStorage.getItem(draftKey);
    if (draft) {
      setValue('message', draft);
    }
  }, [draftKey, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    setSuccess('');
    sessionStorage.setItem(draftKey, values.message);

    const token = getAccessToken();
    if (!token) {
      const message = 'Morate biti prijavljeni da biste poslali upit.';
      notify.info(message);
      setError(message);
      return;
    }

    try {
      const result = await apiRequest<{ id: string; chatId?: string }>(
        '/inquiries',
        'POST',
        { listingId, ...values },
        true,
      );
      sessionStorage.removeItem(draftKey);
      reset();
      setSuccess('Upit je poslat. Prodavac je obavešten.');
      notify.success('Upit je poslat. Prodavac je obavešten.');
      if (result.chatId) {
        router.push(`/chats/${result.chatId}`);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          const message = 'Sesija je istekla. Prijavite se ponovo da biste poslali upit.';
          notify.info(message);
          setError(message);
          return;
        }
        if (e.status === 403) {
          setError('Verifikujte e-poštu da biste slali upite.');
          return;
        }
      }
      setError(e instanceof Error ? e.message : 'Slanje upita nije uspelo');
    }
  });

  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-4">
      <h3 className="font-semibold">Kontaktiraj prodavca</h3>
      <textarea
        className="w-full rounded border p-2"
        rows={4}
        placeholder="Napišite poruku"
        onFocus={() => {
          if (!started) {
            setStarted(true);
            trackEvent('inquiry_start', { listingId });
          }
        }}
        {...register('message')}
      />
      {formState.errors.message && (
        <p className="text-sm text-red-700">{formState.errors.message.message}</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <button
        className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? 'Slanje...' : 'Pošalji upit'}
      </button>
    </form>
  );
}
