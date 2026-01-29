import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";

export const metadata: Metadata = {
  title: "Alarico",
  description: "Finanzas compartidas para socios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen">
        <Suspense fallback={<div className="p-8 text-slate-500">Cargando…</div>}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
      </body>
    </html>
  );
}
