import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "kStock - Decentralized Lending Protocol",
  description: "Earn yield and borrow against your assets on Kaia Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">{children}</main>
            <footer className="border-t border-border/40 mt-12 py-8">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>© 2025 kStock. Built on Kaia Network for the hackathon.</p>
              </div>
            </footer>
          </div>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
