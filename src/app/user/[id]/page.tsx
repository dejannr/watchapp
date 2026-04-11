import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '@/lib/config';

type PublicUserProfile = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
  sellerProfile?: {
    slug: string;
    displayName: string;
  } | null;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    reviewer?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
    } | null;
    listing?: {
      id: string;
      title: string;
      slug: string;
    } | null;
  }>;
};

function personDisplayName(data?: PublicUserProfile | null) {
  if (!data) return 'Korisnik';
  const full = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (data.displayName?.trim()) return data.displayName.trim();
  return 'Korisnik';
}

function personName(person?: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
} | null) {
  const full = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (person?.displayName?.trim()) return person.displayName.trim();
  return 'Korisnik';
}

function stars(rating: number) {
  const safe = Math.max(1, Math.min(5, rating || 0));
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await fetch(`${API_URL}/users/public/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    return { title: 'Korisnik nije pronađen' };
  }
  const data = (await res.json()) as PublicUserProfile;
  const name = personDisplayName(data);
  return {
    title: `${name} | Profil korisnika | Satovi24`,
    description: `Javni profil korisnika ${name}.`,
    alternates: { canonical: `/user/${id}` },
  };
}

export default async function PublicUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API_URL}/users/public/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    notFound();
  }

  const data = (await res.json()) as PublicUserProfile;
  const name = personDisplayName(data);
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="container space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface-soft)]">
            {data.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.profileImageUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--muted)]">
                {initials || 'K'}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{name}</h1>
              <p className="text-sm text-[var(--muted)]">
                Član od {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </div>
            {data.sellerProfile?.slug && (
              <Link
                href={`/seller/${data.sellerProfile.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-medium text-[var(--brand)] transition hover:border-[var(--brand)]/30 hover:bg-[var(--card)]"
              >
                {data.sellerProfile.displayName || 'Prodavac'}
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[11px] opacity-80" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="text-xl font-bold">Recenzije</h2>
        {reviews.length === 0 && (
          <p className="mt-2 text-sm text-[var(--muted)]">Još nema recenzija.</p>
        )}
        <div className="mt-3 space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{personName(review.reviewer)}</p>
                <p className="text-sm tracking-wide text-amber-600">{stars(review.rating)}</p>
              </div>
              {review.comment && <p className="mt-2 text-sm text-[var(--text)]">{review.comment}</p>}
              {review.listing?.slug && (
                <Link href={`/listing/${review.listing.slug}`} className="mt-2 inline-flex text-xs text-[var(--brand)] hover:underline">
                  {review.listing.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
