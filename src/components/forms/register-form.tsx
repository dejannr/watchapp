'use client';

import Link from 'next/link';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNotify } from '@/components/notifications-provider';
import { ApiError, apiRequest } from '@/lib/api';
import { registerSchema } from '@/lib/validations';

type FormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const notify = useNotify();
  const [error, setError] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    setVerificationToken('');
    try {
      const res = await apiRequest<{ verificationToken: string }>('/auth/register', 'POST', values);
      reset();
      setVerificationToken(res.verificationToken);
      notify.success('Nalog je kreiran. Verifikujte e-poštu za nastavak.');
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setError(e.message);
        return;
      }
      setError(e instanceof Error ? e.message : 'Registracija nije uspela');
    }
  });

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-3 p-5">
      <h1 className="text-xl font-bold">Registracija</h1>
      <p className="text-sm text-[var(--muted)]">
        Novi nalozi počinju kao kupci. Kasnije možete podneti zahtev za prodavca.
      </p>
      <input className="w-full rounded border p-2" placeholder="E-pošta" {...register('email')} />
      <input
        className="w-full rounded border p-2"
        type="password"
        placeholder="Lozinka"
        {...register('password')}
      />
      <input className="w-full rounded border p-2" placeholder="Ime" {...register('firstName')} />
      <input className="w-full rounded border p-2" placeholder="Prezime" {...register('lastName')} />
      {formState.errors.password && (
        <p className="text-sm text-red-700">{formState.errors.password.message}</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {verificationToken && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <p>Nalog je kreiran. Kliknite ispod da verifikujete e-poštu u aplikaciji.</p>
          <Link
            href={`/verify-email?token=${encodeURIComponent(verificationToken)}`}
            className="mt-2 inline-block rounded bg-green-700 px-3 py-1 text-white"
          >
            Verifikuj e-poštu sada
          </Link>
        </div>
      )}
      <button
        className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? 'Kreiranje...' : 'Kreiraj nalog'}
      </button>
    </form>
  );
}
