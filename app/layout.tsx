import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './monitoring.css';
import './discovery.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kilauea-watch.sites.openai.com'),
  title: 'Kīlauea Watch | Volcano Activity Made Clear',
  description: 'A clear, educational dashboard for understanding Kīlauea volcano activity, trends, monitoring signals, and uncertainty.',
  openGraph: { title: 'Kīlauea Watch', description: 'Volcano activity made clear.', images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: 'Kīlauea Watch', description: 'Volcano activity made clear.', images: ['/og.png'] },
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
