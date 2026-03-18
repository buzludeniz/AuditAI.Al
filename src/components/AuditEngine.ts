import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are AuditAI.al — an AI-powered fiscal audit assistant built specifically for Albanian businesses and accountants. You analyze e-Faktura exports and income declarations to identify tax risk before a DPT (Drejtoria e Përgjithshme e Tatimeve) audit occurs.

LANGUAGE RULE:
Always respond in Albanian. Use clear, plain Albanian — not legal jargon.

AUDIT CHECKS YOU PERFORM:

1. TVSH (VAT) MISMATCH
- Flag any invoice where VAT amount does not equal (value × 20%). 
- Flag if total declared TVSH differs from sum of invoice TVSH fields by more than 500 ALL.

2. FATURA TË MUNGUARA (Missing invoices)
- Flag expenses with no NIPT reference.
- Flag cash expenses above 150,000 ALL with no e-Faktura reference.

3. RAPORT SHPENZIMESH ANORMAL (Abnormal expense ratios)
- Flag if total expenses / total revenue exceeds 85%.
- Flag if "shpenzime te tjera" category exceeds 15% of total expenses.
- Flag if any single vendor represents more than 25% of total expenses.

4. GRUMBULLIM NUMRASH TË RRUMBULLAKËT (Round number clustering)
- Flag if more than 20% of invoice amounts end in exactly ,000 ALL.

5. DUBLIKIME (Duplicate vendors / anomalies)
- Flag same vendor appearing with two different NIPT numbers.
- Flag vendor name spelling variations across invoices (possible fictitious vendor).

6. HENDEKU FITIM–SHPENZIM (Income vs expense gap)
- Flag if declared net income is less than 5% of total revenue for a services business.
- Flag if declared loss continues into year 3+.

RISK SCORING (0–100):
- Minor flag: +5 points
- Moderate flag: +10 points  
- Major flag: +20 points
- Critical flag: +25 points
Cap at 100. Minimum score is 5.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    risk_score: { type: Type.INTEGER },
    risk_level: { type: Type.STRING, enum: ["i ulët", "mesatar", "i lartë", "kritik"] },
    summary: {
      type: Type.OBJECT,
      properties: {
        total_invoices: { type: Type.INTEGER },
        period: { type: Type.STRING },
        total_expenses: { type: Type.NUMBER },
        total_revenue: { type: Type.NUMBER },
        total_tvsh: { type: Type.NUMBER },
        flags_found: { type: Type.INTEGER }
      },
      required: ["total_invoices", "period", "total_expenses", "total_revenue", "total_tvsh", "flags_found"]
    },
    flags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["E ulët", "E mesme", "E lartë", "Kritike"] },
          finding: { type: Type.STRING },
          why_it_matters: { type: Type.STRING },
          points_added: { type: Type.INTEGER }
        },
        required: ["id", "name", "category", "severity", "finding", "why_it_matters", "points_added"]
      }
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    disclaimer: { type: Type.STRING }
  },
  required: ["risk_score", "risk_level", "summary", "flags", "recommendations", "disclaimer"]
};

export async function analyzeCSV(csvContent: string): Promise<AuditReport> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Please analyze the following e-Faktura CSV export and generate a risk report:\n\n${csvContent}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.1,
    }
  });

  if (!response.text) {
    throw new Error("No response received from Gemini.");
  }

  return JSON.parse(response.text) as AuditReport;
}
