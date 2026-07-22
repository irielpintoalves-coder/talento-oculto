import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: 'Talento Oculto — Mapeamento Inteligente de Carreira',
  description: 'Descubra suas competências invisíveis e transforme sua trajetória profissional.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}