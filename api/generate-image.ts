
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Style enforcement for A Captive Audience aesthetic
    const industrialPrompt = `A high-quality, cinematic book cover for a prison narrative. Style: Minimalist, dramatic lighting, gritty texture, industrial aesthetic. Themes: ${prompt}. Aspect Ratio 16:9. Colors: Black, white, and high-contrast orange.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: industrialPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    let base64Image = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) throw new Error("No image data returned from model.");

    res.status(200).json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (error: any) {
    console.error("API_IMAGE_GEN_ERROR:", error?.message || error);
    res.status(500).json({ error: "Image generation failed." });
  }
}
