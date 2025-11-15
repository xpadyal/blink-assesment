import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Blink',
  description: 'AI voice keyboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 min-h-screen">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

