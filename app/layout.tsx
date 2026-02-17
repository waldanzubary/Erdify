import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Providers from '@/components/providers/Providers';
import StructuredData from '@/components/seo/StructuredData';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Free SQL to ERD Converter | ERDify Online Tool',
  description:
    'Free SQL to ERD converter. Transform SQL into ER diagrams instantly. Design, visualize & export database schemas with real-time collaboration.',
  keywords: [
    'SQL to ERD converter',
    'SQL to ERD free',
    'free SQL to ERD',
    'convert SQL to ERD',
    'SQL to ER diagram',
    'ERD generator free',
    'database diagram from SQL',
    'SQL diagram generator',
    'ERD maker online',
    'SQL schema visualizer',
    'free ERD tool',
    'real-time ERD collaboration',
    'database design tool'
  ],
  authors: [{ name: 'ERDify Studio' }],
  creator: 'ERDify Studio',
  publisher: 'ERDify Studio',
  metadataBase: new URL('https://www.erdify.my.id'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.erdify.my.id',
    title: 'Free SQL to ERD Converter | ERDify',
    description: 'Free SQL to ERD converter. Transform SQL into ER diagrams instantly with real-time collaboration for database design teams.',
    siteName: 'ERDify Studio',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ERDify Studio - Free ERD Generator with Collaboration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SQL to ERD Converter | ERDify',
    description: 'Free SQL to ERD converter with real-time collaboration. Transform SQL into ER diagrams instantly for database design teams.',
    images: ['/og-image.png'],
    creator: '@erdifystudio',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <StructuredData />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
