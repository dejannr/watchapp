import { AccessGuard } from '@/components/access-guard';

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard requireApprovedSeller>{children}</AccessGuard>;
}
