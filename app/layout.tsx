import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/layout/app-header";
import WhatsAppSupportButton from "@/components/layout/whatsapp-support-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zubacademy",
  description: "Plataforma de treinamento da Zubale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <div className="relative min-h-screen">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_30%)]" />

          <AppHeader userName="Aluno(a)" />

          <main className="relative z-10 min-h-[calc(100vh-80px)]">
            {children}
          </main>

          <WhatsAppSupportButton />
        </div>
      </body>
    </html>
  );
}