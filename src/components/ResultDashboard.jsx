'use client';

import { useState } from 'react';

export default function ResultDashboard({ data, onRestart }) {
  const [activeTab, setActiveTab] = useState('summary');
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

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #2d5f4f',
  };

  const primaryButtonStyle = {
    background: '#d4844f',
    color: '#0f0f0f',
  };

  const secondaryButtonStyle = {
    background: '#2d5f4f',
    color: '#daa520',
    border: '1px solid #3a7d66',
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#0f0f0f',
        color: '#e8dcc8',
      }}
    >
>
      {/* Cabeçalho do Painel */}
      <header
  className="sticky top-0 z-20 shadow-xl"
  style={{
    background: '#1a1a1a',
    borderBottom: '1px solid #2d5f4f'
  }}
>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
                        <img 
  src="/favicon.png" 
  alt="Talento Oculto" 
  className="w-12 h-12 logo-glow-pulse"
/>
              <h1
  className="text-xl font-bold"
  style={{ color: '#daa520' }}
>
                Talento Oculto — Dossiê Profissional Completo
              </h1>
            </div>
            <p
  className="text-xs mt-1"
  style={{ color: '#888' }}
>
              Perfil mapeado com sucesso a partir de suas interações detalhadas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
  onClick={handlePrint}
  className="text-xs px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
  style={{
    background: '#2d5f4f',
    color: '#daa520',
    border: '1px solid #3a7d66',
  }}
>
              🖨️ Imprimir / Salvar PDF
            </button>
			const cardStyle = {
  background: '#1a1a1a',
  border: '1px solid #2d5f4f',
};

const primaryButtonStyle = {
  background: '#d4844f',
  color: '#0f0f0f',
};

const secondaryButtonStyle = {
  background: '#2d5f4f',
  color: '#daa520',
  border: '1px solid #3a7d66',
};
            <button
  onClick={onRestart}
  className="text-xs px-4 py-2 rounded-lg font-semibold transition shadow-md"
  style={primaryButtonStyle}
>
  🔄 Nova Entrevista
</button>
          </div>
        </div>
      </header>

      {/* Navegação por Abas */}
<div
  className="backdrop-blur-md sticky top-[73px] z-10"
  style={{
    background: '#1a1a1a',
    borderBottom: '1px solid #2d5f4f',
  }}
>
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
        className="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition"
        style={
          activeTab === tab.id
            ? {
                background: '#d4844f',
                color: '#0f0f0f',
              }
            : {
                background: '#1a1a1a',
                color: '#daa520',
                border: '1px solid #2d5f4f',
              }
        }
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
  <div
    className="rounded-2xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn"
    style={cardStyle}
  >
    <div
      className="flex items-center justify-between pb-4"
      style={{ borderBottom: '1px solid #2d5f4f' }}
    >
      <h2
        className="text-xl font-bold flex items-center gap-2"
        style={{ color: '#daa520' }}
      >
        <span>📊</span> Resumo Profissional Estratégico
      </h2>

      <button
        onClick={() => handleCopy(data.professional_summary, 'summary')}
        className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
        style={secondaryButtonStyle}
      >
        {copiedIndex === 'summary'
          ? '✅ Copiado!'
          : '📋 Copiar Resumo'}
      </button>
    </div>

    <div
      className="text-base leading-relaxed whitespace-pre-line p-6 rounded-xl"
      style={{
        background: '#0f0f0f',
        border: '1px solid #2d5f4f',
        color: '#e8dcc8',
      }}
    >
      {data.professional_summary}
    </div>
  </div>
)}

        {/* ABA: MATRIZ DE COMPETÊNCIAS */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Hard Skills */}
            <div
  className="rounded-2xl p-6 shadow-xl space-y-4"
  style={cardStyle}
