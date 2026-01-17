
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body || {};

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    res.status(200).json({ role: 'assistant', content, sources });
  } catch (error) {
    console.error("API_INSIGHT_ERROR:", error);
    res.status(500).json({ error: "Insight link failed" });
  }
}
