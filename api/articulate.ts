import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, settings, style, region } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Sovereign Link Cold: API Key Missing" });
  }

  const { gender, tone, accent, speed } = settings;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const instruction = `
      You are the ARTICULATE agent of the Sovereign Forge. 
      MISSION: Transform the provided narrative to match a specific vocal and acoustic profile for oral storytelling.
      
      ACOUSTIC MATRIX:
      - GENDER PROFILE: ${gender} (Adjust vocabulary and cadence to suit this identity)
      - CALIBRATION TONE: ${tone} (Modify intensity and resonance)
      - REGIONAL ACCENT: ${accent} (Integrate subtle dialect markers and regional idioms from ${region})
      - TEMPORAL SPEED: ${speed} (Adjust sentence length and rhythm for this pacing)
      - NARRATIVE STYLE: ${style}

      CORE RULE: Do not sanitize the grit. Maintain the authentic carceral voice while optimizing for the selected acoustic profile.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        systemInstruction: instruction,
      }
    });

    return res.status(200).json({ text: response.text || "" });
  } catch (error: any) {
    console.error("API_ARTICULATE_FAILURE:", error);
    return res.status(500).json({ error: "Acoustic Transformation Interrupted: " + (error?.message || "Unknown Failure") });
  }
}