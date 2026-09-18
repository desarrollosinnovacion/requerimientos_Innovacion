import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Tipografía del manual SICSA: Archivo para texto y títulos (400/500/600).
// Jost Light queda reservada al logotipo, que aquí es imagen.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Requerimientos · Innovación",
  description:
    "Portal para solicitar nuevos desarrollos, mejoras, automatizaciones, integraciones, reportes o soluciones de datos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
