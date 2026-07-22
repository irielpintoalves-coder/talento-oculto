'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('features');

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/interview');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none animate-glow"></div>
      <div className="absolute top-[400px] right-0 w-[500px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800/80 relative z-10 backdrop-blur-md bg-slate-950/40">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative flex items-center justify-center">
            <div className="h-4 w-4 bg-indigo-500 rounded-full animate-pulse"></div>
            <div className="absolute h-6 w-6 bg-indigo-500/30 rounded-full animate-ping"></div>
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight group-hover:text-indigo-400 transition">
            Talento <span className="text-indigo-400">Oculto</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Sistema Ativo
          </span>
          <button
            onClick={() => signIn('google', { callbackUrl: '/interview' })}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Acessar
          </button>
        </div>
      </header>

      {}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 text-center flex-1 flex flex-col justify-center items-center relative z-10 space-y-12">
        {/* Badge e Título */}
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-full text-xs font-semibold tracking-wide shadow-inner glow-indigo">
            <span className="text-sm">✨</span> <span suppressHydrationWarning>
  {" Powered by Gemini 2.0 Flash AI & Motor Multi-Provedor"}
</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Sua bagagem profissional vai muito além do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">último cargo.</span>
          </h1>

          <p className="text-base md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Através de um diálogo humano conduzido por inteligência artificial, mapeamos suas ferramentas manuseadas, marcas conhecidas e problemas resolvidos para gerar <strong className="text-white">dossiês estratégicos e currículos de alto impacto</strong>.
          </p>
        </div>

        {}
        <div className="pt-2 w-full flex flex-col items-center gap-4 max-w-md">
          <button
            onClick={() => signIn('google', { callbackUrl: '/interview' })}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-white via-slate-100 to-slate-200 hover:from-slate-100 hover:to-white text-slate-950 font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-2xl hover:shadow-indigo-500/20 text-base md:text-lg group border border-white/40 transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.19v3.15C3.17 21.32 7.23 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.6H1.19C.43 8.14 0 9.99 0 12s.43 3.86 1.19 5.4l4.09-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.19 6.6l4.09 3.15c.95-2.84 3.6-4.95 6.72-4.95z" />
            </svg>
            <span>Iniciar Mapeamento com Google</span>
          </button>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            🔒 Acesso restrito via whitelist autorizada no banco de dados.
          </p>
        </div>

        {}
        <div className="w-full pt-8">
          <div className="flex justify-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'features'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              🚀 Funcionalidades Chave
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              👀 Exemplo de Dossiê Gerado
            </button>
          </div>

          {activeTab === 'features' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="glass-card gradient-border p-6 rounded-2xl space-y-3 hover:border-indigo-500/40 transition group">
                <div className="h-10 w-10 bg-indigo-950/80 border border-indigo-700/50 rounded-xl flex items-center justify-center text-indigo-400 text-xl font-bold group-hover:scale-110 transition-transform">
                  💬
                </div>
                <h3 className="font-bold text-white text-base">Entrevistador Camaleão</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sem formulários chatos. A IA se adapta à sua área específica e realiza perguntas inteligentes em cadeia.
                </p>
              </div>

              <div className="glass-card gradient-border p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition group">
                <div className="h-10 w-10 bg-emerald-950/80 border border-emerald-700/50 rounded-xl flex items-center justify-center text-emerald-400 text-xl font-bold group-hover:scale-110 transition-transform">
                  ⚙️
                </div>
                <h3 className="font-bold text-white text-base">Competências Ocultas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identifica ferramentas, máquinas, softwares e habilidades paralelas que não apareciam no seu currículo anterior.
                </p>
              </div>

              <div className="glass-card gradient-border p-6 rounded-2xl space-y-3 hover:border-sky-500/40 transition group">
                <div className="h-10 w-10 bg-sky-950/80 border border-sky-700/50 rounded-xl flex items-center justify-center text-sky-400 text-xl font-bold group-hover:scale-110 transition-transform">
                  📄
                </div>
                <h3 className="font-bold text-white text-base">Formatos Prontos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gera instantaneamente currículos focados em área técnica, gestão ou transição de carreira prontos para envio.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 md:p-8 rounded-2xl text-left space-y-4 max-w-3xl mx-auto border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Exemplo da Matriz Extraída
                </span>
                <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-0.5 rounded-full font-medium">
                  Taxa de Compatibilidade 98%
                </span>
              </div>
              <div className="space-y-3 text-xs md:text-sm text-slate-300">
                <p>
                  <strong className="text-white">Perfil Mapeado:</strong> Profissional Polivalente de Operações e Suporte Técnico.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Manutenção Preventiva', 'ERP TOTVS', 'Gestão de Estoque', 'Atendimento N2', 'Automação em Excel', 'Análise de Gargalos'].map((skill, idx) => (
                    <span key={idx} className="bg-slate-800 border border-slate-700 text-indigo-300 px-3 py-1 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {}
      <footer className="max-w-7xl w-full mx-auto px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 backdrop-blur-md">
        <div>© {new Date().getFullYear()} Talento Oculto. Todos os direitos reservados.</div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Privacidade</span>
          <span>•</span>
          <span>Termos de Uso</span>
          <span>•</span>
          <span>Acesso Whitelist</span>
        </div>
      </footer>
    </div>
  );
}