>
  <h2
    className="text-lg font-bold flex items-center gap-2 pb-3"
    style={{
      color: '#daa520',
      borderBottom: '1px solid #2d5f4f',
    }}
  >
    <span>⚙️</span> Hard Skills (Competências Técnicas)
  </h2>

  <div className="flex flex-wrap gap-2.5">
    {data.hard_skills?.map((skill, idx) => (
      <span
        key={idx}
        className="px-3.5 py-1.5 rounded-xl text-sm font-medium"
        style={{
          background: 'rgba(45,95,79,.2)',
          border: '1px solid #2d5f4f',
          color: '#daa520',
        }}
      >
        {skill}
      </span>
    ))}
  </div>
</div>

            {/* Soft Skills */}
            <div
  className="rounded-2xl p-6 shadow-xl space-y-4"
  style={cardStyle}
>
  <h2
    className="text-lg font-bold flex items-center gap-2 pb-3"
    style={{
      color: '#d4844f',
      borderBottom: '1px solid #2d5f4f',
    }}
  >
    <span>🧠</span> Soft Skills (Competências Comportamentais)
  </h2>

  <div className="flex flex-wrap gap-2.5">
    {data.soft_skills?.map((skill, idx) => (
      <span
        key={idx}
        className="px-3.5 py-1.5 rounded-xl text-sm font-medium"
        style={{
          background: 'rgba(212,132,79,.15)',
          border: '1px solid #d4844f',
          color: '#e8dcc8',
        }}
      >
        {skill}
      </span>
    ))}
  </div>
</div>
        )}

        {/* ABA: OPORTUNIDADES & CARREIRA */}
        {activeTab === 'careers' && (
          <div className="background: '#1a1a1a' border borderBottom: '1px solid #2d5f4f' rounded-2xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold style={{ color: '#daa520' }} flex items-center gap-2 border-b borderBottom: '1px solid #2d5f4f' pb-4">
              <span>🎯</span> Transições e Cargos Recomendados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.career_suggestions?.map((career, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border borderBottom: '1px solid #2d5f4f' p-5 rounded-xl hover:border-amber-500/50 transition group"
                >
                  <div className="style={{ color: '#daa520' }} text-lg mb-2 font-bold group-hover:translate-x-1 transition-transform">
                    {idx + 1}. {career}
                  </div>
                  <p className="text-xs style={{ color: '#888' }}">
                    Sugerido com base na combinação de ferramentas, capacidade de solução de gargalos e experiência prática.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: MODELOS DE CURRÍCULO */}
        {activeTab === 'cv' && (
          <div className="background: '#1a1a1a' border borderBottom: '1px solid #2d5f4f' rounded-2xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b borderBottom: '1px solid #2d5f4f' pb-4">
              <div>
                <h2 className="text-xl font-bold style={{ color: '#daa520' }} flex items-center gap-2">
                  <span>📄</span> Modelos de Currículo Prontos
                </h2>
                <p
  className="text-xs mt-1"
  style={{ color: '#888' }}
>
                  Selecione uma das abordagens geradas e copie o texto ou imprima para envio direto a recrutadores.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopy(data.cv_options[selectedCvIndex]?.content, `cv-${selectedCvIndex}`)
                  }
                  className="style={{
  background: '#d4844f',
  color: '#0f0f0f'
}} hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/30 flex items-center gap-2"
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
                      ? 'style={{
  background: '#d4844f',
  color: '#0f0f0f'
}} text-white border border-indigo-500'
                      : 'style={{
  background: '#2d5f4f',
  color: '#daa520',
  border: '1px solid #3a7d66'
}} text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {cv.title}
                </button>
              ))}
            </div>

            {/* Exibição do Currículo Formatado */}
<div
  className="rounded-xl shadow-xl"
  style={{
    background: '#ffffff',
    color: '#111111',
    padding: '40px',
    fontFamily: 'Arial',
    maxWidth: '850px',
    margin: '0 auto'
  }}
>
              {data.cv_options[selectedCvIndex]?.content}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}