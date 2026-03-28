import { AccessGuard } from '@/components/access-guard';

export default function NalogLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard>{children}</AccessGuard>;
}
