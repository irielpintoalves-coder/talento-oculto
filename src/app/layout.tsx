import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Talento Oculto - Mapeamento de Competências',
  description: 'Descubra suas competências ocultas. Um entrevistador IA mapeia suas ferramentas, habilidades e experiências para gerar currículos de alto impacto.',
  keywords: 'talentos ocultos, currículo IA, mapeamento de competências, dossiê profissional',
  authors: [{ name: 'Talento Oculto' }],
  openGraph: {
    title: 'Talento Oculto - Mapeamento de Competências',
    description: 'Descubra suas competências ocultas com inteligência artificial.',
    url: 'https://talentooculto.vercel.app',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talento Oculto',
    description: 'Mapeamento de competências profissionais com IA',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}