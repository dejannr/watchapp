import { AccessGuard } from '@/components/access-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard requireAdmin>{children}</AccessGuard>;
}
