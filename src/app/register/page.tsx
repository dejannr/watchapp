'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/forms/register-form';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingCard } from '@/components/loading-card';

export default function RegistracijaPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container">
        <div className="mx-auto max-w-md">
          <LoadingCard message="Provera sesije..." />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="container">
        <div className="mx-auto max-w-md">
          <LoadingCard message="Preusmeravanje..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-4">
      <RegisterForm />
      <p className="text-center text-sm text-[var(--muted)]">
        Već imate nalog? <Link href="/login">Prijava</Link>
      </p>
    </div>
  );
}
