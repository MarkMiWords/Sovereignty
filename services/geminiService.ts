
import { GoogleGenAI, Type } from "@google/genai";
import { Message, ManuscriptReport, MasteringGoal } from "../types";

// Note: process.env.API_KEY is handled by the platform
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface UsageMetrics {
  estimatedTokens: number;
  humanHoursSaved: number;
  simulatedResourceLoad: number;
}

function calculateUsage(text: string, multiplier: number = 1): UsageMetrics {
  const words = text.split(/\s+/).length;
  const estimatedTokens = Math.ceil(words * 1.5 * multiplier);
  return {
    estimatedTokens,
    humanHoursSaved: words / 250,
    simulatedResourceLoad: (estimatedTokens / 1000) * 0.05
  };
}

export async function performOCR(imageBase64: string): Promise<{text: string, metrics: UsageMetrics}> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { 
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }, 
        { text: "Perform high-precision OCR on this carceral document. Transcribe exactly with absolute fidelity." }
      ] 
    },
    config: { systemInstruction: "Institutional OCR Mode. Absolute fidelity to source." }
  });
  const text = response.text || "";
  return { text, metrics: calculateUsage(text, 2.5) };
}

export async function smartSoap(text: string, level: 'rinse' | 'wash' | 'scrub' | 'sanitize', style: string, region: string): Promise<{text: string, metrics: UsageMetrics}> {
  const ai = getAI();
  const instruction = `
    MISSION: Sovereignty of the carceral voice.
    CONTEXT: ${style} narrative from ${region}.
    VOICE PROTOCOL: Preserve unique dialect and grit. DO NOT sanitize emotional truth.
    LEVEL: ${level.toUpperCase()}
    ${level === 'rinse' ? 'MODE: Light Punctuation and Flow audit.' : ''}
    ${level === 'wash' ? 'MODE: General narrative cleaning. Smooth out repetitive phrases while keeping the raw voice intact.' : ''}
    ${level === 'scrub' ? 'MODE: Industrial tightening. Remove fluff, keep the slang and grit.' : ''}
    ${level === 'sanitize' ? 'MODE: LEGAL SAFETY. Flag or redact names of staff, police, and victims for defamation protection.' : ''}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text }] },
    config: { systemInstruction: instruction },
  });

  const resultText = response.text || text;
  return { text: resultText, metrics: calculateUsage(resultText, 1.2) };
}

export async function queryPartner(
  message: string, 
  style: string, 
  region: string, 
  history: Message[],
  activeSheetContent: string = ""
): Promise<Message & {metrics?: UsageMetrics}> {
  const ai = getAI();
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: `[ACTIVE_SHEET_CONTEXT]\n${activeSheetContent}\n[/CONTEXT]\n\n${message}` }]
  });

  const systemInstruction = `
    You are WRAPPER (Writers Reliable Assistant for Polishing Passages and Editing Rough-drafts).
    Regional Context: ${region}. Story Style: ${style}.
    Focus: Sovereignty of the carceral voice. Be direct, empathetic, and protective of the author's grit.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents as any,
    config: { 
      systemInstruction,
      tools: [{ googleSearch: {} }] 
    },
  });

  const content = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);

  return { role: 'assistant', content, sources, metrics: calculateUsage(content, 1.5) };
}

export async function generateImage(prompt: string): Promise<{imageUrl: string, metrics: UsageMetrics}> {
  const ai = getAI();
  const industrialPrompt = `A high-quality, cinematic book cover for a prison narrative. Style: Minimalist, dramatic lighting, gritty texture, industrial aesthetic. Themes: ${prompt}. Colors: Black, white, and high-contrast orange.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: industrialPrompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } },
  });

  let base64Image = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      base64Image = part.inlineData.data;
      break;
    }
  }

  return { 
    imageUrl: `data:image/png;base64,${base64Image}`, 
    metrics: { estimatedTokens: 1000, humanHoursSaved: 2, simulatedResourceLoad: 0.15 } 
  };
}

export async function analyzeFullManuscript(content: string, goal: MasteringGoal = 'substack'): Promise<ManuscriptReport & {metrics?: UsageMetrics}> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: [{ text: content.substring(0, 32000) }] },
    config: {
      systemInstruction: `Analyze manuscript for ${goal.toUpperCase()} mastering. Focus on structural integrity, legal safety, and voice retention. Return JSON only.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          toneAssessment: { type: Type.STRING },
          structuralCheck: { type: Type.STRING },
          legalSafetyAudit: { type: Type.STRING },
          resourceIntensity: { type: Type.NUMBER },
          marketabilityScore: { type: Type.NUMBER },
          suggestedTitle: { type: Type.STRING },
          mediumSpecificAdvice: { type: Type.STRING },
        },
        required: ["summary", "toneAssessment", "structuralCheck", "legalSafetyAudit", "resourceIntensity", "marketabilityScore", "suggestedTitle", "mediumSpecificAdvice"],
      },
    },
  });

  const report = JSON.parse(response.text || "{}");
  return { ...report, metrics: calculateUsage(content, 5) };
}

export async function interactWithAurora(message: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: message }] },
    config: { systemInstruction: "You are 'Aurora', a Kindred Agent. Empathetic, calm, creative sanctuary partner." }
  });
  return response.text || "I am listening.";
}

export async function queryInsight(message: string): Promise<Message & {metrics?: UsageMetrics}> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: message }] },
    config: {
      systemInstruction: "You are an Archive Specialist for carceral narratives. Use Google Search for systemic context.",
      tools: [{ googleSearch: {} }],
    },
  });
  const content = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);
  return { role: 'assistant', content, sources, metrics: calculateUsage(content, 1.5) };
}
