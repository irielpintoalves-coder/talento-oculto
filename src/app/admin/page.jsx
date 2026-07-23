'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [org, setOrg] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para cadastro de novo cliente
  const [newClientEmail, setNewClientEmail] = useState('');
  const [addingClient, setAddingClient] = useState(false);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // Busca a organização associada ao e-mail do Admin logado
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .ilike('admin_email', user.email)
      .maybeSingle();

    if (!orgData) {
      alert('Sua conta de Admin não possui uma gestão de licenças vinculada. Entre em contato com o suporte Master.');
      router.push('/interview');
      return;
    }

    setOrg(orgData);

    // Busca todos os clientes vinculados a este Admin/Organização
    const { data: clientsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', orgData.id)
      .order('created_at', { ascending: false });

    setClients(clientsData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // 1. Cadastrar Novo Cliente (Consome 1 licença da cota)
  const handleAddClient = async (e) => {
    e.preventDefault();
    const cleanEmail = newClientEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    const activeClients = clients.filter(c => c.is_active !== false);
    if (activeClients.length >= org.total_licenses) {
      alert(`⚠️ Cota esgotada! Você já utilizou todas as ${org.total_licenses} licenças contratadas.`);
      return;
    }

    setAddingClient(true);

    // Verifica se o e-mail já existe na base
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email, organization_id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      if (existingProfile.organization_id === org.id) {
        alert('Este cliente já está cadastrado na sua carteira.');
        setAddingClient(false);
        return;
      }

      if (existingProfile.organization_id) {
        alert('Este e-mail já está vinculado a outro painel.');
        setAddingClient(false);
        return;
      }

      // Se o usuário existia sem empresa, vincula ao Admin atual
      await supabase
        .from('profiles')
        .update({ organization_id: org.id, is_active: true })
        .ilike('email', cleanEmail);
    } else {
      // Pré-cadastra o cliente para que ele possa logar e usar a licença
      const { error } = await supabase
        .from('profiles')
        .insert({
          email: cleanEmail,
          organization_id: org.id,
          role: 'user',
          is_active: true,
          interview_attempts: 0
        });

      if (error) {
        alert('Erro ao cadastrar cliente: ' + error.message);
        setAddingClient(false);
        return;
      }
    }

    alert(`✅ Cliente ${cleanEmail} cadastrado! 1 licença consumida da sua cota.`);
    setNewClientEmail('');
    setAddingClient(false);
    loadData();
  };

  // 2. Resetar Tentativas de Entrevista do Cliente
  const handleResetAttempts = async (email) => {
    if (confirm(`Deseja liberar mais 3 tentativas para o cliente ${email}?`)) {
      await supabase
        .from('profiles')
        .update({ interview_attempts: 0 })
        .ilike('email', email);
      
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#daa520] font-mono">
        Carregando painel de clientes...
      </div>
    );
  }

  const activeClients = clients.filter(c => c.is_active !== false);
  const isLimitReached = activeClients.length >= org.total_licenses;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8dcc8] p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-[#2d5f4f] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#daa520]">{org.name} — Gestão de Licenças & Clientes</h1>
          <p className="text-xs text-gray-400">Cadastre clientes, monitore cotas e acesse os dossiês gerados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/interview" className="px-4 py-2 bg-[#2d5f4f] rounded-xl text-xs font-bold text-white hover:brightness-110">
            Ir para Entrevista
          </Link>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="px-4 py-2 bg-gray-800 rounded-xl text-xs font-bold text-gray-300 hover:bg-gray-700"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Cards de Métricas de Licenças */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400 mb-1">Total de Licenças Contratadas</p>
          <p className="text-2xl font-bold text-[#daa520]">{org.total_licenses}</p>
        </div>
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400 mb-1">Licenças Consumidas / Em Uso</p>
          <p className="text-2xl font-bold text-white">{activeClients.length}</p>
        </div>
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400 mb-1">Licenças Disponíveis</p>
          <p className={`text-2xl font-bold ${isLimitReached ? 'text-red-400' : 'text-green-400'}`}>
            {Math.max(0, org.total_licenses - activeClients.length)}
          </p>
        </div>
      </div>

      {/* Formulário de Cadastro de Cliente */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-3">
        <h2 className="text-md font-bold text-[#daa520]">👤 Cadastrar Novo Cliente</h2>
        <p className="text-xs text-gray-400">
          Informe o e-mail do seu cliente. Ao cadastrar, <strong>1 licença da sua cota é reservada</strong> e ele poderá fazer login para realizar a entrevista.
        </p>

        <form onSubmit={handleAddClient} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="email"
            placeholder="cliente@email.com"
            value={newClientEmail}
            onChange={(e) => setNewClientEmail(e.target.value)}
            disabled={isLimitReached}
            className="flex-1 bg-[#0f0f0f] border border-[#2d5f4f] rounded-xl px-4 py-2.5 text-xs text-[#e8dcc8] focus:outline-none disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={addingClient || isLimitReached}
            className="px-6 py-2.5 bg-[#d4844f] text-[#0f0f0f] font-bold rounded-xl text-xs hover:brightness-110 transition disabled:opacity-50"
          >
            {addingClient ? 'Cadastrando...' : '➕ Cadastrar Cliente'}
          </button>
        </form>

        {isLimitReached && (
          <p className="text-[11px] text-amber-400 mt-2">
            💡 Todas as suas licenças foram consumidas. Entre em contato com o Master para adquirir mais licenças para seus novos clientes.
          </p>
        )}
      </section>

      {/* Tabela de Clientes */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">📋 Carteira de Clientes</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2.5 px-4">E-MAIL DO CLIENTE</th>
                <th className="py-2.5 px-4">STATUS LICENÇA</th>
                <th className="py-2.5 px-4">TENTATIVAS</th>
                <th className="py-2.5 px-4">DOSSIÊ DO CLIENTE</th>
                <th className="py-2.5 px-4">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-gray-500">
                    Nenhum cliente cadastrado ainda. Use o campo acima para liberar uma licença.
                  </td>
                </tr>
              ) : (
                clients.map((c) => {
                  const isActive = c.is_active !== false;
                  return (
                    <tr key={c.email} className="border-b border-[#2d5f4f]/30 hover:bg-[#222222]">
                      <td className="py-3 px-4 font-mono text-[#e8dcc8]">{c.email}</td>
                      
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isActive 
                            ? 'bg-green-950 text-green-300 border border-green-800' 
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {isActive ? '● Active License' : '○ Inativa'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-[#daa520]">
                        {c.interview_attempts || 0} / 3
                      </td>

                      <td className="py-3 px-4">
                        {c.saved_interview ? (
                          <button
                            onClick={() => setSelectedReport(c.saved_interview)}
                            className="px-3 py-1 bg-[#2d5f4f] text-[#daa520] font-bold rounded-lg hover:brightness-110 transition"
                          >
                            📄 Ver Dossiê
                          </button>
                        ) : (
                          <span className="text-gray-500 italic">Pendente de Acesso</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleResetAttempts(c.email)}
                          className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-lg hover:bg-amber-900 transition font-medium"
                        >
                          🔄 Resetar Tentativas
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Dossiê */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2d5f4f] rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2d5f4f] pb-3">
              <h3 className="font-bold text-[#daa520]">📄 Dossiê do Cliente</h3>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="text-red-400 font-bold text-sm hover:text-red-300"
              >
                Fechar ✖
              </button>
            </div>
            <div className="bg-[#0f0f0f] p-4 rounded-xl text-xs space-y-3 font-mono text-gray-300 leading-relaxed">
              <p><strong className="text-[#daa520]">Resumo Profissional:</strong> {selectedReport.professional_summary}</p>
              <p><strong className="text-[#daa520]">Hard Skills:</strong> {selectedReport.hard_skills?.join(', ')}</p>
              <p><strong className="text-[#daa520]">Soft Skills:</strong> {selectedReport.soft_skills?.join(', ')}</p>
              <p><strong className="text-[#daa520]">Cargos Recomendados:</strong> {selectedReport.career_suggestions?.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}