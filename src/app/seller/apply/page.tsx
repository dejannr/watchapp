'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SellerApplyForm } from '@/components/forms/seller-apply-form';
import { apiRequest } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingCard } from '@/components/loading-card';

type ProdavacProfil = {
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

export default function ProdavacPrimeniPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const sellerProfil = useQuery({
    queryKey: ['seller-application-me'],
    queryFn: () => apiRequest<ProdavacProfil>('/seller-application/me', 'GET', undefined, true),
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
        <LoadingCard message="Provera sesije..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card space-y-4 p-5">
          <p className="text-lg font-semibold">Potrebna je prijava</p>
          <p className="text-sm text-[var(--muted)]">
            Potreban vam je nalog da biste tražili pristup za prodavca i upravljali oglasima.
          </p>
          <div className="rounded border border-[var(--line)] p-3 text-sm">
            <p className="font-semibold">Sa pristupom prodavca možete:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--muted)]">
              <li>Kreirati i uređivati svoje oglase satova</li>
              <li>Primati i upravljati upitima kupaca</li>
              <li>Pratiti status oglasa na kontrolnoj tabli prodavca</li>
            </ul>
          </div>
          <div className="rounded border border-[var(--line)] p-3 text-sm text-[var(--muted)]">
            <p className="font-semibold text-[var(--text)]">Pre prijave:</p>
            <p className="mt-1">Prijavite se i verifikujte e-poštu. Zatim popunite obrazac za prijavu prodavca.</p>
          </div>
          <Link
            href="/login?next=%2Fsell"
            className="inline-block rounded bg-[var(--brand)] px-3 py-1.5 text-white"
          >
            Idi na prijavu
          </Link>
          <p className="text-xs text-[var(--muted)]">
            Nemate nalog? <Link href="/register" className="text-[var(--brand)]">Prvo se registrujte</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (user.sellerStatus === 'APPROVED') {
    return (
      <div className="container">
        <LoadingCard message="Preusmeravanje na kontrolnu tablu..." />
      </div>
    );
  }

  if (user.sellerStatus === 'PENDING') {
    return (
      <div className="container">
        <div className="card space-y-3 p-4">
          <p className="font-semibold">Prijava je poslata</p>
          <p className="text-sm text-[var(--muted)]">
            Vaš zahtev za prodavca čeka proveru administratora. Prava prodavca dobićete nakon odobrenja.
          </p>
        </div>
      </div>
    );
  }

  if (user.userStatus !== 'ACTIVE' || !user.emailVerified) {
    return (
      <div className="container">
        <div className="card space-y-3 p-4">
          <p className="font-semibold">Prvo verifikujte e-poštu</p>
          <p className="text-sm text-[var(--muted)]">
            Prijave za prodavca dostupne su samo za aktivne naloge sa verifikovanom e-poštom.
          </p>
          <Link href="/verify-email" className="inline-block rounded bg-[var(--brand)] px-3 py-1.5 text-white">
            Verifikuj e-poštu
          </Link>
        </div>
      </div>
    );
  }

  const rejected = user.sellerStatus === 'REJECTED';
  const latest = sellerProfil.data?.latestApplication;
  if (sellerProfil.isError && !rejected) {
    return (
      <div className="container">
        <div className="card p-4 text-sm text-red-700">
          Nije moguće učitati status prijave za prodavca. Osvežite stranicu i pokušajte ponovo.
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
          {rejected ? 'Prijava za prodavca je odbijena' : 'Prijavite se za pristup prodavca'}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          {rejected
            ? 'Vaš prethodni zahtev je odbijen. Ažurirajte podatke i pošaljite ponovo.'
            : 'Pošaljite podatke profila prodavca. Potrebno je odobrenje administratora.'}
        </p>
        {rejected && (latest?.rejectionReasonCode || latest?.rejectionNote) && (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-amber-900">
            <p className="font-semibold">Poslednje odbijanje</p>
            {latest.rejectionReasonCode && <p>Razlog: {latest.rejectionReasonCode}</p>}
            {latest.rejectionNote && <p>Napomena: {latest.rejectionNote}</p>}
          </div>
        )}
      </div>
      <SellerApplyForm
        initialValues={initialValues}
        submitLabel={rejected ? 'Pošalji prijavu ponovo' : 'Pošalji prijavu'}
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
