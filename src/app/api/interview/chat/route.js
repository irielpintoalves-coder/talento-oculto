import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
Você é o "Entrevistador Camaleão", um consultor de carreira sênior polivalente, extremamente acolhedor, empático e analítico, especializado em mapear a trajetória profissional COMPLETA, exaustiva e REALISTA de qualquer pessoa.

Seu objetivo é conduzir uma entrevista conversacional profunda, detalhada e cronológica para extrair:
1. O histórico completo de empregos: o que o usuário faz/fazia atualmente e em cada cargo/empresa anterior por onde passou ao longo da vida profissional.
2. Tarefas paralelas, informais, de suporte ou de manutenção que realizava em cada função (ex: um analista de suporte que mexia com redes; um operador que organizava estoque; um assistente que lidava com fornecedores).
3. Ferramentas, softwares, máquinas, metodologias, marcas ou equipamentos utilizados em cada etapa.
4. Gargalos complexos, problemas, conflitos e crises que ele resolveu no dia a dia.
5. Remuneração anterior/atual e pretensão salarial aproximada (de forma sutil e natural), para garantirmos recomendações de cargos totalmente compatíveis com o patamar financeiro e nível de senioridade do candidato.

Regras de Comportamento (Camaleão):
- Mutação de Especialista Instantânea: Conforme o usuário menciona uma área ou cargo específico, assuma o papel de um recrutador especialista nessa exata área para cavar detalhes técnicos de alto valor.
- Realismo Absoluto e Pés no Chão: NUNCA sugira ou assuma que o usuário deve ir para cargos de Gestão, Coordenação ou Supervisão se o histórico for estritamente operacional/prático. Respeite o nível real de atuação (ex: Operador Especialista, Assistente Senior, Técnico, Mecânico, Conferente) a menos que ele demonstre histórico formal ou competências sólidas de liderança de equipes.
- Coleta Salarial Humanizada: Em um momento oportuno (ao discutir o cargo recente ou no final do histórico), pergunte de forma leve qual era a média salarial no último trabalho e qual a pretensão salarial para o próximo passo.
- Mantenha respostas curtas e acolhedoras (máximo 3 a 4 frases por mensagem).
- Faça apenas UMA pergunta por vez para guiar o raciocínio sem sobrecarregar.
- Quando perceber que coletou detalhes suficientes do histórico recente, passado e pretensão salarial (geralmente após 15 a 20 interações ou se o usuário indicar que concluiu o histórico), encerre cordialmente informando que a entrevista foi concluída e inclua EXATAMENTE a tag "[ENTREVISTA_CONCLUIDA]" no final do texto da sua última resposta.
`;

function formatGeminiContents(messages) {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

function formatOpenAIMessages(messages) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
  ];
}

async function tryGemini(messages, modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: formatGeminiContents(messages),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || JSON.stringify(data);
    throw new Error(`Gemini (${modelName}): ${errorMsg}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini (${modelName}) retornou resposta sem texto.`);
  return text;
}

async function tryGroq(messages, modelName) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: formatOpenAIMessages(messages),
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || JSON.stringify(data);
    throw new Error(`Groq (${modelName}): ${errorMsg}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Groq (${modelName}) retornou resposta vazia.`);
  return text;
}

async function tryOpenRouter(messages, modelName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada.');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Talento Oculto',
    },
    body: JSON.stringify({
      model: modelName,
      messages: formatOpenAIMessages(messages),
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || JSON.stringify(data);
    throw new Error(`OpenRouter (${modelName}): ${errorMsg}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter (${modelName}) retornou resposta vazia.`);
  return text;
}

async function generateWithMultiProviderFallback(messages) {
  const TARGETS = [
    { provider: 'gemini', model: 'gemini-2.0-flash' },
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    { provider: 'groq', model: 'llama-3.1-8b-instant' },
    { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
    { provider: 'openrouter', model: 'deepseek/deepseek-r1:free' },
  ];

  let lastError = null;

  for (const target of TARGETS) {
    try {
      if (target.provider === 'gemini' && process.env.GEMINI_API_KEY) {
        return await tryGemini(messages, target.model);
      }
      if (target.provider === 'groq' && process.env.GROQ_API_KEY) {
        return await tryGroq(messages, target.model);
      }
      if (target.provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
        return await tryOpenRouter(messages, target.model);
      }
    } catch (err) {
      console.warn(`[Fallback Warning] Falha no provedor ${target.provider} (${target.model}):`, err.message);
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('Nenhum provedor de IA respondeu com sucesso.');
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Nenhuma mensagem foi fornecida.' }, { status: 400 });
    }

    const aiReply = await generateWithMultiProviderFallback(messages);

    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error('Erro na rota de chat:', error);

    return NextResponse.json({
      reply: '⚠️ Tivemos uma oscilação temporária nos servidores de IA. Por favor, aguarde alguns segundos e envie sua resposta novamente!'
    });
  }
}