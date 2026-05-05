import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import Providers from '../components/Providers';

export const metadata: Metadata = {
  title: 'Freelance Fix',
  description: 'A localized gig platform for professionals in the RGV.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <main className="flex-grow">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
