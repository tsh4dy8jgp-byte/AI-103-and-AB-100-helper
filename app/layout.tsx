import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  metadataBase: new URL('http://localhost:3001'),
  title: 'Northstar Exam Lab — AI-103 Practice',
  description: 'A focused AI-103 practice exam simulator with realistic scenarios and actionable learning analytics.',
  openGraph: {
    title: 'Northstar Exam Lab',
    description: 'AI-103 practice with purpose',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Northstar Exam Lab — AI-103 practice with purpose' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Northstar Exam Lab',
    description: 'AI-103 practice with purpose',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
