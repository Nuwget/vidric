import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Vidric · PDV',
  description: 'Ponto de venda e gestão para lojas de celular de galeria.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* Pipeline de refração do liquid glass (feTurbulence → feGaussianBlur → feDisplacementMap).
            Consumido por backdrop-filter: url(#liquid-glass) em .glass — ver globals.css. */}
        <svg
          width="0"
          height="0"
          style={{ position: 'absolute' }}
          aria-hidden
          focusable="false"
        >
          <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="smoothed" />
            <feDisplacementMap in="SourceGraphic" in2="smoothed" scale="70" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
