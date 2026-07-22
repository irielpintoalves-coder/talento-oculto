'use client';

import { useState } from 'react';

export default function ResultDashboard({ data, onRestart }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'skills' | 'careers' | 'cv'
  const [selectedCvIndex, setSelectedCvIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Cabeçalho do Painel */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-5 sticky top-0 z-20 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-emerald-400 rounded-full animate-ping"></span>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Talento Oculto — Dossiê Profissional Completo
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Perfil mapeado com sucesso a partir de suas interações detalhadas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
            >
              🖨️ Imprimir / Salvar PDF
            </button>
            <button
              onClick={onRestart}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-indigo-600/30"
            >
              🔄 Nova Entrevista
            </button>
          </div>
        </div>
      </header>

      {/* Navegação por Abas */}
      <div className="bg-slate-900/60 border-b border-slate-800 backdrop-blur-md sticky top-[73px] z-10">
        <div className="max-w-6xl mx-auto flex overflow-x-auto px-6 space-x-2 py-3">
          {[
            { id: 'summary', label: '📊 Resumo Executivo' },
            { id: 'skills', label: '🛠️ Matriz de Competências' },
            { id: 'careers', label: '🎯 Oportunidades & Vagas' },
            { id: 'cv', label: '📄 Currículos Otimizados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {/* ABA: RESUMO EXECUTIVO */}
        {activeTab === 'summary' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                <span>📊</span> Resumo Profissional Estratégico
              </h2>
              <button
                onClick={() => handleCopy(data.professional_summary, 'summary')}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-medium transition"
              >
                {copiedIndex === 'summary' ? '✅ Copiado!' : '📋 Copiar Resumo'}
              </button>
            </div>
            <div className="text-slate-300 text-base leading-relaxed whitespace-pre-line bg-slate-950/50 p-6 rounded-xl border border-slate-800/80">
              {data.professional_summary}
            </div>
          </div>
        )}

        {/* ABA: MATRIZ DE COMPETÊNCIAS */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Hard Skills */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>⚙️</span> Hard Skills (Competências Técnicas)
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {data.hard_skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 px-3.5 py-1.5 rounded-xl text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Soft Skills */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>🧠</span> Soft Skills (Competências Comportamentais)
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {data.soft_skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-sky-950/60 border border-sky-800/80 text-sky-300 px-3.5 py-1.5 rounded-xl text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA: OPORTUNIDADES & CARREIRA */}
        {activeTab === 'careers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-4">
              <span>🎯</span> Transições e Cargos Recomendados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.career_suggestions?.map((career, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl hover:border-amber-500/50 transition group"
                >
                  <div className="text-amber-400 text-lg mb-2 font-bold group-hover:translate-x-1 transition-transform">
                    {idx + 1}. {career}
                  </div>
                  <p className="text-xs text-slate-400">
                    Sugerido com base na combinação de ferramentas, capacidade de solução de gargalos e experiência prática.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: MODELOS DE CURRÍCULO */}
        {activeTab === 'cv' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                  <span>📄</span> Modelos de Currículo Prontos
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione uma das abordagens geradas e copie o texto ou imprima para envio direto a recrutadores.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopy(data.cv_options[selectedCvIndex]?.content, `cv-${selectedCvIndex}`)
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  {copiedIndex === `cv-${selectedCvIndex}` ? '✅ Copiado!' : '📋 Copiar Currículo Completo'}
                </button>
              </div>
            </div>

            {/* Seleção do Modelo */}
            <div className="flex flex-wrap gap-2">
              {data.cv_options?.map((cv, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCvIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedCvIndex === idx
                      ? 'bg-indigo-600 text-white border border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {cv.title}
                </button>
              ))}
            </div>

            {/* Exibição do Currículo Formatado */}
            <div className="bg-slate-950 p-6 md:p-8 rounded-xl border border-slate-800 font-mono text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-indigo-500 selection:text-white">
              {data.cv_options[selectedCvIndex]?.content}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}