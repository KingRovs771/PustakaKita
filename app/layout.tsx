import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Literata,
  Lexend,
  JetBrains_Mono,
} from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-dyslexic",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "PustakaKita — Perpustakaan Digital Siswa",
  description:
    "Platform perpustakaan digital sekolah dengan pelacak progres baca, kamus kontekstual, Text-to-Speech Bahasa Indonesia, dan rekomendasi berbasis AI.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${literata.variable} ${lexend.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

