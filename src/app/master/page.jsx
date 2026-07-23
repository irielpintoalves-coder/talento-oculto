'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function MasterDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Organização
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [totalLicenses, setTotalLicenses] = useState(5);
  const [msgOrg, setMsgOrg] = useState('');

  // Form Individual de Usuário / Tipo de Licença
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userOrgId, setUserOrgId] = useState('');
  const [msgUser, setMsgUser] = useState('');

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

    if (profile?.role !== 'master') {
      router.push('/interview');
      return;
    }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*, organizations(name)')
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

  // 1. Cadastrar / Editar Organização & Cota
  const handleSaveOrganization = async (e) => {
    e.preventDefault();
    setMsgOrg('Salvando organização...');
    const emailClean = adminEmail.trim().toLowerCase();

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .upsert({ 
        name: orgName, 
        admin_email: emailClean, 
        total_licenses: Number(totalLicenses) 
      }, { onConflict: 'admin_email' })
      .select()
      .single();

    if (orgErr) {
      setMsgOrg(`Erro: ${orgErr.message}`);
      return;
    }

    // Garante o perfil do Admin da Organização
    await supabase.from('profiles').upsert({
      email: emailClean,
      role: 'admin',
      organization_id: org.id
    }, { onConflict: 'email' });

    setMsgOrg('Organização e Admin salvos com sucesso!');
    setOrgName('');
    setAdminEmail('');
    setTotalLicenses(5);
    loadData();
  };

  // 2. Definir / Atualizar Tipo de Licença (Role) de um Usuário
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!userEmail.trim()) return;

    setMsgUser('Atualizando usuário...');
    const emailClean = userEmail.trim().toLowerCase();

    const payload = {
      email: emailClean,
      role: userRole,
      organization_id: userOrgId || null
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'email' });

    if (error) {
      setMsgUser(`Erro: ${error.message}`);
    } else {
      setMsgUser('Perfil e tipo de licença atualizados!');
      setUserEmail('');
      setUserRole('user');
      setUserOrgId('');
      loadData();
    }
  };

  // 3. Alterar Tipo de Licença diretamente na tabela
  const handleQuickRoleChange = async (email, newRole) => {
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .ilike('email', email);
    
    loadData();
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#daa520]">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8dcc8] p-6 space-y-8">
      <header className="flex justify-between items-center border-b border-[#2d5f4f] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#daa520]">Painel Master</h1>
          <p className="text-xs text-gray-400">Controle de Organizações, Licenças e Papéis de Usuários</p>
        </div>
        <Link href="/login" className="px-4 py-2 bg-[#2d5f4f] rounded-xl text-xs font-bold text-white">Voltar</Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCO 1: Cadastrar / Editar Cota da Organização */}
        <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
          <h2 className="text-md font-bold text-[#daa520]">🏢 1. Criar/Editar Organização e Cota</h2>
          <form onSubmit={handleSaveOrganization} className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold">Nome da Organização</label>
              <input
                type="text"
                placeholder="Ex: Empresa ACME"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#e8dcc8]"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold">E-mail do Admin Responsável</label>
              <input
                type="email"
                placeholder="admin@empresa.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#e8dcc8]"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold">Cota Total de Licenças</label>
              <input
                type="number"
                min="1"
                value={totalLicenses}
                onChange={(e) => setTotalLicenses(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#daa520] font-bold"
                required
              />
            </div>
            <button type="submit" className="w-full bg-[#d4844f] text-[#0f0f0f] font-bold py-2.5 px-4 rounded-xl text-xs">
              Salvar Organização e Cota
            </button>
          </form>
          {msgOrg && <p className="text-xs text-green-400">{msgOrg}</p>}
        </section>

        {/* BLOCO 2: Definir Tipo de Licença / Função Individual */}
        <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
          <h2 className="text-md font-bold text-[#daa520]">👤 2. Definir Tipo de Licença de Usuário</h2>
          <form onSubmit={handleSaveUserRole} className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold">E-mail do Usuário</label>
              <input
                type="email"
                placeholder="usuario@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#e8dcc8]"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold">Tipo de Licença / Função (Role)</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#daa520] font-bold"
              >
                <option value="user">User (Usuário Final)</option>
                <option value="admin">Admin (Gestor da Licença)</option>
                <option value="master">Master (Super Admin Geral)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold">Vincular à Organização (Opcional)</label>
              <select
                value={userOrgId}
                onChange={(e) => setUserOrgId(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#e8dcc8]"
              >
                <option value="">Sem organização vinculada</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#2d5f4f] hover:bg-[#234b3e] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition">
              Salvar Permissão do Usuário
            </button>
          </form>
          {msgUser && <p className="text-xs text-green-400">{msgUser}</p>}
        </section>
      </div>

      {/* TABELA 1: Organizações e Monitoramento de Cotas */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">📊 Organizações e Consumo de Cotas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2.5 px-4">ORGANIZAÇÃO</th>
                <th className="py-2.5 px-4">ADMIN RESPONSÁVEL</th>
                <th className="py-2.5 px-4">USO DE LICENÇAS</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((o) => {
                const used = profiles.filter(p => p.organization_id === o.id).length;
                return (
                  <tr key={o.id} className="border-b border-[#2d5f4f]/40">
                    <td className="py-3 px-4 font-bold text-[#e8dcc8]">{o.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-300">{o.admin_email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full font-bold ${used >= o.total_licenses ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-[#2d5f4f] text-[#daa520]'}`}>
                        {used} de {o.total_licenses} em uso
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* TABELA 2: Todos os Perfis e Ajuste Rápido de Tipo de Licença */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">👥 Gestão de Perfis Cadastrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2.5 px-4">E-MAIL</th>
                <th className="py-2.5 px-4">ORGANIZAÇÃO</th>
                <th className="py-2.5 px-4">TIPO DE LICENÇA / ROLE</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.email} className="border-b border-[#2d5f4f]/40">
                  <td className="py-3 px-4 font-mono text-[#e8dcc8]">{p.email}</td>
                  <td className="py-3 px-4 text-gray-400">{p.organizations?.name || '—'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={p.role}
                      onChange={(e) => handleQuickRoleChange(p.email, e.target.value)}
                      className="bg-[#0f0f0f] border border-[#2d5f4f] rounded-lg px-2 py-1 text-xs text-[#daa520] font-bold"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="master">Master</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}