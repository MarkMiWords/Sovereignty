
import { Message, ManuscriptReport, MasteringGoal } from "../types";
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * SOVEREIGN AI BRIDGE v6.6
 * Native AI Studio Integration
 */

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const smartSoap = async (text: string, level: string, style: string, region: string) => {
  const ai = getAI();
  
  let instruction = "";
  let useTools = false;

  switch (level) {
    case 'rinse':
      instruction = `You are the RINSE agent. Fix spelling and grammar ONLY. DO NOT change the author's voice, do not add embellishments, and do not improve the prose. Keep the raw grit exactly as is, just corrected. Context: ${region}. Style: ${style}.`;
      break;
    case 'wash':
      instruction = `You are the WASH agent. Fix spelling and grammar and provide LIGHT literary embellishment. Lift the quality of the prose slightly while maintaining the author's authentic carceral voice. Context: ${region}. Style: ${style}.`;
      break;
    case 'scrub':
      instruction = `You are the SCRUB agent. Fix spelling/grammar and perform HEAVY LIFTING of the prose. Elevate the narrative structure and vocabulary for maximum impact while preserving the emotional truth. Context: ${region}. Style: ${style}.`;
      break;
    case 'fact_check':
      instruction = `You are the FACT CHECKER. Analyze the provided text for legal claims, mentions of specific laws, court cases, or factual statements. Use Google Search to verify if these claims are accurate. Provide a list of confirmations or necessary corrections at the end of the text. Context: ${region}.`;
      useTools = true;
      break;
    case 'sanitise':
      instruction = `You are the SANITISE agent. Your ONLY job is privacy. Identify all real names of people and specific locations. Act as a Name Generator and replace them with realistic fictional aliases that fit the ${region} context. DO NOT change grammar or prose. Focus exclusively on protecting identities. Output the modified text.`;
      break;
    case 'polish_turd':
      instruction = `You are the High-Intensity Polisher. Take this poorly written or raw carceral text and transform it into a masterpiece of grit and prose without losing the author's soul. Preserve dialetic authenticity while maximizing structural impact.`;
      break;
    case 'expand':
      instruction = `You are the Expansion Forge. Drastically expand this narrative by exploring the sensory details of the environment, the internal monologue of the author, and the weight of the context. Style: ${style}. Region: ${region}. Make it visceral.`;
      break;
    case 'dogg_me':
      instruction = `You are the Doggerel Forge. Filter this narrative into a rhythmic, raw, industrial poem or rhyming prose. Maintain the carceral grit and regional slang.`;
      break;
    default:
      instruction = `Perform a general literary polish. Style: ${style}. Region: ${region}.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: instruction,
      tools: useTools ? [{ googleSearch: {} }] : []
    }
  });

  return { text: response.text || "" };
};

export const queryPartner = async (message: string, style: string, region: string, history: any[], activeSheetContent: string): Promise<Message> => {
  const ai = getAI();
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
      systemInstruction: `You are WRAPPER, the Sovereign Partner. Tone: ${style}. Region: ${region}. Goal: Narrative Integrity. Provide intense, helpful, and industrial advice.`,
      tools: [{ googleSearch: {} }]
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);

  return { role: 'assistant', content: response.text || "", sources };
};

export const queryInsight = async (message: string): Promise<Message> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: "You are an Archive Specialist for carceral narratives. Use Google Search for systemic context.",
      tools: [{ googleSearch: {} }],
    },
  });

  const content = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);

  return { role: 'assistant', content, sources };
};

export const interactWithAurora = async (message: string): Promise<string> => {
  const ai = getAI();
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
  const ai = getAI();
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
  const ai = getAI();
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
  const ai = getAI();
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
