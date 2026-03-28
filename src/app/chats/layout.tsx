import { AccessGuard } from '@/components/access-guard';

export default function PorukeLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard>{children}</AccessGuard>;
}
