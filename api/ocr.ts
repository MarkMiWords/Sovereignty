
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64 } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: "Image data required" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    res.status(200).json({ text: response.text || "" });
  } catch (error) {
    console.error("API_OCR_ERROR:", error);
    res.status(500).json({ error: "OCR processing failed" });
  }
}
