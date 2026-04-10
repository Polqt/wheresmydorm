import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";

const canela = localFont({
  src: "../../public/fonts/Canela-Bold-Trial.otf",
  variable: "--font-canela",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Where's My Dorm — Find Student Housing, Simplified",
  description:
    "Where's My Dorm helps students discover, compare, and secure the best dorm and rental housing near their campus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${canela.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConditionalNavbar />
        {children}
      </body>
    </html>
  );
}
