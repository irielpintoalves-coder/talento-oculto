'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .ilike('admin_email', user.email)
      .maybeSingle();

    if (!orgData) {
      alert('Organização não localizada.');
      router.push('/login');
      return;
    }

    setOrg(orgData);

    const { data: membersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', orgData.id);

    setMembers(membersData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Resetar Tentativas de Entrevista do Usuário
  const handleResetAttempts = async (email) => {
    if (confirm(`Deseja zerar as tentativas de entrevista para ${email}?`)) {
      await supabase
        .from('profiles')
        .update({ interview_attempts: 0 })
        .ilike('email', email);
      
      loadData();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#daa520]">Carregando...</div>;

  // Calcula apenas licenças ativas no total
  const activeMembers = members.filter(m => m.is_active !== false);
  const isLimitReached = activeMembers.length >= org.total_licenses;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8dcc8] p-6 space-y-8">
      <header className="flex justify-between items-center border-b border-[#2d5f4f] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#daa520]">{org.name} — Gestão da Equipe</h1>
          <p className="text-xs text-gray-400">Controle de Membros, Relatórios e Tentativas</p>
        </div>
        <Link href="/login" className="px-4 py-2 bg-[#2d5f4f] rounded-xl text-xs font-bold text-white">Voltar</Link>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400">Licenças Contratadas</p>
          <p className="text-2xl font-bold text-[#daa520]">{org.total_licenses}</p>
        </div>
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400">Licenças Ativas em Uso</p>
          <p className="text-2xl font-bold text-white">{activeMembers.length}</p>
        </div>
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400">Disponíveis para Ativação</p>
          <p className={`text-2xl font-bold ${isLimitReached ? 'text-red-400' : 'text-green-400'}`}>
            {org.total_licenses - activeMembers.length}
          </p>
        </div>
      </div>

      {/* Aviso quando o limite é atingido */}
      {isLimitReached && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs">
          💡 <strong>Limite de licenças atingido.</strong> Caso precise substituir um usuário inativo por um novo colaborador, entre em contato com o <strong>Administrador Master</strong> para inativar a licença desejada.
        </div>
      )}

      {/* Lista de Usuários e Ações */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">📋 Usuários da Licença</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2.5 px-4">E-MAIL</th>
                <th className="py-2.5 px-4">STATUS</th>
                <th className="py-2.5 px-4">TENTATIVAS</th>
                <th className="py-2.5 px-4">ENTREVISTA SALVA</th>
                <th className="py-2.5 px-4">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-[#2d5f4f]/40">
                  <td className="py-3 px-4 font-mono text-[#e8dcc8]">{m.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${m.is_active !== false ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                      {m.is_active !== false ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#daa520]">{m.interview_attempts || 0} / 3</td>
                  <td className="py-3 px-4">
                    {m.saved_interview ? (
                      <button
                        onClick={() => setSelectedReport(m.saved_interview)}
                        className="px-3 py-1 bg-[#2d5f4f] text-[#daa520] font-bold rounded-lg hover:bg-[#3a7d66] transition"
                      >
                        📄 Ver Dossiê
                      </button>
                    ) : (
                      <span className="text-gray-500">Pendente</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleResetAttempts(m.email)}
                      className="px-3 py-1 bg-amber-950/60 text-amber-300 border border-amber-800 rounded-lg hover:bg-amber-900/80 transition"
                    >
                      🔄 Resetar Tentativas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Visualização de Dossiê */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2d5f4f] rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-[#2d5f4f] pb-3">
              <h3 className="font-bold text-[#daa520]">📄 Dossiê do Colaborador</h3>
              <button onClick={() => setSelectedReport(null)} className="text-red-400 font-bold text-sm">Fechar ✖</button>
            </div>
            <div className="bg-[#0f0f0f] p-4 rounded-xl text-xs space-y-3 font-mono text-gray-300">
              <p><strong>Resumo:</strong> {selectedReport.professional_summary}</p>
              <p><strong>Hard Skills:</strong> {selectedReport.hard_skills?.join(', ')}</p>
              <p><strong>Cargos Recomendados:</strong> {selectedReport.career_suggestions?.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}