import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freelance Fix',
  description: 'A localized gig platform for professionals in the RGV.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
