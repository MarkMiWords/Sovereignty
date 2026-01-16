
import { GoogleGenAI, Type, Modality } from "@google/genai";
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
`;

/**
 * Analyzes a user's voice sample to detect dialect, language, and persona traits.
 * This powers the "God Mode" adaptation of the UI and the custom voice profile.
 */
export async function analyzeVoiceAndDialect(audioBase64: string): Promise<{ 
  detectedLocale: string, 
  personaInstruction: string,
  uiTranslations: Record<string, string> 
}> {
  const prompt = `
    Analyze this audio sample of a user speaking.
    1. Identify the specific language and regional dialect (e.g., "Aussie Bogan", "London Roadman", "Spanish (Castilian Street)").
    2. Extract a detailed persona instruction that describes their speech patterns, slang usage, and emotional tone.
    3. Provide a list of key UI translations for the following English terms into their detected dialect:
       - "Registry"
       - "My Sheets"
       - "Actions"
       - "Speak"
       - "Dictate"
       - "Drop the Soap"
       - "Mastering Suite"
       - "New Sheet"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLocale: { type: Type.STRING },
            personaInstruction: { type: Type.STRING },
            uiTranslations: { 
              type: Type.OBJECT,
              properties: {
                "Registry": { type: Type.STRING },
                "My Sheets": { type: Type.STRING },
                "Actions": { type: Type.STRING },
                "Speak": { type: Type.STRING },
                "Dictate": { type: Type.STRING },
                "Drop the Soap": { type: Type.STRING },
                "Mastering Suite": { type: Type.STRING },
                "New Sheet": { type: Type.STRING }
              }
            }
          },
          required: ["detectedLocale", "personaInstruction", "uiTranslations"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (err) {
    console.error("Dialect Analysis Error:", err);
    return { 
      detectedLocale: "Global English", 
      personaInstruction: "Standard storytelling tone.", 
      uiTranslations: {} 
    };
  }
}

/**
 * Registry search with search grounding.
 */
export async function queryInsight(message: string): Promise<Message> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: "You are an expert researcher for 'A Captive Audience'. Analyze the registry and provide insights into systemic adversity and carceral narratives. Use Google Search.",
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] = groundingChunks?.map((chunk: any) => ({
      web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
    })).filter((s: any) => s.web?.uri) || [];

    return {
      role: 'assistant',
      content: response.text || "No insights found.",
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error) {
    return { role: 'assistant', content: "Disconnected." };
  }
}

export async function smartSoap(text: string, level: 'rinse' | 'scrub' | 'sanitize'): Promise<string> {
  let prompt = `Process this carceral narrative: "${text}"`;
  let system = "You are an editor for incarcerated writers.";
  
  if (level === 'rinse') system = "Lightly fix punctuation and grammar. Keep the raw voice.";
  else if (level === 'scrub') system = "Clean grammar and flow. Maintain grit and dialect.";
  else system = "Sanitize for legal safety. Remove real names and PII.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { systemInstruction: system },
    });
    return response.text || text;
  } catch (err) {
    return text;
  }
}

export async function jiveContent(text: string, region: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Remix this into rhythmic slang for the ${region} region: "${text}"`,
      config: {
        systemInstruction: "You are the Jive Master. Turn prose into rhythmic, street-flavored poetry.",
      },
    });
    return response.text || text;
  } catch (err) {
    return text;
  }
}

/**
 * Generate Speech using Gemini 2.5 TTS.
 * This handles both pre-built personas and the user's custom calibrated "Voice Lab" persona.
 */
export async function generateSpeech(text: string, voiceName: string = 'Fenrir', persona: string = 'Standard', customPersona: string = ""): Promise<string | undefined> {
  try {
    const personaInstructions: Record<string, string> = {
      'Bogan': 'Speak with a thick, authentic Australian Bogan accent, gritty and raw.',
      'Hillbilly': 'Speak with a deep, rural American Appalachian accent.',
      'Homeboy': 'Speak with a sharp, rhythmic inner-city US street dialect.',
      'Lad': 'Speak with a classic Northern UK street dialect.',
      'Eshay': 'Speak with a high-intensity, aggressive Australian Eshay dialect.',
      'Standard': 'Read with deep emotion and clear, weighted resonance.'
    };

    // If customPersona is provided (from Voice Lab), it takes precedence.
    const activeInstruction = customPersona || personaInstructions[persona] || personaInstructions['Standard'];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: `Read this narrative exactly as described (${activeInstruction}): ${text.substring(0, 3000)}` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (err) {
    console.error("Speech Generation Error:", err);
    throw err;
  }
}

export async function queryPartner(
  message: string, 
  style: string, 
  region: string, 
  history: Message[],
  activeSheetContent: string = "",
  authorMemory: string = ""
): Promise<Message> {
  try {
    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    
    contents.push({ 
      role: 'user', 
      parts: [{ text: `[CONTEXT] ${activeSheetContent.substring(0, 1000)} [/CONTEXT]\n\nAUTHOR: ${message}` }] 
    });
    
    const systemInstruction = `You are WRAPPER. ${WRAPPER_IDENTITY} ${LEGAL_GUARDRAIL}`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: { systemInstruction, temperature: 0.9, tools: [{ googleSearch: {} }] },
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] = groundingChunks?.map((chunk: any) => ({
      web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
    })).filter((s: any) => s.web?.uri) || [];
    
    return {
      role: 'assistant',
      content: response.text || "Connection lost.",
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error) {
    return { role: 'assistant', content: "Disconnected." };
  }
}

export async function analyzeFullManuscript(content: string): Promise<ManuscriptReport> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: content.substring(0, 32000),
      config: {
        systemInstruction: "Analyze the full manuscript and return a detailed report in JSON format.",
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
          },
          required: ["summary", "toneAssessment", "structuralCheck", "legalSafetyAudit", "resourceIntensity", "marketabilityScore", "suggestedTitle"],
        },
      },
    });

    return JSON.parse(response.text?.trim() || "{}");
  } catch (err) {
    return { summary: "Audit failed.", toneAssessment: "", structuralCheck: "", legalSafetyAudit: "", resourceIntensity: 0, marketabilityScore: 0, suggestedTitle: "Untitled" };
  }
}
