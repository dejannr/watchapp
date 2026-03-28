import { AccessGuard } from '@/components/access-guard';

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return <AccessGuard>{children}</AccessGuard>;
}
