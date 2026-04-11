'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/forms/login-form';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingCard } from '@/components/loading-card';

function PrijavaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(next);
    }
  }, [user, isLoading, router, next]);

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
      <div className="card mx-auto max-w-md p-4">
        <h1 className="text-lg font-bold">Dobrodošli nazad</h1>
        <p className="text-sm text-[var(--muted)]">
          Prijavite se da upravljate favoritima, šaljete upite i prijavite se za prodavca.
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-[var(--muted)]">
        Nemate nalog? <Link href="/register">Registracija</Link>
      </p>
    </div>
  );
}

export default function PrijavaPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="mx-auto max-w-md">
            <LoadingCard />
          </div>
        </div>
      }
    >
      <PrijavaPageContent />
    </Suspense>
  );
}
