'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';

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
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isLoading) {
      router.replace('/login');
      return;
    }
    if (requireAdmin && !isLoading && user && user.role !== 'ADMIN') {
      router.replace('/');
    }
    if (requireApprovedSeller && !isLoading && user && user.sellerStatus !== 'APPROVED') {
      router.replace('/sell');
    }
  }, [user, isLoading, requireAdmin, requireApprovedSeller, router]);

  if (isLoading) {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Provera sesije...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Preusmeravanje na prijavu...</div>
      </div>
    );
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Potreban je administratorski pristup.</div>
      </div>
    );
  }

  if (requireApprovedSeller && user?.sellerStatus !== 'APPROVED') {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Potreban je pristup odobrenog prodavca.</div>
      </div>
    );
  }

  return <>{children}</>;
}
