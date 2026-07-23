'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function ResultDashboard({ data, onRestart }) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [attempts, setAttempts] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedCvIndex, setSelectedCvIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Carrega tentativas do usuário e salva a entrevista atual automaticamente
  useEffect(() => {
    const syncInterview = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('interview_attempts')
        .ilike('email', user.email)
        .maybeSingle();

      const currentAttempts = profile?.interview_attempts || 0;
      setAttempts(currentAttempts);

      // Salva a entrevista mais recente no perfil se houver dados
      if (data) {
        await supabase
          .from('profiles')
          .update({ saved_interview: data })
          .ilike('email', user.email);
      }
    };

    syncInterview();
  }, [data]);

  const handleRestartAttempt = async () => {
    if (attempts >= 3) {
      alert('Você atingiu o limite de 3 tentativas para esta licença. Solicite o reset ao seu gestor/administrador.');
      return;
    }

    const nextAttempt = attempts + 1;
    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          interview_attempts: nextAttempt,
          saved_interview: data // Mantém a última até ser substituída
        })
        .ilike('email', user.email);
    }

    setIsSaving(false);
    onRestart(); // Reinicia o fluxo no app
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-[#e8dcc8]">
      {/* Header com Alerta de Tentativas */}
      <header className="sticky top-0 z-20 bg-[#1a1a1a] border-b border-[#2d5f4f] shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/favicon.png" alt="Talento Oculto" className="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold text-[#daa520]">Talento Oculto — Dossiê</h1>
                <p className="text-[11px] text-gray-400">
                  Tentativas utilizadas: <strong className="text-[#d4844f]">{attempts} de 3</strong>
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              onClick={handleRestartAttempt}
              disabled={attempts >= 3 || isSaving}
              className={`px-3 py-2 rounded-lg font-semibold transition ${
                attempts >= 3
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  : 'bg-[#d4844f] text-[#0f0f0f] hover:brightness-110 shadow-md'
              }`}
            >
              {attempts >= 3 ? '⛔ Tentativas Esgotadas (3/3)' : `🔄 Refazer (${3 - attempts} restante${3 - attempts > 1 ? 's' : ''})`}
            </button>

            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
              className="px-3 py-2 rounded-lg font-semibold bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900/60"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo das abas segue normal ... */}
    </div>
  );
}