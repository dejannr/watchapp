import { ListingForm } from '@/components/forms/listing-form';

export default async function EditSellerListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container">
      <ListingForm listingId={id} />
    </div>
  );
}
