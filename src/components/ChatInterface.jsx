'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import ResultDashboard from './ResultDashboard';

export default function ChatInterface() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Olá! Sou o seu Entrevistador Camaleão. Para começarmos um mapeamento profundo de toda a sua trajetória profissional, me conte qual é ou qual foi o seu cargo e atividade principal mais recente (ex: Analista de Suporte, Operador de Máquinas, Auxiliar Administrativo, etc.).',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isFinishedByAI, setIsFinishedByAI] = useState(false);
  const [reportData, setReportData] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e, textToSend) => {
    if (e) e.preventDefault();
    const content = textToSend || input;
    if (!content.trim() || loading || generatingReport) return;

    const userMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setQuestionCount((prev) => prev + 1);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      if (response.ok) {
        let replyText = data.reply || '';

        if (replyText.includes('[ENTREVISTA_CONCLUIDA]')) {
          replyText = replyText.replace('[ENTREVISTA_CONCLUIDA]', '').trim();
          setIsFinishedByAI(true);
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: replyText }]);
      } else {
        throw new Error(data.error || 'Erro na comunicação com a IA.');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Desculpe, tive um pequeno problema técnico. Poderia repetir sua última resposta?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReportData(data.data);
      } else {
        alert(data.error || 'Ocorreu um erro ao gerar o relatório. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao gerar o dossiê.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (reportData) {
    return <ResultDashboard data={reportData} onRestart={() => window.location.reload()} />;
  }

  return (
    <div className="flex flex-col h-screen relative" style={{ background: '#0f0f0f', color: '#e8dcc8' }}>
      {/* Overlay de Carregamento */}
      {generatingReport && (
        <div className="absolute inset-0 z-50 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4" style={{ background: 'rgba(15,15,15,0.95)' }}>
          <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: '#daa520', borderTopColor: 'transparent' }}></div>
          <h2 className="text-xl font-bold" style={{ color: '#daa520' }}>Sintetizando Dossiê Profissional...</h2>
          <p className="text-sm max-w-md" style={{ color: '#888' }}>
            Processando o histórico completo das suas respostas, extraindo matrizes de hard/soft skills e estruturando seus currículos otimizados.
          </p>
        </div>
      )}

      {/* Barra Superior */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 shadow-md gap-3" style={{ background: '#1a1a1a', borderBottom: '1px solid #2d5f4f' }}>
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 group">
            <img 
              src="/favicon.png" 
              alt="Talento Oculto" 
              className="w-10 h-10 logo-glow-pulse"
            />
            <h1 className="font-bold text-base md:text-lg" style={{ color: '#daa520' }}>
              Talento Oculto <span className="text-xs font-normal text-gray-400">— Entrevistador Camaleão</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Link para Home */}
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg font-medium transition hover:bg-[#252525]"
            style={{ color: '#e8dcc8' }}
          >
            🏠 Início
          </Link>

          {/* Link para Acesso/Login */}
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg font-semibold transition border hover:bg-[#252525]"
            style={{ borderColor: '#2d5f4f', color: '#daa520' }}
          >
            🔐 Gerenciar Logins
          </Link>

          {/* Contador de Interações */}
          <div className="px-3 py-1.5 rounded-full font-medium" style={{ background: '#2d5f4f', color: '#daa520', border: '1px solid #3a7d66' }}>
            Interações: {questionCount}
          </div>

          {/* Botão de Concluir Relatório */}
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className={`px-4 py-1.5 rounded-full font-semibold transition shadow-md text-white ${
              isFinishedByAI || questionCount >= 5 ? 'animate-bounce' : ''
            }`}
            style={{ background: isFinishedByAI || questionCount >= 5 ? '#d4844f' : '#2d5f4f' }}
          >
            {isFinishedByAI ? '🎉 Ver Relatório' : '📊 Gerar Relatório'}
          </button>

          {/* Botão de Logout */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg font-semibold transition bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900/60"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Banner de Aviso */}
      {isFinishedByAI && (
        <div className="text-sm flex items-center justify-between px-6 py-3" style={{ background: '#2d5f4f', color: '#daa520', borderBottom: '1px solid #3a7d66' }}>
          <span>✨ A entrevista foi concluída com sucesso! Clique no botão para gerar seus currículos.</span>
          <button
            onClick={handleGenerateReport}
            className="font-bold px-3 py-1 rounded-lg text-xs transition"
            style={{ background: '#d4844f', color: '#0f0f0f' }}
          >
            Gerar Agora
          </button>
        </div>
      )}

      {/* Container de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-sm md:text-base leading-relaxed`}
              style={{
                background: msg.role === 'user' ? '#d4844f' : '#1a1a1a',
                color: msg.role === 'user' ? '#0f0f0f' : '#e8dcc8',
                border: msg.role === 'user' ? 'none' : '1px solid #2d5f4f',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                borderBottomLeftRadius: msg.role === 'user' ? '20px' : '4px',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-5 py-3.5 text-sm flex items-center space-x-2" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f', color: '#888' }}>
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#daa520' }}></span>
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#daa520', animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#daa520', animationDelay: '0.4s' }}></span>
              <span className="ml-2">Analisando histórico e formulando a próxima etapa...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões de Resposta Rápida */}
      {messages.length === 1 && (
        <div className="px-4 py-2 max-w-4xl mx-auto w-full flex flex-wrap gap-2">
          {[
            'Analista de Suporte de TI',
            'Assistente Administrativo / Financeiro',
            'Operador de Produção e Logística',
            'Atendente Comercial e Vendas',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={(e) => handleSubmit(e, chip)}
              className="text-xs px-3 py-1.5 rounded-full transition"
              style={{ background: '#1a1a1a', color: '#daa520', border: '1px solid #2d5f4f' }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Caixa de Entrada */}
      <footer className="p-4" style={{ background: '#1a1a1a', borderTop: '1px solid #2d5f4f' }}>
        <form onSubmit={(e) => handleSubmit(e, null)} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua resposta detalhada..."
            disabled={loading || generatingReport}
            className="flex-1 rounded-xl px-4 py-3 text-sm md:text-base transition"
            style={{
              background: '#0f0f0f',
              border: '1px solid #2d5f4f',
              color: '#e8dcc8',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || generatingReport}
            className="font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center text-sm md:text-base shadow-lg disabled:opacity-50 text-white"
            style={{ background: '#d4844f' }}
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}