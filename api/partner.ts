
import { GoogleGenAI } from "@google/genai";

const HUMANITARIAN_MISSION = `MISSION: Sovereignty of the carceral voice. W.R.A.P.P.E.R. (Writers Reliable Assistant for Polishing Passages and Editing Rough-drafts).`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, style, region, history, activeSheetContent } = req.body || {};

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const contents = history.map((h: any) => ({ 
      role: h.role === 'user' ? 'user' : 'model', 
      parts: [{ text: h.content }] 
    }));
    contents.push({ 
      role: 'user', 
      parts: [{ text: `[CONTEXT] ${activeSheetContent?.substring(0, 1500) || ""} [/CONTEXT] ${message}` }] 
    });

    const systemInstruction = `You are WRAPPER. Regional Context: ${region}. Style: ${style}. ${HUMANITARIAN_MISSION}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: { systemInstruction, tools: [{ googleSearch: {} }] },
    });

    const content = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
    })).filter((s: any) => s.web.uri);

    res.status(200).json({ role: 'assistant', content, sources });
  } catch (error) {
    console.error("API_PARTNER_ERROR:", error);
    res.status(500).json({ error: "Partner link failed" });
  }
}
