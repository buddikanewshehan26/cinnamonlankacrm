
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeManager } from '@/components/ThemeManager';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cinnamon Lanka | Premium Ceylon Cinnamon Exports',
  description: 'Enterprise Business Management for Cinnamon Lanka Exports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeManager />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
