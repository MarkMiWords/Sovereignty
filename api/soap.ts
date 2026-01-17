
import { GoogleGenAI } from "@google/genai";

const HUMANITARIAN_MISSION = `
  MISSION: Sovereignty of the carceral voice.
  VOICE PROTOCOL: Preserve unique dialect and grit. DO NOT sanitize emotional truth.
  DIALOGUE INTEGRITY: Never rewrite spoken dialogue unless for punctuation.
  LIMIT: 1,000 words per installment.
`;

const LEGAL_GUARDRAIL = `
  STRICT LEGAL SAFETY PROTOCOL: 
  You are auditing a carceral narrative. 
  1. FLAG/REDACT real names of prison staff, police officers, or victims.
  2. Protect the author from defamation risks. 
  3. Ensure no PII (Personally Identifiable Information) is exposed.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, level } = req.body || {};
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let system = HUMANITARIAN_MISSION;
    if (level === 'rinse') system += "\nMODE: Light Grammar ONLY.";
    else if (level === 'scrub') system += "\nMODE: Literary Polish.";
    else system += `\nMODE: SANITIZE. ${LEGAL_GUARDRAIL}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text }] },
      config: { systemInstruction: system },
    });

    const resultText = response.text || text;
    res.status(200).json({ text: resultText });
  } catch (error: any) {
    console.error("API_SOAP_ERROR:", error);
    res.status(500).json({ error: "Sovereign Link Interrupted" });
  }
}
