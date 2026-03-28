import { AccessGuard } from '@/components/access-guard';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard>{children}</AccessGuard>;
}
