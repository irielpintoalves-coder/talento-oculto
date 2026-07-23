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

    const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: orgsData } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });

    setProfiles(profilesData || []);
    setOrganizations(orgsData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveOrganization = async (e) => {
    e.preventDefault();
    setMsgOrg('Salvando organização...');

    const emailClean = adminEmail.trim().toLowerCase();

    // 1. Salva/Atualiza Organização
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

    // 2. Garante que o perfil do Admin existe com role 'admin' e ligado à organização
    await supabase.from('profiles').upsert({
      email: emailClean,
      role: 'admin',
      organization_id: org.id
    }, { onConflict: 'email' });

    setMsgOrg('Organização e Admin atualizados com sucesso!');
    setOrgName('');
    setAdminEmail('');
    setTotalLicenses(5);
    loadData();
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#daa520]">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8dcc8] p-6 space-y-8">
      <header className="flex justify-between items-center border-b border-[#2d5f4f] pb-4">
        <h1 className="text-xl font-bold text-[#daa520]">Painel Master — Controle de Cotas e Licenças</h1>
        <Link href="/login" className="px-4 py-2 bg-[#2d5f4f] rounded-xl text-xs font-bold text-white">Voltar</Link>
      </header>

      {/* Cadastro de Organização & Cotas */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">🏢 Cadastrar / Editar Licença de Organização</h2>
        <form onSubmit={handleSaveOrganization} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Nome da Organização/Empresa"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#e8dcc8]"
            required
          />
          <input
            type="email"
            placeholder="E-mail do Admin Responsável"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#e8dcc8]"
            required
          />
          <input
            type="number"
            placeholder="Qtd de Licenças"
            min="1"
            value={totalLicenses}
            onChange={(e) => setTotalLicenses(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#daa520] font-bold"
            required
          />
          <button type="submit" className="bg-[#d4844f] text-[#0f0f0f] font-bold py-2.5 px-4 rounded-xl text-xs">
            Salvar Cota
          </button>
        </form>
        {msgOrg && <p className="text-xs text-green-400">{msgOrg}</p>}
      </section>

      {/* Lista de Organizações e Uso */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">📊 Organizações Ativas e Cotas</h2>
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
    </div>
  );
}