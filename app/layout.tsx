import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Providers from '@/components/providers/Providers';
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
  title: 'ERDify — SQL to ER Diagrams, Instantly',
  description:
    'Transform your SQL schemas into beautiful, interactive ER diagrams. Parse, visualize, edit, and export — all in one place.',
  keywords: ['ER diagram', 'SQL', 'database', 'schema', 'visualization', 'ERD'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
