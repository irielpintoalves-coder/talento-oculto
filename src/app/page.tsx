'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('features');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializa o cliente Supabase no browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Verifica se o usuário já está logado ao carregar a página
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Ouve mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Função para fazer Login via Google Supabase
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // Função para fazer Logout (Sair)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden" style={{ background: '#0f0f0f', color: '#e8dcc8' }}>
      {/* Gradientes de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] blur-[140px] rounded-full pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, rgba(218,165,32,0.3) 0%, transparent 70%)' }}></div>
      <div className="absolute top-[400px] right-0 w-[500px] h-[400px] blur-[120px] rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, rgba(212,132,79,0.3) 0%, transparent 70%)' }}></div>

      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b relative z-10 backdrop-blur-md" style={{ borderColor: '#2d5f4f', background: 'rgba(15,15,15,0.8)' }}>
        {/* Logo */}
        <div className="flex items-center space-x-3 group cursor-pointer logo-pulse">
          <div className="relative flex items-center justify-center">
            <img 
              src="/favicon.png" 
              alt="Talento Oculto" 
              className="w-16 h-16 logo-scale-pulse"
            />
          </div>
          <span className="font-extrabold text-xl tracking-tight" style={{ color: '#daa520' }}>
            Talento <span style={{ color: '#d4844f' }}>Oculto</span>
          </span>
        </div>

        {/* Botões do Header */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f', color: '#daa520' }}>
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#d4844f' }}></span> Sistema Ativo
          </span>

          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/interview')}
                  className="text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg text-white"
                  style={{ background: '#2d5f4f' }}
                >
                  Minha Área
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg text-red-400 border border-red-900 hover:bg-red-950"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg text-white"
                style={{ background: '#d4844f' }}
              >
                Acessar
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 text-center flex-1 flex flex-col justify-center items-center relative z-10 space-y-12">
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide shadow-inner" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f', color: '#daa520' }}>
            <span className="text-sm">✨</span> 
            <span suppressHydrationWarning>
              {" Powered by Gemini Flash AI & Motor Multi-Provedor"}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15]" style={{ color: '#e8dcc8' }}>
            Sua bagagem profissional vai muito além do seu 
            <span style={{ color: '#daa520' }}> último cargo.</span>
          </h1>

          <p className="text-base md:text-xl max-w-3xl mx-auto leading-relaxed font-normal" style={{ color: '#b8b8b8' }}>
            Através de um diálogo humano conduzido por inteligência artificial, mapeamos suas ferramentas manuseadas, marcas conhecidas e problemas resolvidos para gerar <strong style={{ color: '#e8dcc8' }}>dossiês estratégicos e currículos de alto impacto</strong>.
          </p>
        </div>

        {/* CTA Principal */}
        <div className="pt-2 w-full flex flex-col items-center gap-4 max-w-md">
          {user ? (
            <button
              onClick={() => router.push('/interview')}
              className="w-full flex items-center justify-center gap-3 font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-2xl text-base md:text-lg group border transform hover:-translate-y-0.5"
              style={{ background: '#2d5f4f', color: '#ffffff', borderColor: '#3a7d66' }}
            >
              <span>Ir para a Entrevista ({user.email})</span>
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-2xl text-base md:text-lg group border transform hover:-translate-y-0.5"
              style={{ background: '#d4844f', color: '#0f0f0f', borderColor: '#daa520' }}
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.19v3.15C3.17 21.32 7.23 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.6H1.19C.43 8.14 0 9.99 0 12s.43 3.86 1.19 5.4l4.09-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.6l4.09 3.15c.95-2.84 3.6-4.95 6.72-4.95z" />
              </svg>
              <span>Entrar com o Google</span>
            </button>
          )}

          <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#888' }}>
            🔒 Acesso restrito via whitelist autorizada no banco de dados.
          </p>
        </div>

        {/* Tabs e Cards */}
        <div className="w-full pt-8">
          <div className="flex justify-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid #2d5f4f' }}>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition`}
              style={{
                background: activeTab === 'features' ? '#d4844f' : '#1a1a1a',
                color: activeTab === 'features' ? '#0f0f0f' : '#daa520',
                border: `1px solid ${activeTab === 'features' ? '#daa520' : '#2d5f4f'}`,
              }}
            >
              🚀 Funcionalidades Chave
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition`}
              style={{
                background: activeTab === 'preview' ? '#d4844f' : '#1a1a1a',
                color: activeTab === 'preview' ? '#0f0f0f' : '#daa520',
                border: `1px solid ${activeTab === 'preview' ? '#daa520' : '#2d5f4f'}`,
              }}
            >
              👀 Exemplo de Dossiê Gerado
            </button>
          </div>

          {activeTab === 'features' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl space-y-3 transition group" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f' }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: '#2d5f4f', color: '#daa520' }}>
                  💬
                </div>
                <h3 className="font-bold text-base" style={{ color: '#e8dcc8' }}>Entrevistador Camaleão</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                  Sem formulários chatos. A IA se adapta à sua área específica e realiza perguntas inteligentes em cadeia.
                </p>
              </div>

              <div className="p-6 rounded-2xl space-y-3 transition group" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f' }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: '#2d5f4f', color: '#d4844f' }}>
                  ⚙️
                </div>
                <h3 className="font-bold text-base" style={{ color: '#e8dcc8' }}>Competências Ocultas</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                  Identifica ferramentas, máquinas, softwares e habilidades paralelas que não apareciam no seu currículo anterior.
                </p>
              </div>

              <div className="p-6 rounded-2xl space-y-3 transition group" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f' }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: '#2d5f4f', color: '#daa520' }}>
                  📄
                </div>
                <h3 className="font-bold text-base" style={{ color: '#e8dcc8' }}>Formatos Prontos</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                  Gera instantaneamente currículos focados em área técnica, gestão ou transição de carreira prontos para envio.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-8 rounded-2xl text-left space-y-4 max-w-3xl mx-auto" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f' }}>
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #2d5f4f' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#daa520' }}>
                  Exemplo da Matriz Extraída
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#2d5f4f', color: '#daa520', border: '1px solid #3a7d66' }}>
                  Taxa de Compatibilidade 98%
                </span>
              </div>
              <div className="space-y-3 text-xs md:text-sm" style={{ color: '#b8b8b8' }}>
                <p>
                  <strong style={{ color: '#e8dcc8' }}>Perfil Mapeado:</strong> Profissional Polivalente de Operações e Suporte Técnico.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Manutenção Preventiva', 'ERP TOTVS', 'Gestão de Estoque', 'Atendimento N2', 'Automação em Excel', 'Análise de Gargalos'].map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg" style={{ background: '#2d5f4f', color: '#daa520', border: '1px solid #3a7d66' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Atualizado */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-6 text-center text-xs flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 backdrop-blur-md" style={{ borderTop: '1px solid #2d5f4f', color: '#888' }}>
        <div>© {new Date().getFullYear()} Talento Oculto. Todos os direitos reservados.</div>
        
        <div className="flex items-center gap-4">
          {/* Link para Acesso Licenças */}
          <Link 
            href="/login" 
            className="px-3 py-1.5 rounded-lg font-semibold transition border hover:bg-[#1a1a1a]"
            style={{ borderColor: '#2d5f4f', color: '#daa520' }}
          >
            🔐 Acesso Licenças
          </Link>
        </div>
      </footer>
    </div>
  );
}