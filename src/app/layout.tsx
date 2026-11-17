import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameVault | Compra y vende cuentas gamer con confianza",
  description: "Marketplace de cuentas de videojuegos. Publica, descubre y compra cuentas con acompañamiento y verificación.",
  applicationName: "GameVault",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#090d18", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
