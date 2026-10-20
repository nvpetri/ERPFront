import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ERP · Vendas e gestão",
  description: "Gestão de vendas para o seu estabelecimento",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
