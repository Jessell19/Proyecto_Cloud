import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asistente de gestión para pequeños negocios",
  description: "Registra ventas, gastos e inventario de tu negocio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-GT">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header className="sitio">
          <strong>Asistente de gestión</strong>
          <nav aria-label="Principal">
            <Link href="/">Inicio</Link>
            <Link href="/comprobantes">Comprobantes de prueba</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
