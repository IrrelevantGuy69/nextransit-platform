import type { Metadata, Viewport } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
});

export const metadata: Metadata = {
  title: 'NexTransit — Autonomous Fleet Logistics & Control Platform',
  description:
    'Real-time multi-tenant telemetry, PostGIS transit routing, driver safety, and cryptographic row-level security isolation in one calm, modular platform.',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f6f1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${instrument.variable}`}
    >
      <head suppressHydrationWarning />
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
