'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Função para deslogar do sistema
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header 
      className="w-full border-b px-6 py-4 flex items-center justify-between backdrop-blur-md relative z-50" 
      style={{ background: 'rgba(15, 15, 15, 0.9)', borderColor: '#2d5f4f', color: '#e8dcc8' }}
    >
      {/* Esquerda: Logo + Links de Navegação Principal */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <img src="/favicon.png" alt="Talento Oculto" className="w-8 h-8" />
          <span className="font-extrabold text-base tracking-tight" style={{ color: '#daa520' }}>
            Talento <span style={{ color: '#d4844f' }}>Oculto</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-xs font-medium">
          <Link href="/" className="hover:text-[#daa520] transition-colors">
            Início
          </Link>
          <Link href="/interview" className="hover:text-[#daa520] transition-colors">
            Entrevista
          </Link>
          <Link href="/dashboardfinal" className="hover:text-[#daa520] transition-colors">
            Dashboard
          </Link>
        </nav>
      </div>

      {/* Direita: E-mail logado, Controle de Acesso e Logout */}
      <div className="flex items-center gap-3 text-xs">
        {user && (
          <span className="hidden sm:inline-block font-mono text-gray-400 text-[11px] bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-[#2d5f4f]">
            {user.email}
          </span>
        )}

        {/* Link para Gerenciar Logins / Whitelist */}
        <Link
          href="/login"
          className="px-3 py-1.5 rounded-lg font-semibold transition border hover:bg-[#1a1a1a]"
          style={{ borderColor: '#2d5f4f', color: '#daa520' }}
        >
          Acesso / Login
        </Link>

        {/* Botão de Logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg font-semibold transition bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900/60"
        >
          Sair
        </button>
      </div>
    </header>
  );
}