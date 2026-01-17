
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body || {};

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: message }] },
      config: {
        systemInstruction: "You are 'Aurora', a Kindred Agent. Empathetic, calm, creative sanctuary partner.",
      }
    });
    res.status(200).json({ text: response.text || "I am listening." });
  } catch (error) {
    console.error("API_KINDRED_ERROR:", error);
    res.status(500).json({ error: "Kindred link failed" });
  }
}
