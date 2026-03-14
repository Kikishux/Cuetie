import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { SensoryProvider } from "@/components/shared/SensoryProvider";
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
  title: "Cuetie — Your Dating Communication Coach",
  description:
    "Cuetie helps autistic adults master dating communication through AI-powered practice conversations, social cue coaching, and personalized feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SensoryProvider>{children}</SensoryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
