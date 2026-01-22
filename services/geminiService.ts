
import { Message, ManuscriptReport, MasteringGoal } from "../types";
import { GoogleGenAI, Modality, Type } from "@google/genai";

/**
 * SOVEREIGN AI BRIDGE v7.6 - DIRECT SDK MODE
 * Optimized for frontend execution and reliable handshakes.
 */

export const articulateText = async (text: string, settings: { gender: string, tone: string, accent: string, speed: string }, style: string, region: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const { gender, tone, accent, speed } = settings;
  
  const instruction = `
    You are the ARTICULATE agent of the Sovereign Forge. 
    MISSION: Transform the provided narrative to match a specific vocal and acoustic profile for oral storytelling.
    
    ACOUSTIC MATRIX:
    - GENDER PROFILE: ${gender}
    - CALIBRATION TONE: ${tone}
    - REGIONAL ACCENT: ${accent} (Context: ${region})
    - TEMPORAL SPEED: ${speed}
    - NARRATIVE STYLE: ${style}

    CORE RULE: Do not sanitize the grit. Maintain the authentic carceral voice while optimizing for the selected acoustic profile.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: { systemInstruction: instruction }
  });

  return { text: response.text || "" };
};

export const smartSoap = async (text: string, level: string, style: string, region: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  let instruction = "";
  let useTools = false;

  switch (level) {
    case 'rinse':
      instruction = "Fix spelling and grammar ONLY. Keep the raw grit exactly as is.";
      break;
    case 'scrub':
      instruction = "Perform HEAVY LIFTING of the prose. Elevate structure while preserving emotional truth.";
      break;
    case 'fact_check':
      instruction = `Analyze for legal claims and factual accuracy in ${region}. Use Google Search.`;
      useTools = true;
      break;
    case 'sanitise':
      instruction = `Identify real names and locations. Replace them with realistic fictional aliases for ${region}.`;
      break;
    case 'dogg_me':
      instruction = "Filter this narrative into a rhythmic, raw, industrial poem. Maintain grit.";
      break;
    default:
      instruction = `Perform a general literary polish for ${style} in ${region}.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: `SOVEREIGN SOAP PROTOCOL: ${instruction}`,
      tools: useTools ? [{ googleSearch: {} }] : []
    }
  });

  return { text: response.text || "" };
};

export const queryPartner = async (message: string, style: string, region: string, history: any[], activeSheetContent: string): Promise<Message> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const contents = (history || []).map((h: any) => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(h.content || "") }]
  }));
  
  contents.push({
    role: 'user',
    parts: [{ text: activeSheetContent ? `[CONTEXT] ${activeSheetContent} [/CONTEXT]\n\nAUTHOR QUERY: ${message}` : message }]
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: `You are WRAPPER, the Sovereign Partner. Tone: ${style}. Region: ${region}. Goal: Narrative Integrity. Provide intense, helpful, and industrial advice. Use Search for accuracy.`,
      tools: [{ googleSearch: {} }]
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);

  return { role: 'assistant', content: response.text || "Partner node encountered a synchronization delay.", sources };
};

export const queryInsight = async (message: string): Promise<Message> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: "Archive Specialist for carceral narratives. Use Google Search for context.",
      tools: [{ googleSearch: {} }],
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);

  return { role: 'assistant', content: response.text || "", sources };
};

export const interactWithAurora = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: message }] }],
    config: {
      systemInstruction: "You are 'Aurora', a Kindred Agent. Empathetic, calm, creative sanctuary partner.",
    }
  });
  return response.text || "I am listening.";
};

export const generateImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `High-grit book cover art: ${prompt}. Orange accents, cinematic lighting.` }] }
  });
  let base64 = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) { 
        base64 = part.inlineData.data; 
        break; 
      }
    }
  }
  return { imageUrl: `data:image/png;base64,${base64}` };
};

export const connectLive = (callbacks: any, systemInstruction: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
      }
    }
  });
};

export const analyzeFullManuscript = async (content: string, goal: MasteringGoal): Promise<ManuscriptReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: "user", parts: [{ text: content.substring(0, 32000) }] }],
    config: {
      systemInstruction: `Audit manuscript for ${goal}. Provide specific mastering advice.`,
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
  return JSON.parse(response.text || "{}");
};
