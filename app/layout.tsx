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
  title: 'ERDify Studio — Free ERD Generator & SQL to ERD Collaboration Tool',
  description:
    'Free ERD generator with real-time collaboration. Transform SQL to ER diagrams instantly. Design, visualize, and export database schemas with our free online ERD collaboration tool.',
  keywords: [
    'ERD generator',
    'SQL to ERD free',
    'ERD collaboration',
    'ER diagram maker',
    'database diagram tool',
    'ERD online free',
    'real-time ERD collaboration',
    'SQL to ER diagram converter',
    'database schema visualizer',
    'free ERD tool'
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
    title: 'ERDify Studio — Free ERD Generator & Real-Time Collaboration',
    description: 'Free ERD generator with real-time collaboration. Transform SQL to ER diagrams instantly. Perfect for database design and team collaboration.',
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
    title: 'ERDify Studio — Free ERD Generator & Collaboration Tool',
    description: 'Transform SQL to ER diagrams instantly. Free ERD generator with real-time collaboration for database designers.',
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
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <StructuredData />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
