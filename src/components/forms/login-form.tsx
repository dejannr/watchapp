'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNotify } from '@/components/notifications-provider';
import { ApiError, apiRequest } from '@/lib/api';
import { setAccessToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

type FormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const notify = useNotify();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiRequest<{ accessToken: string; user: { email: string } }>(
        '/auth/login',
        'POST',
        values,
      );
      setAccessToken(res.accessToken);
      reset();
      setSuccess(`Prijavljeni ste kao ${res.user.email}.`);
      notify.success(`Prijavljeni ste kao ${res.user.email}. Preusmeravanje...`);
      setTimeout(() => {
        window.location.href = next;
      }, 500);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Neispravni podaci za prijavu. Proverite e-poštu/lozinku i pokušajte ponovo.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Prijava failed');
    }
  });

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-3 p-5">
      <h1 className="text-xl font-bold">Prijava</h1>
      <input className="w-full rounded border p-2" placeholder="E-pošta" {...register('email')} />
      <input
        className="w-full rounded border p-2"
        type="password"
        placeholder="Lozinka"
        {...register('password')}
      />
      {formState.errors.password && (
        <p className="text-sm text-red-700">{formState.errors.password.message}</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <button
        className="rounded bg-[var(--brand)] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? 'Prijavljivanje...' : 'Prijava'}
      </button>
    </form>
  );
}
