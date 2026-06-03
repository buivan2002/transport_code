import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Transport Express',
  description: 'Tra cứu mã vận đơn và nhà vận chuyển',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
