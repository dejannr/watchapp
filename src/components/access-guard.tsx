'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingCard } from '@/components/loading-card';

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
        <LoadingCard message="Provera sesije..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <LoadingCard message="Preusmeravanje na prijavu..." />
      </div>
    );
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return (
      <div className="container">
        <LoadingCard message="Preusmeravanje..." />
      </div>
    );
  }

  if (requireApprovedSeller && user?.sellerStatus !== 'APPROVED') {
    return (
      <div className="container">
        <LoadingCard message="Preusmeravanje..." />
      </div>
    );
  }

  return <>{children}</>;
}
