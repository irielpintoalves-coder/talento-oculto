import { NextResponse } from 'next/server';

const REPORT_PROMPT = `
Você é um Especialista de Carreira e Redator de Currículos de Elite.
Sua tarefa é analisar todo o histórico de conversa de entrevista fornecido e extrair um Dossiê Profissional Completo e Estruturado em formato JSON rigoroso.

O JSON retornado DEVE conter exatamente a seguinte estrutura (SEM marcadores de código Markdown adicionais fora do JSON):

{
  "professional_summary": "Um resumo executivo denso e impactante (2 a 3 parágrafos) destacando competências técnicas, bagagem de mercado, versatilidade e conquistas do profissional.",
  "hard_skills": ["Lista de 8 a 15 habilidades técnicas, softwares, máquinas, ferramentas, linguagens ou processos específicos extraídos"],
  "soft_skills": ["Lista de 6 a 10 competências comportamentais e relacionais comprovadas pelas respostas"],
  "career_suggestions": ["Lista de 3 a 5 sugestões de cargos ou transições de carreira altamente compatíveis"],
  "cv_options": [
    {
      "title": "Modelo 1: Foco Técnico / Especialista",
      "content": "Texto completo do currículo formatado em Markdown com seções claras (Dados Pessoais/Cabeçalho placeholder, Resumo Profissional, Principais Competências, Experiência Profissional Detalhada com bullet points e Educação/Ferramentas)."
    },
    {
      "title": "Modelo 2: Foco Consultivo / Atendimento e Gestão",
      "content": "Texto completo do currículo adaptado para destacar resolução de problemas, liderança técnica, fornecedores, atendimento ou visão estratégica."
    },
    {
      "title": "Modelo 3: Foco Transição de Carreira / Multidisciplinar",
      "content": "Texto completo do currículo otimizado para destacar projetos transversais e competências adaptáveis."
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
        temperature: 0.3,
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
      temperature: 0.3,
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