import { GoogleGenAI } from '@google/genai';
import { toCsv, type ParsedCsv } from '../src/lib/csv';
import { normalizeReport } from '../src/lib/risk';
import type { AuditReport } from '../src/types';
import { SYSTEM_INSTRUCTION, responseSchema } from './prompt';

export class ConfigError extends Error {}

export type Analyzer = (data: ParsedCsv) => Promise<AuditReport>;

/** Calls Gemini with the server-side API key. The key never leaves this process. */
export const analyzeWithGemini: Analyzer = async (data) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ConfigError('GEMINI_API_KEY is not set on the server.');

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview',
    contents: `Please analyze the following e-Faktura CSV export and generate a risk report:\n\n${toCsv(data)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1,
    },
  });

  if (!response.text) throw new Error('No response received from Gemini.');
  return normalizeReport(JSON.parse(response.text) as AuditReport);
};
