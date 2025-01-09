import type { Metadata } from "next";
//import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';



export const metadata: Metadata = {
  title: "VisitTech NFC",
  description: "Lector NFC para VisitTech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body>
      <nav style={{ padding: '10px', background: '#0070f3', color: 'white' }}>
        <Link href="/" style={{ marginRight: '10px', color: 'white', textDecoration: 'none' }}>
          Inicio
        </Link>
        <Link href="/nfc" style={{ color: 'white', textDecoration: 'none' }}>
          Lector NFC
        </Link>
      </nav>
      <main>{children}</main>
    </body>
  </html>
  );
}
