'use client';

import { useState, useRef, useEffect } from 'react';
import ResultDashboard from './ResultDashboard';

export default function ChatInterface() {
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

        // Detectar tag de conclusão
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

  // Se o relatório foi gerado, renderiza o dashboard
  if (reportData) {
    return <ResultDashboard data={reportData} onRestart={() => window.location.reload()} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 relative">
      {/* Overlay de Carregamento da Geração de Relatório */}
      {generatingReport && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold text-white">Sintetizando Dossiê Profissional...</h2>
          <p className="text-sm text-slate-400 max-w-md">
            Processando o histórico completo das suas respostas, extraindo matrizes de hard/soft skills e estruturando seus currículos otimizados.
          </p>
        </div>
      )}

      {/* Barra Superior */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <h1 className="font-bold text-base md:text-lg text-white">Talento Oculto — Entrevistador Camaleão</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-700 px-3 py-1.5 rounded-full text-slate-300 font-medium">
            Interações: {questionCount}
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className={`text-xs px-4 py-2 rounded-full font-semibold transition shadow-md ${
              isFinishedByAI || questionCount >= 5
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-bounce'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isFinishedByAI ? '🎉 Ver Relatório & Currículos Prontos' : '📊 Concluir e Gerar Relatório'}
          </button>
        </div>
      </header>

      {/* Banner de Aviso quando a IA indica conclusão */}
      {isFinishedByAI && (
        <div className="bg-emerald-900/80 border-b border-emerald-700 text-emerald-200 px-6 py-3 text-sm flex items-center justify-between">
          <span>✨ A entrevista foi concluída com sucesso! Clique no botão para gerar seus currículos.</span>
          <button
            onClick={handleGenerateReport}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition"
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
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-sm md:text-base leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 text-slate-400 rounded-2xl rounded-bl-none px-5 py-3.5 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-2">Analisando histórico e formulando a próxima etapa...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões de Resposta Rápida no início */}
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
              className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-3 py-1.5 rounded-full transition"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Caixa de Entrada de Texto */}
      <footer className="bg-slate-800 border-t border-slate-700 p-4">
        <form onSubmit={(e) => handleSubmit(e, null)} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua resposta detalhada..."
            disabled={loading || generatingReport}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-sm md:text-base"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || generatingReport}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center text-sm md:text-base shadow-lg shadow-indigo-600/20"
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}