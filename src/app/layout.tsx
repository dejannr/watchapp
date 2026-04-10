import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
  title: 'Satovi24',
  description: 'MVP tržišta satova sa više prodavaca',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  icons: {
    icon: '/brand.png',
    shortcut: '/brand.png',
    apple: '/brand.png',
  },
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
              <Link href="/" className="inline-flex items-center gap-2">
                <Image
                  src="/logo-satovi.png"
                  alt="Satovi24"
                  width={180}
                  height={40}
                  priority
                  style={{ width: 'auto', height: 'auto', maxHeight: '40px' }}
                />
                <span className="text-xl tracking-wide">
                  <span className="font-bold">Satovi</span>
                  <span className="font-semibold text-[var(--brand)]">24</span>
                </span>
              </Link>
              <TopNav />
            </div>
          </header>
          <main className="min-h-[80vh] py-8">{children}</main>
          <footer className="border-t border-[var(--line)] bg-[var(--card)] py-10 text-sm">
            <div className="container space-y-8">
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-[var(--text)]">Satovi24</p>
                  <p className="text-[var(--muted)]">
                    Marketplace za kupovinu i prodaju satova između verifikovanih prodavaca i ozbiljnih kupaca.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-[var(--text)]">Navigacija</p>
                  <div className="flex flex-col gap-1 text-[var(--muted)]">
                    <Link href="/browse" className="hover:text-[var(--text)]">Pretraga oglasa</Link>
                    <Link href="/sell" className="hover:text-[var(--text)]">Postani prodavac</Link>
                    <Link href="/account" className="hover:text-[var(--text)]">Moj nalog</Link>
                    <Link href="/chats" className="hover:text-[var(--text)]">Poruke</Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-[var(--text)]">Napomena</p>
                  <p className="text-[var(--muted)]">
                    Satovi24 ne obrađuje online plaćanja. Kupoprodaja, plaćanje i preuzimanje dogovaraju se direktno
                    između kupca i prodavca.
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
                © {new Date().getFullYear()} Satovi24. Sva prava zadržana.
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
