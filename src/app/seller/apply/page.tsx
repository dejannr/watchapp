'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SellerApplyForm } from '@/components/forms/seller-apply-form';
import { apiRequest } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';

type SellerProfile = {
  id?: string;
  displayName: string;
  slug: string;
  bio?: string;
  locationCity?: string;
  locationCountry?: string;
  contactEmail?: string;
  contactPhone?: string;
  latestApplication?: {
    id: string;
    sellerType?: 'PRIVATE' | 'BUSINESS';
    displayName?: string;
    businessName?: string;
    about?: string;
    publicLocationCity?: string;
    publicLocationCountry?: string;
    website?: string;
    instagramHandle?: string;
    phone?: string;
    rejectionReasonCode?: string;
    rejectionNote?: string;
  };
};

export default function SellerApplyPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const sellerProfile = useQuery({
    queryKey: ['seller-application-me'],
    queryFn: () => apiRequest<SellerProfile>('/seller-application/me', 'GET', undefined, true),
    enabled: Boolean(user),
    retry: false,
  });

  useEffect(() => {
    if (user?.sellerStatus === 'APPROVED') {
      router.replace('/seller-dashboard');
    }
  }, [user?.sellerStatus, router]);

  if (userLoading) {
    return (
      <div className="container">
        <div className="card p-4 text-sm">Checking session...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card space-y-4 p-5">
          <p className="text-lg font-semibold">Login required</p>
          <p className="text-sm text-[var(--muted)]">
            You need an account to apply for seller access and manage listings.
          </p>
          <div className="rounded border border-[var(--line)] p-3 text-sm">
            <p className="font-semibold">With seller access you can:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--muted)]">
              <li>Create and edit your watch listings</li>
              <li>Receive and manage buyer inquiries</li>
              <li>Track listing status in your seller dashboard</li>
            </ul>
          </div>
          <div className="rounded border border-[var(--line)] p-3 text-sm text-[var(--muted)]">
            <p className="font-semibold text-[var(--text)]">Before applying:</p>
            <p className="mt-1">Login and verify your email. Then complete the seller application form.</p>
          </div>
          <Link
            href="/login?next=%2Fsell"
            className="inline-block rounded bg-[var(--brand)] px-3 py-1.5 text-white"
          >
            Go to Login
          </Link>
          <p className="text-xs text-[var(--muted)]">
            Don’t have an account? <Link href="/register" className="text-[var(--brand)]">Register first</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (user.sellerStatus === 'APPROVED') {
    return null;
  }

  if (user.sellerStatus === 'PENDING') {
    return (
      <div className="container">
        <div className="card space-y-3 p-4">
          <p className="font-semibold">Application sent</p>
          <p className="text-sm text-[var(--muted)]">
            Your seller request is pending admin review. You will get seller rights once approved.
          </p>
        </div>
      </div>
    );
  }

  if (user.userStatus !== 'ACTIVE' || !user.emailVerified) {
    return (
      <div className="container">
        <div className="card space-y-3 p-4">
          <p className="font-semibold">Verify your email first</p>
          <p className="text-sm text-[var(--muted)]">
            Seller applications are available only for active, email-verified accounts.
          </p>
          <Link href="/verify-email" className="inline-block rounded bg-[var(--brand)] px-3 py-1.5 text-white">
            Verify Email
          </Link>
        </div>
      </div>
    );
  }

  const rejected = user.sellerStatus === 'REJECTED';
  const latest = sellerProfile.data?.latestApplication;
  if (sellerProfile.isError && !rejected) {
    return (
      <div className="container">
        <div className="card p-4 text-sm text-red-700">
          Failed to load seller application status. Please refresh and try again.
        </div>
      </div>
    );
  }
  const initialValues = latest
    ? {
        sellerType: latest.sellerType,
        displayName: latest.displayName ?? '',
        businessName: latest.businessName ?? '',
        bio: latest.about ?? '',
        locationCity: latest.publicLocationCity ?? '',
        locationCountry: latest.publicLocationCountry ?? '',
        websiteUrl: latest.website ?? '',
        instagramHandle: latest.instagramHandle ?? '',
        contactPhone: latest.phone ?? '',
      }
    : undefined;

  return (
    <div className="container space-y-4">
      <div className="card p-4 text-sm">
        <p className="font-semibold">
          {rejected ? 'Seller application declined' : 'Apply for seller access'}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {rejected
            ? 'Your previous request was declined. Update details and submit again.'
            : 'Submit your seller profile details. Admin approval is required.'}
        </p>
        {rejected && (latest?.rejectionReasonCode || latest?.rejectionNote) && (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-amber-900">
            <p className="font-semibold">Last rejection</p>
            {latest.rejectionReasonCode && <p>Reason: {latest.rejectionReasonCode}</p>}
            {latest.rejectionNote && <p>Note: {latest.rejectionNote}</p>}
          </div>
        )}
      </div>
      <SellerApplyForm
        initialValues={initialValues}
        submitLabel={rejected ? 'Resubmit Application' : 'Submit Application'}
        mode={rejected ? 'resubmit' : 'create'}
        applicationId={latest?.id}
        onSubmitted={() => {
          router.refresh();
          window.location.reload();
        }}
      />
    </div>
  );
}
