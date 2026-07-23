'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function MasterDashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [profiles, setProfiles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para Criação de Organização + Admin
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [totalLicenses, setTotalLicenses] = useState(5);
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Estados para Cadastro Direto de Usuário/Admin pelo Master
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserOrgId, setNewUserOrgId] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

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
      .select('*, organizations(id, name, admin_email)')
      .order('created_at', { ascending: false });

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    setProfiles(profilesData || []);
    setOrganizations(orgsData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // 1. Cadastrar Organização + Garantir Perfil do Admin
  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    const cleanAdminEmail = adminEmail.trim().toLowerCase();
    if (!orgName.trim() || !cleanAdminEmail) return;

    setCreatingOrg(true);

    // Obtém o usuário logado (Master) para preencher o owner_id
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Cria a Empresa passando o owner_id do Master que está cadastrando
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        admin_email: cleanAdminEmail,
        total_licenses: Number(totalLicenses),
        owner_id: user?.id || null // Preenche o owner_id para evitar o erro de NOT NULL
      })
      .select()
      .single();

    if (orgError) {
      alert('Erro ao criar organização: ' + orgError.message);
      setCreatingOrg(false);
      return;
    }

    // 2. Cria ou atualiza o perfil do Admin automaticamente
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .ilike('email', cleanAdminEmail)
      .maybeSingle();

    if (existingProfile) {
      await supabase
        .from('profiles')
        .update({ role: 'admin', organization_id: newOrg.id, is_active: true })
        .ilike('email', cleanAdminEmail);
    } else {
      await supabase
        .from('profiles')
        .insert({
          email: cleanAdminEmail,
          role: 'admin',
          organization_id: newOrg.id,
          is_active: true,
          interview_attempts: 0
        });
    }

    alert(`✅ Empresa "${orgName}" cadastrada e Admin (${cleanAdminEmail}) configurado!`);
    setOrgName('');
    setAdminEmail('');
    setTotalLicenses(5);
    setCreatingOrg(false);
    loadData();
  };

  // 2. Cadastrar Usuário/Admin/Master Direta e Manualmente
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const cleanEmail = newUserEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setCreatingUser(true);

    const { data: existing } = await supabase
      .from('profiles')
      .select('email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      alert('Este e-mail já está cadastrado no sistema.');
      setCreatingUser(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        email: cleanEmail,
        role: newUserRole,
        organization_id: newUserOrgId || null,
        is_active: true,
        interview_attempts: 0
      });

    if (error) {
      alert('Erro ao cadastrar usuário: ' + error.message);
    } else {
      alert(`✅ Usuário ${cleanEmail} cadastrado como ${newUserRole.toUpperCase()}!`);
      setNewUserEmail('');
      setNewUserOrgId('');
      setNewUserRole('user');
      loadData();
    }
    setCreatingUser(false);
  };

  // 3. Atualizar Cota de Licenças
  const handleUpdateLicenses = async (orgId, currentLicenses) => {
    const newLicenses = prompt('Digite a nova cota de licenças:', currentLicenses);
    if (newLicenses !== null && !isNaN(newLicenses)) {
      await supabase
        .from('organizations')
        .update({ total_licenses: Number(newLicenses) })
        .eq('id', orgId);

      loadData();
    }
  };

  // 4. Mudar Role do Usuário
  const handleRoleChange = async (email, newRole) => {
    if (confirm(`Alterar função de ${email} para "${newRole.toUpperCase()}"?`)) {
      await supabase.from('profiles').update({ role: newRole }).ilike('email', email);
      loadData();
    }
  };

  // 5. Associar Companhia ao Usuário
  const handleAssignOrganization = async (email, orgId) => {
    await supabase.from('profiles').update({ organization_id: orgId || null }).ilike('email', email);
    loadData();
  };

  // 6. Ativar / Inativar Usuário
  const handleToggleUserStatus = async (email, currentStatus) => {
    await supabase.from('profiles').update({ is_active: !currentStatus }).ilike('email', email);
    loadData();
  };

  // 7. Limpar Dossiê
  const handleDeleteInterview = async (email) => {
    if (confirm(`Apagar o dossiê salvo de ${email}?`)) {
      await supabase.from('profiles').update({ saved_interview: null, interview_attempts: 0 }).ilike('email', email);
      loadData();
    }
  };

  // 8. Excluir Usuário Completo
  const handleDeleteUser = async (email) => {
    if (confirm(`⚠️ Excluir permanentemente o usuário ${email}?`)) {
      await supabase.from('profiles').delete().ilike('email', email);
      loadData();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#daa520] font-mono">Carregando Painel Master...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8dcc8] p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-[#2d5f4f] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#daa520]">Painel Master — Gestão Global de SaaS</h1>
          <p className="text-xs text-gray-400">Controle de Organizações, Admins, Licenças e Usuários</p>
        </div>
        <div className="flex gap-2">
          <Link href="/interview" className="px-4 py-2 bg-[#2d5f4f] rounded-xl text-xs font-bold text-white hover:brightness-110">
            Ir para Entrevista
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="px-4 py-2 bg-gray-800 rounded-xl text-xs font-bold text-gray-300 hover:bg-gray-700">
            Sair
          </button>
        </div>
      </header>

      {/* FORMULÁRIO 1: Cadastrar Empresa + Definir Admin */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">🏢 Cadastrar Nova Empresa & Definir Admin</h2>
        
        <form onSubmit={handleCreateOrganization} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Nome da Empresa</label>
            <input
              type="text"
              placeholder="Ex: Empresa Silva"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2d5f4f] rounded-xl px-3 py-2 text-xs text-[#e8dcc8] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">E-mail do Admin Responsável</label>
            <input
              type="email"
              placeholder="admin@empresa.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2d5f4f] rounded-xl px-3 py-2 text-xs text-[#e8dcc8] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Cota de Licenças</label>
            <input
              type="number"
              min="1"
              value={totalLicenses}
              onChange={(e) => setTotalLicenses(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2d5f4f] rounded-xl px-3 py-2 text-xs text-[#e8dcc8] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={creatingOrg}
            className="w-full py-2 bg-[#d4844f] text-[#0f0f0f] font-bold rounded-xl text-xs hover:brightness-110 transition"
          >
            {creatingOrg ? 'Cadastrando...' : '➕ Cadastrar Empresa & Admin'}
          </button>
        </form>

        {/* Tabela de Empresas */}
        <div className="overflow-x-auto pt-4 border-t border-[#2d5f4f]/40">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2 px-3">EMPRESA</th>
                <th className="py-2 px-3">ADMIN RESPONSÁVEL</th>
                <th className="py-2 px-3">LICENÇAS EM USO</th>
                <th className="py-2 px-3">COTA TOTAL</th>
                <th className="py-2 px-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => {
                const used = profiles.filter(p => p.organization_id === org.id && p.is_active !== false).length;
                return (
                  <tr key={org.id} className="border-b border-[#2d5f4f]/30">
                    <td className="py-2.5 px-3 font-bold text-[#e8dcc8]">{org.name}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-300">{org.admin_email}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{used} uso(s)</td>
                    <td className="py-2.5 px-3 text-[#daa520] font-bold">{org.total_licenses} licenças</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleUpdateLicenses(org.id, org.total_licenses)}
                        className="px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-lg text-[11px] hover:bg-amber-900"
                      >
                        ✏️ Alterar Cota
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* FORMULÁRIO 2: Cadastrar Qualquer Usuário Direto */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">👤 Cadastrar Usuário Direto (Qualquer Nível)</h2>
        
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">E-mail do Usuário</label>
            <input
              type="email"
              placeholder="usuario@email.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2d5f4f] rounded-xl px-3 py-2 text-xs text-[#e8dcc8] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Função / Perfil</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2d5f4f] rounded-xl px-3 py-2 text-xs text-[#daa520] font-bold focus:outline-none"
            >
              <option value="user">👤 User (Colaborador)</option>
              <option value="admin">🛡️ Admin (Gestor da Org)</option>
              <option value="master">👑 Master (Acesso Total)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Vincular a uma Empresa</label>
            <select
              value={newUserOrgId}
              onChange={(e) => setNewUserOrgId(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2d5f4f] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
            >
              <option value="">(Nenhuma / Avulso)</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creatingUser}
            className="w-full py-2 bg-[#2d5f4f] text-white font-bold rounded-xl text-xs hover:brightness-110 transition"
          >
            {creatingUser ? 'Criando...' : '➕ Cadastrar Usuário'}
          </button>
        </form>
      </section>

      {/* BLOCO 3: Gestão Global de Usuários Cadastrados */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">👥 Gestão Global de Todos os Usuários</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2.5 px-3">E-MAIL</th>
                <th className="py-2.5 px-3">PERFIL / TIPO</th>
                <th className="py-2.5 px-3">EMPRESA VINCULADA</th>
                <th className="py-2.5 px-3">STATUS LICENÇA</th>
                <th className="py-2.5 px-3">TENTATIVAS</th>
                <th className="py-2.5 px-3">AÇÕES MASTER</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const isActive = p.is_active !== false;
                return (
                  <tr key={p.email} className="border-b border-[#2d5f4f]/40 hover:bg-[#222222]">
                    <td className="py-3 px-3 font-mono text-[#e8dcc8]">{p.email}</td>

                    {/* Mudar Role */}
                    <td className="py-3 px-3">
                      <select
                        value={p.role || 'user'}
                        onChange={(e) => handleRoleChange(p.email, e.target.value)}
                        className="bg-[#0f0f0f] border border-[#2d5f4f] text-[#daa520] font-bold text-xs rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">🛡️ Admin</option>
                        <option value="master">👑 Master</option>
                      </select>
                    </td>

                    {/* Vincular Empresa */}
                    <td className="py-3 px-3">
                      <select
                        value={p.organization_id || ''}
                        onChange={(e) => handleAssignOrganization(p.email, e.target.value)}
                        className="bg-[#0f0f0f] border border-[#2d5f4f] text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none max-w-[180px] truncate"
                      >
                        <option value="">(Sem Empresa / Avulso)</option>
                        {organizations.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status Ativo/Inativo */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleUserStatus(p.email, isActive)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                          isActive
                            ? 'bg-green-950 text-green-300 border-green-800 hover:bg-red-950 hover:text-red-300'
                            : 'bg-red-950 text-red-300 border-red-800 hover:bg-green-950 hover:text-green-300'
                        }`}
                      >
                        {isActive ? '● Ativo' : '○ Inativo'}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-[#daa520] font-bold">{p.interview_attempts || 0}/3</td>

                    {/* Dossiê e Exclusão */}
                    <td className="py-3 px-3 space-x-1.5">
                      {p.saved_interview && (
                        <>
                          <button
                            onClick={() => setSelectedReport(p.saved_interview)}
                            className="px-2 py-1 bg-[#2d5f4f] text-[#daa520] rounded-lg font-bold text-[10px] hover:brightness-110"
                          >
                            Ver Dossiê
                          </button>
                          <button
                            onClick={() => handleDeleteInterview(p.email)}
                            className="px-2 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg text-[10px] hover:bg-amber-900"
                          >
                            Limpar Dossiê
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteUser(p.email)}
                        className="px-2 py-1 bg-red-950 text-red-300 border border-red-800 rounded-lg text-[10px] font-bold hover:bg-red-900"
                      >
                        Excluir
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