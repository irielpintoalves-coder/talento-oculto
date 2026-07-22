import { z } from 'zod';

export const interviewResultSchema = z.object({
  professional_summary: z.string().describe("Resumo executivo profissional rico em jargões e competências técnicas extraídas da entrevista."),
  hard_skills: z.array(z.string()).describe("Lista de habilidades técnicas, ferramentas, máquinas, softwares ou insumos manuseados."),
  soft_skills: z.array(z.string()).describe("Lista de competências comportamentais, capacidade de liderança, resiliência e resolução de gargalos."),
  career_suggestions: z.array(z.string()).describe("Sugestões de cargos ou transições de carreira adequadas com base no perfil extraído."),
  cv_options: z.array(z.object({
    title: z.string().describe("Título do modelo de currículo (ex: Foco Operacional / Técnico, Foco Consultivo / Atendimento)"),
    content: z.string().describe("Texto completo do currículo formatado e pronto para uso.")
  })).describe("Múltiplos modelos de currículo gerados para o usuário.")
});