import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('A variável de ambiente GEMINI_API_KEY não está definida.');
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });