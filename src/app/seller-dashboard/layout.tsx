import { AccessGuard } from '@/components/access-guard';

export default function ProdavacDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard requireApprovedSeller>{children}</AccessGuard>;
}
