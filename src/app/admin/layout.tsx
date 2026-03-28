import { AccessGuard } from '@/components/access-guard';

export default function AdministratorLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard requireAdmin>{children}</AccessGuard>;
}
