'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function MasterDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .ilike('email', user.email)
      .maybeSingle();

    if (profile?.role !== 'master') { router.push('/interview'); return; }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*, organizations(name, admin_email)')
      .order('created_at', { ascending: false });

    const { data: orgsData } = await supabase.from('organizations').select('*');

    setProfiles(profilesData || []);
    setOrganizations(orgsData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // 1. Inativar / Ativar Licença do Usuário
  const handleToggleUserStatus = async (email, currentStatus) => {
    const newStatus = !currentStatus;
    await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .ilike('email', email);

    loadData();
  };

  // 2. Excluir Apenas a Entrevista Salva
  const handleDeleteInterview = async (email) => {
    if (confirm(`Tem certeza que deseja apagar o dossiê salvo de ${email}?`)) {
      await supabase
        .from('profiles')
        .update({ saved_interview: null, interview_attempts: 0 })
        .ilike('email', email);

      loadData();
    }
  };

  // 3. Excluir Usuário Completo (Com Aviso de Devolução de Licença)
  const handleDeleteUser = async (email, orgName) => {
    const confirmed = confirm(
      `⚠️ ATENÇÃO: Ao excluir o usuário (${email}):\n\n` +
      `1. O perfil e a entrevista salva serão PERMANENTEMENTE excluídos.\n` +
      `2. A licença associada será imediatamente devolvida ao Admin da empresa "${orgName || 'Sem Org'}".\n\n` +
      `Deseja prosseguir?`
    );

    if (confirmed) {
      await supabase.from('profiles').delete().ilike('email', email);
      loadData();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#daa520]">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8dcc8] p-6 space-y-8">
      <header className="flex justify-between items-center border-b border-[#2d5f4f] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#daa520]">Painel Master — Controle Total</h1>
          <p className="text-xs text-gray-400">Inativação de Licenças, Exclusões e Gestão Global</p>
        </div>
        <Link href="/login" className="px-4 py-2 bg-[#2d5f4f] rounded-xl text-xs font-bold text-white">Voltar</Link>
      </header>

      {/* Tabela Global de Perfis e Licenças */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">👥 Gestão Global de Usuários e Licenças</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2.5 px-4">E-MAIL</th>
                <th className="py-2.5 px-4">ORGANIZAÇÃO</th>
                <th className="py-2.5 px-4">STATUS DA LICENÇA</th>
                <th className="py-2.5 px-4">TENTATIVAS</th>
                <th className="py-2.5 px-4">AÇÕES MASTER</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const isActive = p.is_active !== false;
                return (
                  <tr key={p.email} className="border-b border-[#2d5f4f]/40">
                    <td className="py-3 px-4 font-mono text-[#e8dcc8]">{p.email}</td>
                    <td className="py-3 px-4 text-gray-400">{p.organizations?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleUserStatus(p.email, isActive)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                          isActive ? 'bg-green-950 text-green-300 border-green-800 hover:bg-red-950 hover:text-red-300' : 'bg-red-950 text-red-300 border-red-800 hover:bg-green-950 hover:text-green-300'
                        }`}
                      >
                        {isActive ? '● Ativo (Clique p/ Inativar)' : '○ Inativo (Clique p/ Ativar)'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-[#daa520] font-bold">{p.interview_attempts || 0} / 3</td>
                    <td className="py-3 px-4 space-x-2">
                      {p.saved_interview && (
                        <>
                          <button
                            onClick={() => setSelectedReport(p.saved_interview)}
                            className="px-2.5 py-1 bg-[#2d5f4f] text-[#daa520] rounded-lg font-bold hover:brightness-110"
                          >
                            Ver Dossiê
                          </button>
                          <button
                            onClick={() => handleDeleteInterview(p.email)}
                            className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg hover:bg-amber-900"
                          >
                            Limpar Dossiê
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteUser(p.email, p.organizations?.name)}
                        className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-800 rounded-lg hover:bg-red-900 font-bold"
                      >
                        Excluir Usuário
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Dossiê */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2d5f4f] rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-[#2d5f4f] pb-3">
              <h3 className="font-bold text-[#daa520]">📄 Dossiê Completo do Usuário</h3>
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