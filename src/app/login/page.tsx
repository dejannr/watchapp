'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/forms/login-form';
import { useCurrentUser } from '@/hooks/use-current-user';

function LoginPageContent() {
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
        <div className="card mx-auto max-w-md p-4 text-sm">Checking session...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="container space-y-4">
      <div className="card mx-auto max-w-md p-4">
        <h1 className="text-lg font-bold">Welcome back</h1>
        <p className="text-sm text-[var(--muted)]">
          Login to manage favorites, send inquiries, and apply as a seller.
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-[var(--muted)]">
        No account? <Link href="/register">Register</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="card mx-auto max-w-md p-4 text-sm">Loading...</div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
