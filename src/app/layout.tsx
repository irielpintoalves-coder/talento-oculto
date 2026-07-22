import Providers from '@/components/Providers';
import './globals.css';


export const metadata: Metadata = {
  title: 'Talento Oculto — Mapeamento Inteligente de Carreira',
  description: 'Descubra suas competências invisíveis e transforme sua trajetória profissional.',
};

import type { Metadata } from 'next';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500">
        {children}
      </body>
    </html>
  );
}