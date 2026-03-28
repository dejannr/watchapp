'use client';

import { useCurrentUser } from '@/hooks/use-current-user';

export default function SellerVerificationPage() {
  const { data: user } = useCurrentUser();
  return (
    <div className="container">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">Seller Verification</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Current level: {user?.sellerVerificationLevel ?? 'UNVERIFIED'}
        </p>
      </div>
    </div>
  );
}
