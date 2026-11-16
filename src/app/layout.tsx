import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPMF - Sistem Pengurusan Murid Al Furqan",
  description:
    "Portal Akses Dokumen Murid untuk Ibu Bapa/Penjaga - Sekolah Rendah Al Furqan Shah Alam",
  keywords: ["SPMF", "Al Furqan", "Sekolah", "Murid", "Dokumen", "Shah Alam"],
  authors: [{ name: "Sekolah Rendah Al Furqan Shah Alam" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
