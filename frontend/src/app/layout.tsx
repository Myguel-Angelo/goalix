import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Goalix — Gestão Inteligente de Metas",
  description:
    "Gerencie metas e previsões do seu time de forma inteligente com a Goalix.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        <RegistrationProvider>{children}</RegistrationProvider>
      </body>
    </html>
  );
}
