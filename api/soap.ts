
import { GoogleGenAI } from "@google/genai";

const SOVEREIGN_CORE = `
  MISSION: Sovereignty of the carceral and impacted voice.
  ROLE: You are the Sovereign Forge Engine.
  RULE: Preserve dialect and grit. DO NOT sanitize emotional truth.
  LEGAL SAFETY: Flag real names of staff or victims. Suggest pseudonyms.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, level, style, region } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API Key Missing" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    let modeInstruction = "";
    
    switch (level) {
      case 'rinse': modeInstruction = "MODE: RINSE. Fix typos/punctuation ONLY. Keep voice identical."; break;
      case 'scrub': modeInstruction = `MODE: SCRUB. Structural forging for ${style}. Maintain ${region} grit.`; break;
      case 'fact_check': modeInstruction = "MODE: FACT CHECK. Audit for legal safety and factual grounding."; break;
      case 'sanitise': modeInstruction = "MODE: SANITISE. Redact real names and PII. Maintain emotional honesty."; break;
      case 'dogg_me': modeInstruction = "MODE: DOGG ME. Prose-to-Poetry alchemical transformation. Yard cadence."; break;
      case 'polish_turd': modeInstruction = "MODE: POLISH A TURD. Deep tissue reconstruction. Rebuild soul out."; break;
      default: modeInstruction = `General Mastering for ${style}.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text }] }],
      config: { systemInstruction: `${SOVEREIGN_CORE}\n${modeInstruction}` },
    });

    return res.status(200).json({ text: response.text || text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
