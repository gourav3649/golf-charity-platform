import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Common/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'Golf Charity Platform | Play for Impact',
  description: 'Track your golf scores, win monthly prizes, and support charities you love.',
  keywords: [
    'charity',
    'golf',
    'fundraising',
    'monthly draws',
    'subscription',
    'impact',
  ],
  authors: [{ name: 'Digital Heroes' }],
  openGraph: {
    title: 'Golf Charity Platform | Play for Impact',
    description:
      'Transform your golf passion into charitable impact. Track your scores, win monthly draws, and support causes you love.',
    url: 'https://golfcharity.com',
    siteName: 'Golf Charity Platform',
    images: [
      {
        url: 'https://golfcharity.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-inter bg-slate-950 text-slate-100 antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-slate-800 bg-slate-950/50 py-8 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Golf Charity Platform. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
