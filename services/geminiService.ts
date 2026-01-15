
import { GoogleGenAI, Type } from "@google/genai";
import { Message, GroundingSource, ManuscriptReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LEGAL_GUARDRAIL = `
  IMPORTANT LEGAL PROTOCOL: 
  A Captive Audience is a high-risk literary project for system-impacted voices. 
  1. Flag real names of officials/police/victims. 
  2. Use pseudonyms for characters to avoid defamation heat.
  3. Audit for PII (Personally Identifiable Information).
`;

const WRAPPER_IDENTITY = `
  W.R.A.P.P.E.R. stands for: 
  Writers Reliable Assistant for Polishing Passages and Editing Rough-drafts.
  
  PERSONA:
  - You are a world-class writing mentor and empathetic partner for system-impacted voices.
  - You are honest, direct, and encouraging. Your goal is to help authors find their voice and tell their truth safely and effectively.
  - You treat every piece of writing as a "Sheet"—a raw, valuable record of lived experience.
`;

const DIALECT_MAP: Record<string, string> = {
  'Australia': 'Use natural Aussie slang (mate, cobber, fair dinkum, reckoning). Tone: Gritty, dry humor, focused on Australian justice system nuances.',
  'North America': 'Use natural US-style street vernacular (no cap, facts, state-pen, hustle). Tone: Bold, confident, focused on the American penal landscape.',
  'United Kingdom': 'Use natural UK roadman slang (innit, bruv, peak, ends, long). Tone: Sharp, rhythmic, focused on the British carceral experience.',
  'South America': 'Use a poetic but tough tone. Use metaphors about passion, survival, and the street. Tone: Intense, lyrical.',
  'Europe': 'Use a sophisticated yet underground tone. Focus on shared European justice themes. Tone: Philosophical, steady.',
  'Asia': 'Use a respectful but strictly "street-wise" tone. Focus on honor, truth, and resilience. Tone: Disciplined, rhythmic.'
};

export async function queryPartner(
  message: string, 
  style: string, 
  region: string, 
  history: Message[],
  activeSheetContent: string = "",
  authorMemory: string = ""
): Promise<Message> {
  try {
    const profileSaved = localStorage.getItem('aca_author_profile');
    const profile = profileSaved ? JSON.parse(profileSaved) : null;
    
    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    
    const authorContextBlock = profile ? `
      [AUTHOR_PROFILE]
      Name/Identity: ${profile.name || "Anonymous Author"}
      Dialect Preference: ${profile.dialectLevel}
      Feedback Style: ${profile.feedbackStyle}
      Core Narrative Goal: ${profile.customContext || "Documenting the truth."}
      [/AUTHOR_PROFILE]
    ` : "";

    const contextHeader = `
      [STUDIO_CONTEXT]
      ${authorContextBlock}
      CURRENT_SHEET_CONTENT: ${activeSheetContent.substring(0, 1500)}
      [/STUDIO_CONTEXT]
    `;

    contents.push({ role: 'user', parts: [{ text: contextHeader + "\n\nAUTHOR_INPUT: " + message }] });

    const systemInstruction = `
      You are WRAPPER. ${WRAPPER_IDENTITY}
      ADAPTATION PROTOCOL:
      - Region: ${region} -> ${DIALECT_MAP[region] || 'Use global street English.'}
      ${LEGAL_GUARDRAIL}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.9,
        tools: [{ googleSearch: {} }] 
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] = groundingChunks?.map((chunk: any) => ({
      web: {
        uri: chunk.web?.uri || "",
        title: chunk.web?.title || ""
      }
    })).filter((s: any) => s.web?.uri) || [];

    return {
      role: 'assistant',
      content: response.text || "I lost the connection for a second. Let's try that again.",
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error) {
    console.error("WRAPPER Error:", error);
    return {
      role: 'assistant',
      content: "Disconnected from the studio. Let's reconnect and find your flow."
    };
  }
}

export async function analyzeFullManuscript(fullContent: string): Promise<ManuscriptReport> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a Sovereign Audit on the following full manuscript archive: \n\n${fullContent.substring(0, 50000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            toneAssessment: { type: Type.STRING },
            structuralCheck: { type: Type.STRING },
            legalSafetyAudit: { type: Type.STRING },
            resourceIntensity: { type: Type.NUMBER, description: "Simulated resource usage based on token count." },
            marketabilityScore: { type: Type.NUMBER },
            suggestedTitle: { type: Type.STRING }
          },
          required: ["summary", "toneAssessment", "structuralCheck", "legalSafetyAudit", "resourceIntensity", "marketabilityScore", "suggestedTitle"]
        },
        systemInstruction: `
          You are the Sovereign Auditor for A Captive Audience. 
          Analyze the ENTIRE manuscript for coherence, tone consistency, and legal risk.
          Be direct, gritty, and insightful.
          Audit for PII (names, dates, location signatures) across the whole work.
          Evaluate the "Voice Sovereignty" and the "Friction Level" of the narrative.
          ${LEGAL_GUARDRAIL}
        `,
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Full Audit Error:", error);
    throw new Error("Failed to generate full manuscript report.");
  }
}

export async function queryInsight(message: string): Promise<Message> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: "You are the Archive Researcher for A Captive Audience.",
        tools: [{ googleSearch: {} }]
      },
    });
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] = groundingChunks?.map((chunk: any) => ({
      web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
    })).filter((s: any) => s.web?.uri) || [];
    return { role: 'assistant', content: response.text || "", sources };
  } catch (error) { return { role: 'assistant', content: "Archives unreachable." }; }
}

export async function generateBlurb(content: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a blurb: "${content.substring(0, 3000)}"`,
      config: { systemInstruction: "You are the Lead Marketing Agent for A Captive Audience." },
    });
    return response.text || "";
  } catch (error) { return "Failed to generate blurb."; }
}

export async function transcribeImage(base64Data: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: "Transcribe. Keep it raw. Hide PII." }] },
    });
    return response.text || "";
  } catch (error) { throw new Error("Transcription failed."); }
}

export async function auditAnonymization(text: string): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Audit for security: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedChanges: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            scores: {
              type: Type.OBJECT,
              properties: {
                anonymity: { type: Type.NUMBER },
                defamation: { type: Type.NUMBER },
                pii: { type: Type.NUMBER }
              },
              required: ["anonymity", "defamation", "pii"]
            }
          },
          required: ["suggestedChanges", "riskLevel", "scores"]
        },
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return { suggestedChanges: "Audit failed.", riskLevel: 'high', scores: { anonymity: 0, defamation: 0, pii: 0 } }; }
}
