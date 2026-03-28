import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { TopNav } from '@/components/top-nav';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Watch Marketplace MVP',
  description: 'Multi-vendor watch marketplace MVP',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={jakarta.variable}>
        <Providers>
          <header className="border-b border-[var(--line)] bg-[var(--card)]/90 backdrop-blur">
            <div className="container flex items-center justify-between py-4">
              <Link href="/" className="text-xl font-bold tracking-wide text-[var(--brand)]">
                ChronoMarket
              </Link>
              <TopNav />
            </div>
          </header>
          <main className="min-h-[80vh] py-8">{children}</main>
          <footer className="border-t border-[var(--line)] py-8 text-center text-sm text-[var(--muted)]">
            <div className="container">
              Offline deal marketplace MVP. No online checkout or payment processing.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
