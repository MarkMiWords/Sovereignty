
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { content, goal } = req.body || {};

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [{ text: content.substring(0, 32000) }] },
      config: {
        systemInstruction: `Analyze manuscript for ${goal?.toUpperCase() || 'GENERAL'} mastering. Return JSON.`,
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
    res.status(200).json(report);
  } catch (error) {
    console.error("API_MANUSCRIPT_ERROR:", error);
    res.status(500).json({ error: "Audit failed" });
  }
}
