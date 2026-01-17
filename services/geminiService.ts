
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, GroundingSource, ManuscriptReport, MasteringGoal } from "../types";

/**
 * SECURITY PROTOCOL:
 * This pilot environment utilizes Edge-Injected Secure Environment variables.
 * process.env.API_KEY is never exposed to the client-side source code or build bundle.
 * It is injected at the network layer during transmission.
 */
function getAI() {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

const MAX_IMAGE_SIZE_MB = 4;
const MAX_AUDIO_SIZE_MB = 10;

const LEGAL_GUARDRAIL = `
  STRICT LEGAL SAFETY PROTOCOL: 
  You are auditing a carceral narrative. 
  1. FLAG/REDACT real names of prison staff, police officers, or victims unless pseudonyms are confirmed.
  2. Protect the author from defamation risks by suggesting phrasing that focuses on 'The Institution' rather than individuals.
  3. Ensure no PII (Personally Identifiable Information) like ID numbers is included in public-facing drafts.
`;

const HUMANITARIAN_MISSION = `
  MISSION: Sovereignty of the carceral voice.
  VOICE PROTOCOL: Preserve the author's unique dialect, slang, and 'grit'. 
  DO NOT sanitize the emotional truth. 
  DO NOT rewrite dialogue unless it's a critical punctuation fix.
  LIMIT: Enforce 1,000 words per installment.
`;

const WRAPPER_IDENTITY = `
  W.R.A.P.P.E.R. (Writers Reliable Assistant for Polishing Passages and Editing Rough-drafts).
`;

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
    simulatedResourceLoad: (estimatedTokens / 1000) * 0.05 // Abstract load unit
  };
}

export async function queryInsight(message: string): Promise<Message & {metrics?: UsageMetrics}> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: message }] },
      config: {
        systemInstruction: `You are an Archive Specialist. ${HUMANITARIAN_MISSION} ${LEGAL_GUARDRAIL} Provide context on systemic issues using Google Search.`,
        tools: [{ googleSearch: {} }],
      },
    });

    const content = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks.map((chunk: any) => ({
      web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
    })).filter((s: any) => s.web.uri);

    return { role: 'assistant', content, sources, metrics: calculateUsage(content, 1.5) };
  } catch (error) {
    console.error("QUERY_INSIGHT_SYSTEM_ERROR:", error);
    return { role: 'assistant', content: "Archive Link Interrupted. Checking local frequency...", metrics: calculateUsage("", 0) };
  }
}

export async function performOCR(imageBase64: string): Promise<{text: string, metrics: UsageMetrics}> {
  // Pre-flight check for base64 size overhead (~1.37x the original file)
  const estimatedSize = (imageBase64.length * 0.75) / (1024 * 1024);
  if (estimatedSize > MAX_IMAGE_SIZE_MB) {
    throw new Error(`Visual asset exceeds ${MAX_IMAGE_SIZE_MB}MB safety limit.`);
  }

  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }, 
          { text: "Perform high-precision OCR on this carceral document. Transcribe exactly." }
        ] 
      },
      config: { systemInstruction: "Institutional OCR Mode. Absolute fidelity to source." }
    });
    const text = response.text || "";
    return { text, metrics: calculateUsage(text, 2.5) };
  } catch (err) {
    console.error("OCR_TRANSMISSION_ERROR:", err);
    throw new Error("OCR Link Failed: Ensure image is clear and under limit.");
  }
}

export async function smartSoap(text: string, level: 'rinse' | 'scrub' | 'sanitize'): Promise<{text: string, metrics: UsageMetrics}> {
  const ai = getAI();
  let system = HUMANITARIAN_MISSION;
  if (level === 'rinse') system += "\nMODE: Light Grammar ONLY.";
  else if (level === 'scrub') system += "\nMODE: Literary Polish. Preserve unique voice.";
  else system += `\nMODE: SANITIZE. ${LEGAL_GUARDRAIL}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text }] },
      config: { systemInstruction: system },
    });
    const resultText = response.text || text;
    return { text: resultText, metrics: calculateUsage(resultText, 1.2) };
  } catch (err) {
    console.error("SMART_SOAP_SYSTEM_ERROR:", err);
    return { text, metrics: calculateUsage(text, 0) };
  }
}

export async function queryPartner(
  message: string, 
  style: string, 
  region: string, 
  history: Message[],
  activeSheetContent: string = ""
): Promise<Message & {metrics?: UsageMetrics}> {
  const ai = getAI();
  try {
    const contents = history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
    contents.push({ role: 'user', parts: [{ text: `[CONTEXT] ${activeSheetContent.substring(0, 1500)} [/CONTEXT] ${message}` }] });
    
    const systemInstruction = `You are WRAPPER. Archive Context: ${region}. Style: ${style}. ${WRAPPER_IDENTITY} ${HUMANITARIAN_MISSION} ${LEGAL_GUARDRAIL}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: { systemInstruction, tools: [{ googleSearch: {} }] },
    });

    const content = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks.map((chunk: any) => ({
      web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
    })).filter((s: any) => s.web.uri);

    return { role: 'assistant', content, sources, metrics: calculateUsage(content, 1.5) };
  } catch (error) {
    console.error("PARTNER_QUERY_SYSTEM_ERROR:", error);
    return { role: 'assistant', content: "Partner Link Interrupted. Checking Sovereign tunnel...", metrics: calculateUsage("", 0) };
  }
}

export async function analyzeFullManuscript(content: string, goal: MasteringGoal = 'substack'): Promise<ManuscriptReport & {metrics?: UsageMetrics}> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [{ text: content.substring(0, 32000) }] },
      config: {
        systemInstruction: `Analyze manuscript for ${goal.toUpperCase()} mastering. ${LEGAL_GUARDRAIL} ${HUMANITARIAN_MISSION} Return JSON.`,
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
    const resultText = response.text?.trim() || "{}";
    const report = JSON.parse(resultText);
    return { ...report, metrics: calculateUsage(content, 5) };
  } catch (err) {
    console.error("MANUSCRIPT_AUDIT_SYSTEM_ERROR:", err);
    throw new Error("Audit failed. System overloaded.");
  }
}
