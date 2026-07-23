'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function MasterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [msg, setMsg] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Valida se é Master
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .ilike('email', user.email)
        .maybeSingle();

      if (profile?.role !== 'master') {
        alert('Acesso negado. Apenas usuários Master podem acessar esta página.');
        router.push('/interview');
        return;
      }

      // Busca todos os perfis cadastrados
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setProfiles(profilesData || []);

      // Busca organizações
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('*');

      setOrganizations(orgsData || []);
      setLoading(false);
    };

    loadData();
  }, [supabase, router]);

  const handleAddOrUpdateProfile = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setMsg('Salvando...');
    const { error } = await supabase
      .from('profiles')
      .upsert({ email: newEmail.trim().toLowerCase(), role: newRole }, { onConflict: 'email' });

    if (error) {
      setMsg(`Erro: ${error.message}`);
    } else {
      setMsg('Perfil atualizado com sucesso!');
      setNewEmail('');
      // Recarrega lista
      const { data: profilesData } = await supabase.from('profiles').select('*');
      setProfiles(profilesData || []);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-[#daa520]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#daa520]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-[#e8dcc8]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ background: '#1a1a1a', borderColor: '#2d5f4f' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Talento Oculto" className="w-8 h-8" />
            <span className="font-bold text-sm text-[#daa520]">Painel Master — Controle de Acessos</span>
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/interview" className="px-3 py-1.5 rounded-lg bg-[#2d5f4f] text-white font-semibold">
            Ir para Entrevista
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-900"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl w-full mx-auto p-6 space-y-8 flex-1">
        <div className="p-6 rounded-2xl shadow-xl space-y-4" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f' }}>
          <h2 className="text-lg font-bold text-[#daa520]">➕ Adicionar ou Alterar Nível de Acesso (Perfil)</h2>
          <form onSubmit={handleAddOrUpdateProfile} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="E-mail do usuário..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#2d5f4f] text-[#e8dcc8]"
              required
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#2d5f4f] text-[#daa520] font-semibold"
            >
              <option value="master">Master (Super Admin)</option>
              <option value="admin">Admin (Organização)</option>
              <option value="user">User (Membro Comum)</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#0f0f0f]"
              style={{ background: '#d4844f' }}
            >
              Salvar Perfil
            </button>
          </form>
          {msg && <p className="text-xs text-green-400 mt-2">{msg}</p>}
        </div>

        {/* Tabela de Perfis Cadastrados */}
        <div className="p-6 rounded-2xl shadow-xl space-y-4" style={{ background: '#1a1a1a', border: '1px solid #2d5f4f' }}>
          <h2 className="text-lg font-bold text-[#daa520]">📋 Usuários com Perfis Especiais Cadastrados</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d5f4f] text-gray-400">
                  <th className="py-3 px-4">E-MAIL</th>
                  <th className="py-3 px-4">FUNÇÃO (ROLE)</th>
                  <th className="py-3 px-4">ID VINCULADO</th>
                  <th className="py-3 px-4">CRIADO EM</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.email} className="border-b border-[#2d5f4f]/40 hover:bg-[#252525]">
                    <td className="py-3 px-4 font-mono text-[#e8dcc8]">{p.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                        p.role === 'master' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        p.role === 'admin' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">{p.id || 'Pendente de Primeiro Login'}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}