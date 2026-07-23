import { NextResponse } from 'next/server';

const REPORT_PROMPT = `
Você é um Especialista de Carreira e Redator de Currículos de Elite.
Sua tarefa é analisar todo o histórico da entrevista e extrair um Dossiê Profissional Completo, Estruturado e EXTREMAMENTE REALISTA em formato JSON rigoroso.

DIRETRIZES DE ANÁLISE (REALISMO ABSOLUTO E ANCORAGEM SALARIAL):
1. **Respeito à Senioridade Real:** Analise rigorosamente se o histórico do candidato é Operacional, Técnico, Administrativo ou de Gestão. NUNCA sugira ou infle o candidato para cargos de Gestão, Coordenação ou Supervisão se o histórico for estritamente operacional ou prático.
2. **Alinhamento Salarial e Prático:** Utilize a faixa salarial informada (remuneração anterior/pretensão) e a bagagem técnica real para sugerir cargos no mesmo patamar financeiro/hierárquico ou no máximo um degrau lógico acima na execução (ex: de Operador de Empilhadeira para Conferente de Expedição, Operador Logístico Especialista, Auxiliar de Almoxarifado Senior ou Vistoriador).
3. **Linguagem Adequada:** Utilize termos técnicos reais das ferramentas/máquinas/processos que o candidato realmente usou. Não utilize "jargões corporativos ocos" para disfarçar a falta de experiência em gestão.

O JSON retornado DEVE conter exatamente a seguinte estrutura (SEM marcadores de código Markdown adicionais fora do JSON):

{
  "professional_summary": "Um resumo executivo denso e impactante (2 a 3 parágrafos) destacando a bagagem prática/técnica, histórico de trabalho, ferramentas/equipamentos manipulados, capacidade de resolução de problemas e faixa de atuação do profissional.",
  "hard_skills": ["Lista de 8 a 15 habilidades técnicas, softwares, máquinas, ferramentas, equipamentos, CNH/certificações ou processos específicos extraídos"],
  "soft_skills": ["Lista de 6 a 10 competências comportamentais e relacionais comprovadas pelas respostas"],
  "career_suggestions": ["Lista de 3 a 5 sugestões de cargos ou transições de carreira REALISTAS, compatíveis com a senioridade e patamar salarial do candidato"],
  "cv_options": [
    {
      "title": "Modelo 1: Foco Técnico e Operacional / Prático",
      "content": "Texto completo do currículo formatado em Markdown com seções claras (Cabeçalho placeholder, Resumo Profissional, Principais Competências Práticas, Experiência Profissional Detalhada com atividades/conquistas reais e Formação/Cursos/Ferramentas)."
    },
    {
      "title": "Modelo 2: Foco em Resolução de Problemas e Processos",
      "content": "Texto completo do currículo adaptado para destacar versatilidade na rotina, manuseio de equipamentos/sistemas, organização, relacionamento com equipes/fornecedores e capacidade de destravar gargalos diários."
    },
    {
      "title": "Modelo 3: Foco em Transição / Crescimento Horizontal",
      "content": "Texto completo do currículo otimizado para destacar competências transferíveis, capacidade de rápida adaptação a novos ambientes e aplicação em áreas correlatas."
    }
  ]
}

Responda APENAS com o objeto JSON válido.
`;

function buildHistoryText(messages) {
  return messages
    .map((m) => `${m.role === 'user' ? 'Candidato' : 'Entrevistador'}: ${m.content}`)
    .join('\n\n');
}

async function generateReportGemini(historyText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY ausente.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: REPORT_PROMPT },
            { text: `HISTÓRICO COMPLETO DA ENTREVISTA:\n\n${historyText}` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Reduzido ligeiramente para respostas mais precisas e menos inventivas
        maxOutputTokens: 3500,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro Gemini na geração');

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

async function generateReportGroq(historyText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY ausente.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: REPORT_PROMPT },
        { role: 'user', content: `HISTÓRICO COMPLETO DA ENTREVISTA:\n\n${historyText}` },
      ],
      temperature: 0.2,
      max_tokens: 3500,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro Groq na geração');

  const text = data.choices?.[0]?.message?.content;
  return JSON.parse(text);
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Histórico de entrevista não fornecido.' }, { status: 400 });
    }

    const historyText = buildHistoryText(messages);

    let reportData = null;

    // Tentativa 1: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        reportData = await generateReportGemini(historyText);
      } catch (err) {
        console.warn('[Generate Report] Gemini falhou, tentando Groq:', err.message);
      }
    }

    // Tentativa 2: Groq (Fallback)
    if (!reportData && process.env.GROQ_API_KEY) {
      try {
        reportData = await generateReportGroq(historyText);
      } catch (err) {
        console.warn('[Generate Report] Groq falhou:', err.message);
      }
    }

    if (!reportData) {
      throw new Error('Não foi possível sintetizar o relatório com os provedores disponíveis.');
    }

    return NextResponse.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Erro na rota de geração de relatório:', error);
    return NextResponse.json(
      { error: 'Falha ao sintetizar o relatório profissional. Tente novamente em instantes.' },
      { status: 500 }
    );
  }
}