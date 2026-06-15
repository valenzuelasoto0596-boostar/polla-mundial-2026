import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polla Mundial 2026",
  description: "Tabla de posiciones de la Polla del Mundial USA/MEX/CAN 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="inner">
            <Link href="/" className="logo-badge" aria-label="Inicio">⚽</Link>
            <div>
              <h1>Polla Mundial 2026</h1>
              <div className="sub">USA · México · Canadá</div>
            </div>
            <div className="header-spacer" />
            <nav className="nav">
              <Link href="/" className="header-link">Tabla</Link>
              <Link href="/partidos" className="header-link">Partidos</Link>
              <Link href="/admin" className="header-link primary">+ Resultados</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer container">
          Polla Mundial 2026 · Resultado exacto 3 pts · Ganador 1 pt
        </footer>
      </body>
    </html>
  );
}
