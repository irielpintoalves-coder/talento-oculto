'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error');

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Busca perfil do usuário pré-cadastrado pelo e-mail
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', user.email)
          .maybeSingle();

        // 🛑 VALIDAÇÃO DE SEGURANÇA: Se não existir perfil ou estiver inativo, encerra sessão
        if (!profile || profile.is_active === false) {
          await supabase.auth.signOut();
          setUser(null);
          setRole(null);
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        // 🔄 SINCRONIZAÇÃO: Garante que o ID do Google Auth seja vinculado ao perfil
        if (!profile.id) {
          await supabase
            .from('profiles')
            .update({ id: user.id })
            .ilike('email', user.email);
        }

        setUser(user);
        setRole(profile.role);
      }

      setLoading(false);
    };

    checkAuth();
  }, [supabase]);

  const handleGoogleLogin = async () => {
    setUnauthorized(false);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setUnauthorized(false);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-[#daa520]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#daa520]"></div>
      </div>
    );
  }

  const isUnauthorized = errorMessage === 'unauthorized' || unauthorized;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f0f0f] text-[#e8dcc8] relative overflow-hidden">
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="Talento Oculto" className="w-8 h-8" />
          <span className="font-extrabold text-sm text-[#daa520]">
            Talento <span className="text-[#d4844f]">Oculto</span>
          </span>
        </Link>
      </div>

      <div className="max-w-md w-full rounded-2xl p-8 space-y-6 shadow-2xl bg-[#1a1a1a] border border-[#2d5f4f]">

        {/* ALERTA DE ACESSO NEGADO */}
        {isUnauthorized && !user && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs space-y-1">
            <p className="font-bold text-red-400 text-sm">⛔ Acesso Não Autorizado</p>
            <p>Seu e-mail do Google não possui uma licença ativa ou cadastro prévio no sistema.</p>
          </div>
        )}

        {user ? (
          <div className="space-y-6 text-center">
            <div className="inline-flex p-3 rounded-full bg-[#2d5f4f]/30 border border-[#3a7d66]">
              <span className="text-2xl">👤</span>
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#daa520]">Sessão Ativa</h1>
              <p className="text-xs text-gray-400 mt-1">{user.email}</p>

              {role && (
                <span className="inline-block mt-3 text-xs uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-[#2d5f4f] text-[#daa520] border border-[#3a7d66]">
                  Perfil: {role}
                </span>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {role === 'master' && (
                <button
                  onClick={() => router.push('/master')}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-[#0f0f0f] shadow-lg bg-[#daa520] hover:bg-[#c3941c] transition"
                >
                  ⚙️ Painel Master (Gerenciar Licenças)
                </button>
              )}

              {role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-lg bg-[#2d5f4f] hover:bg-[#234b3e] transition"
                >
                  👥 Painel do Admin (Gerenciar Equipe)
                </button>
              )}

              <button
                onClick={() => router.push('/interview')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition text-white bg-[#2d5f4f]/60 hover:bg-[#2d5f4f]"
              >
                🚀 Ir para a Entrevista
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-red-400 border border-red-900 bg-red-950/40 hover:bg-red-900/60 transition"
              >
                Encerrar Sessão
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[#daa520]">Acesso ao Sistema</h1>
              <p className="text-xs text-gray-400">
                Entre com sua conta autorizada do Google.
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-xl bg-[#d4844f] text-[#0f0f0f] border border-[#daa520] hover:brightness-110"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.19v3.15C3.17 21.32 7.23 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.6H1.19C.43 8.14 0 9.99 0 12s.43 3.86 1.19 5.4l4.09-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.6l4.09 3.15c.95-2.84 3.6-4.95 6.72-4.95z" />
              </svg>
              <span>Entrar com o Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]"></div>}>
      <LoginContent />
    </Suspense>
  );
}