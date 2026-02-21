import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Series Recommender",
  description: "Descubra séries e filmes personalizados com base no que você já assistiu. Receba 5 sugestões de séries + 5 filmes com streaming disponível no Brasil.",
  openGraph: {
    title: "Series Recommender",
    description: "Descubra séries e filmes personalizados com base no que você já assistiu.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Series Recommender",
    description: "Descubra séries e filmes personalizados com base no que você já assistiu.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
