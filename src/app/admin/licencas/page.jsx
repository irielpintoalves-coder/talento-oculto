'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ajuste o caminho de importação se necessário

export default function GestaoLicencas() {
  const [org, setOrg] = useState(null);
  const [membros, setMembros] = useState([]);
  const [novoEmail, setNovoEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');

  // 1. Carregar dados da Organização e Licenças ativas
  useEffect(() => {
    carregarLicencas();
  }, []);

  async function carregarLicencas() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMensagem('Usuário não autenticado.');
      setLoading(false);
      return;
    }

    // Busca a organização onde o usuário logado é dono
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        total_licenses,
        license_members ( id, email, role, status, created_at )
      `)
      .eq('owner_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar organização:', error);
      setMensagem('Nenhuma empresa/organização encontrada para esta conta.');
    } else if (data) {
      setOrg(data);
      setMembros(data.license_members || []);
    }
    setLoading(false);
  }

  // 2. Convidar/Atribuir Licença a um E-mail
  async function handleAdicionarMembro(e) {
    e.preventDefault();
    if (!novoEmail.trim()) return;

    if (membros.length >= org.total_licenses) {
      alert('Limite de licenças atingido! Remova um usuário ou adquira mais licenças.');
      return;
    }

    const { error } = await supabase
      .from('license_members')
      .insert([
        {
          organization_id: org.id,
          email: novoEmail.toLowerCase().trim(),
          status: 'pending',
          role: 'member'
        }
      ]);

    if (error) {
      alert('Erro ao adicionar e-mail: ' + error.message);
    } else {
      alert('Licença vinculada com sucesso!');
      setNovoEmail('');
      carregarLicencas(); // Recarrega a lista
    }
  }

  // 3. Revogar/Remover Licença
  async function handleRemoverMembro(memberId) {
    if (!confirm('Deseja realmente revogar a licença deste usuário?')) return;

    const { error } = await supabase
      .from('license_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      alert('Erro ao remover licença: ' + error.message);
    } else {
      carregarLicencas();
    }
  }

  if (loading) return <p style={{ padding: '20px' }}>Carregando painel de licenças...</p>;
  if (!org) return <p style={{ padding: '20px' }}>{mensagem}</p>;

  const licencasUsadas = membros.length;
  const licencasDisponiveis = org.total_licenses - licencasUsadas;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Gestão de Licenças</h1>

      {/* Cartões de Métricas */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <div style={cardStyle}>
          <h3>Total de Licenças</h3>
          <p style={numberStyle}>{org.total_licenses}</p>
        </div>
        <div style={cardStyle}>
          <h3>Em Uso</h3>
          <p style={numberStyle}>{licencasUsadas}</p>
        </div>
        <div style={cardStyle}>
          <h3>Disponíveis</h3>
          <p style={{ ...numberStyle, color: licencasDisponiveis > 0 ? '#10B981' : '#EF4444' }}>
            {licencasDisponiveis}
          </p>
        </div>
      </div>

      {/* Formulário de Adicionar Usuário */}
      <form onSubmit={handleAdicionarMembro} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <input
          type="email"
          placeholder="Digite o e-mail do usuário..."
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
          required
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={licencasDisponiveis <= 0}
          style={{
            padding: '10px 20px',
            backgroundColor: licencasDisponiveis > 0 ? '#2563EB' : '#9CA3AF',
            color: '#FFF',
            border: 'none',
            borderRadius: '6px',
            cursor: licencasDisponiveis > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Atribuir Licença
        </button>
      </form>

      {/* Tabela de Membros */}
      <h2>Usuários Autorizados</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
            <th style={cellStyle}>E-mail</th>
            <th style={cellStyle}>Status</th>
            <th style={cellStyle}>Papel</th>
            <th style={cellStyle}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {membros.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={cellStyle}>{m.email}</td>
              <td style={cellStyle}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: m.status === 'active' ? '#D1FAE5' : '#FEF3C7',
                  color: m.status === 'active' ? '#065F46' : '#92400E'
                }}>
                  {m.status === 'active' ? 'Ativo' : 'Pendente'}
                </span>
              </td>
              <td style={cellStyle}>{m.role}</td>
              <td style={cellStyle}>
                <button
                  onClick={() => handleRemoverMembro(m.id)}
                  style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Revogar
                </button>
              </td>
            </tr>
          ))}
          {membros.length === 0 && (
            <tr>
              <td colSpan="4" style={{ ...cellStyle, textAlign: 'center', color: '#6B7280' }}>
                Nenhuma licença atribuída ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const cardStyle = {
  flex: 1,
  padding: '15px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#F9FAFB'
};

const numberStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '8px 0 0 0'
};

const cellStyle = {
  padding: '12px'
};