'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { clearAccessToken, getAccessToken } from '@/lib/auth';

export function AccessGuard({
  children,
  requireAdmin = false,
  requireApprovedSeller = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireApprovedSeller?: boolean;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const token = getAccessToken();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token && !isLoading) {
      router.replace('/login');
      return;
    }
    if (token && isError && !isLoading) {
      clearAccessToken();
      router.replace('/login');
      return;
    }
    if (requireAdmin && !isLoading && user && user.role !== 'ADMIN') {
      router.replace('/');
    }
    if (requireApprovedSeller && !isLoading && user && user.sellerStatus !== 'APPROVED') {
      router.replace('/sell');
    }
  }, [mounted, token, user, isLoading, isError, requireAdmin, requireApprovedSeller, router]);

  if (!mounted) {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Checking session...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Redirecting to login...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Checking session...</div>
      </div>
    );
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Admin access required.</div>
      </div>
    );
  }

  if (requireApprovedSeller && user?.sellerStatus !== 'APPROVED') {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Approved seller access required.</div>
      </div>
    );
  }

  return <>{children}</>;
}
