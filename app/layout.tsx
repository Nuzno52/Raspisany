import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Расписание Колледжа',
  description: 'Прототип приложения расписания для студентов',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable}`}>
      <body className="font-sans bg-gray-200 text-gray-900 antialiased flex items-center justify-center min-h-screen sm:p-8">
        {children}
      </body>
    </html>
  );
}
