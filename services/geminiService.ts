
import { Message, ManuscriptReport, MasteringGoal } from "../types";

/**
 * CLIENT-SIDE FETCH BRIDGE
 * This service communicates with Vercel Serverless Functions (/api/*).
 */

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

async function secureFetch(endpoint: string, body: object) {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function generateImage(prompt: string): Promise<{imageUrl: string, metrics: UsageMetrics}> {
  try {
    const data = await secureFetch('generate-image', { prompt });
    return { 
      imageUrl: data.imageUrl, 
      metrics: { estimatedTokens: 1000, humanHoursSaved: 2, simulatedResourceLoad: 0.15 } 
    };
  } catch (error) {
    console.error("CLIENT_IMAGE_GEN_ERROR:", error);
    throw new Error("Image Generation Link Interrupted.");
  }
}

export async function queryInsight(message: string): Promise<Message & {metrics?: UsageMetrics}> {
  try {
    const data = await secureFetch('insight', { message });
    return { ...data, metrics: calculateUsage(data.content, 1.5) };
  } catch (error) {
    console.error("CLIENT_INSIGHT_ERROR:", error);
    return { role: 'assistant', content: "Archive Link Interrupted. Checking local frequency...", metrics: calculateUsage("", 0) };
  }
}

export async function performOCR(imageBase64: string): Promise<{text: string, metrics: UsageMetrics}> {
  try {
    const data = await secureFetch('ocr', { imageBase64 });
    return { text: data.text, metrics: calculateUsage(data.text, 2.5) };
  } catch (error) {
    console.error("CLIENT_OCR_ERROR:", error);
    throw new Error("OCR Link Failed: Ensure file is under 4MB.");
  }
}

export async function smartSoap(text: string, level: 'rinse' | 'scrub' | 'sanitize'): Promise<{text: string, metrics: UsageMetrics}> {
  try {
    const data = await secureFetch('soap', { text, level });
    return { text: data.text, metrics: calculateUsage(data.text, 1.2) };
  } catch (error) {
    console.error("CLIENT_SOAP_ERROR:", error);
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
  try {
    const data = await secureFetch('partner', { message, style, region, history, activeSheetContent });
    return { ...data, metrics: calculateUsage(data.content, 1.5) };
  } catch (error) {
    console.error("CLIENT_PARTNER_ERROR:", error);
    return { role: 'assistant', content: "Partner Link Interrupted. Checking Sovereign tunnel...", metrics: calculateUsage("", 0) };
  }
}

export async function interactWithAurora(message: string): Promise<string> {
  try {
    const data = await secureFetch('kindred', { message });
    return data.text;
  } catch (error) {
    console.error("CLIENT_AURORA_ERROR:", error);
    return "The frequency is unstable, but I am still here.";
  }
}

export async function analyzeFullManuscript(content: string, goal: MasteringGoal = 'substack'): Promise<ManuscriptReport & {metrics?: UsageMetrics}> {
  try {
    const data = await secureFetch('manuscript', { content, goal });
    return { ...data, metrics: calculateUsage(content, 5) };
  } catch (error) {
    console.error("CLIENT_AUDIT_ERROR:", error);
    throw new Error("Audit failed. System overloaded.");
  }
}
