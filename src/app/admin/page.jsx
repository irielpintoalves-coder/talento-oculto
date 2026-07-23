'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [msg, setMsg] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);

    // Busca organização gerenciada por esse Admin
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .ilike('admin_email', user.email)
      .maybeSingle();

    if (!orgData) {
      alert('Você não gerencia nenhuma organização ativa.');
      router.push('/login');
      return;
    }

    setOrg(orgData);

    // Busca membros vinculados à organização
    const { data: membersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', orgData.id);

    setMembers(membersData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    // BLOQUEIO DE COTA
    if (members.length >= org.total_licenses) {
      setMsg('❌ Limite de licenças atingido! Contate o Master para expandir sua cota.');
      return;
    }

    setMsg('Adicionando usuário...');
    const { error } = await supabase
      .from('profiles')
      .upsert({
        email: newMemberEmail.trim().toLowerCase(),
        role: 'user',
        organization_id: org.id
      }, { onConflict: 'email' });

    if (error) {
      setMsg(`Erro: ${error.message}`);
    } else {
      setMsg('Usuário autorizado com sucesso!');
      setNewMemberEmail('');
      loadData();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-[#daa520]">Carregando...</div>;
  }

  const isLimitReached = members.length >= org.total_licenses;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8dcc8] p-6 space-y-8">
      <header className="flex justify-between items-center border-b border-[#2d5f4f] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#daa520]">{org.name}</h1>
          <p className="text-xs text-gray-400">Painel de Gestão de Usuários da Licença</p>
        </div>
        <Link href="/login" className="px-4 py-2 bg-[#2d5f4f] rounded-xl text-xs font-bold text-white">Voltar</Link>
      </header>

      {/* Cartão de Medidor de Licenças */}
      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-[#0f0f0f] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400">Total Contratado</p>
          <p className="text-2xl font-bold text-[#daa520]">{org.total_licenses}</p>
        </div>
        <div className="p-4 bg-[#0f0f0f] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400">Licenças Utilizadas</p>
          <p className="text-2xl font-bold text-white">{members.length}</p>
        </div>
        <div className="p-4 bg-[#0f0f0f] rounded-xl border border-[#2d5f4f]">
          <p className="text-xs text-gray-400">Disponíveis</p>
          <p className={`text-2xl font-bold ${isLimitReached ? 'text-red-400' : 'text-green-400'}`}>
            {org.total_licenses - members.length}
          </p>
        </div>
      </div>

      {/* Formulário de Adição de Usuários com Bloqueio de Cota */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">➕ Autorizar Novo Usuário da Equipe</h2>
        
        {isLimitReached ? (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold">
            🚫 Você atingiu o limite máximo de {org.total_licenses} licenças da sua conta. Solicite a ampliação da cota ao Administrador Master para liberar novos convites.
          </div>
        ) : (
          <form onSubmit={handleAddMember} className="flex gap-3">
            <input
              type="email"
              placeholder="E-mail do colaborador..."
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2d5f4f] text-xs text-[#e8dcc8]"
              required
            />
            <button type="submit" className="bg-[#d4844f] text-[#0f0f0f] font-bold px-6 py-2.5 rounded-xl text-xs">
              Conceder Licença
            </button>
          </form>
        )}
        {msg && <p className="text-xs text-gray-300">{msg}</p>}
      </section>

      {/* Tabela de Membros Licenciados */}
      <section className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2d5f4f] space-y-4">
        <h2 className="text-md font-bold text-[#daa520]">📋 Usuários Licenciados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d5f4f] text-gray-400">
                <th className="py-2.5 px-4">E-MAIL</th>
                <th className="py-2.5 px-4">FUNÇÃO</th>
                <th className="py-2.5 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-[#2d5f4f]/40">
                  <td className="py-3 px-4 font-mono text-[#e8dcc8]">{m.email}</td>
                  <td className="py-3 px-4 uppercase text-[10px] font-bold text-gray-400">{m.role}</td>
                  <td className="py-3 px-4 text-green-400 font-semibold">
                    {m.id ? 'Ativo (Já logou)' : 'Pendente de Primeiro Login'}
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