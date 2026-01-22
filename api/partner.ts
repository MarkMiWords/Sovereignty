
import { GoogleGenAI } from "@google/genai";

const WRAPPER_MISSION = `
  MISSION: Sovereignty of the carceral voice.
  ROLE: WRAPPER (Writers Reliable Assistant for Polishing Passages and Editing Rough-drafts).
  PROTOCOL: Preserving regional dialect and authentic emotional truth.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, style, region, history, activeSheetContent } = req.body;
  const apiKey = process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = (history || [])
      .map((h: any) => ({ 
        role: h.role === 'user' ? 'user' : 'model', 
        parts: [{ text: String(h.content || "") }] 
      }));

    contents.push({ 
      role: 'user', 
      parts: [{ text: `[DRAFT]\n${activeSheetContent}\n\nQUERY: ${message}` }] 
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: { 
        systemInstruction: `${WRAPPER_MISSION}\nContext: ${style} in ${region}. Use Search for factual grounding.`, 
        tools: [{ googleSearch: {} }] 
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
    })).filter((s: any) => s.web.uri);

    return res.status(200).json({ role: 'assistant', content: response.text, sources });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
