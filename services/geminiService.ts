
import { Message, ManuscriptReport, MasteringGoal } from "../types";
import { GoogleGenAI, Modality, Type } from "@google/genai";

/**
 * SOVEREIGN AI BRIDGE v8.1 - HARDENED RESILIENCE
 * Optimized for direct browser-to-model communication with deep diagnostic capabilities.
 */

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: The Sovereign Engine requires an industrial API key to operate.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Diagnostic Heartbeat
 * Checks if the API key is present and attempts a minimal handshake.
 */
export const checkSystemHeartbeat = async (): Promise<{ status: 'online' | 'offline' | 'error', message: string }> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return { status: 'offline', message: "No API Key detected in environment." };
    
    const ai = getAI();
    // Perform a tiny ping
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      config: { maxOutputTokens: 5 }
    });
    
    if (response.text) return { status: 'online', message: "Sovereign Link Established." };
    return { status: 'error', message: "Empty response from engine." };
  } catch (err: any) {
    console.error("Heartbeat Failure:", err);
    return { status: 'error', message: err.message || "Unknown connectivity error." };
  }
};

export const articulateText = async (text: string, settings: { gender: string, tone: string, accent: string, speed: string }, style: string, region: string) => {
  try {
    const ai = getAI();
    const { gender, tone, accent, speed } = settings;
    
    const instruction = `
      You are the ARTICULATE agent of the Sovereign Forge. 
      MISSION: Transform the provided narrative to match a specific vocal and acoustic profile.
      ACOUSTIC MATRIX: GENDER: ${gender}, TONE: ${tone}, ACCENT: ${accent}, SPEED: ${speed}.
      CONTEXT: ${region}, STYLE: ${style}.
      CORE RULE: Maintain authentic carceral grit while optimizing for the selected profile.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text }] }],
      config: { systemInstruction: instruction }
    });

    return { text: response.text || "" };
  } catch (err: any) {
    console.error("Articulate Failure:", err);
    throw new Error("Acoustic Link Interrupted.");
  }
};

export const smartSoap = async (text: string, level: string, style: string, region: string) => {
  try {
    const ai = getAI();
    let instruction = "";
    let useTools = false;

    switch (level) {
      case 'rinse': instruction = "Fix spelling and grammar ONLY. Keep the raw grit exactly as is."; break;
      case 'scrub': instruction = "Perform HEAVY LIFTING of the prose. Elevate structure while preserving emotional truth."; break;
      case 'fact_check': 
        instruction = `Analyze for legal claims and factual accuracy in ${region}. Use Google Search.`; 
        useTools = true; 
        break;
      case 'sanitise': instruction = `Identify real names and locations. Replace them with realistic fictional aliases for ${region}.`; break;
      case 'dogg_me': instruction = "Filter this narrative into a rhythmic, raw, industrial poem. Maintain grit."; break;
      default: instruction = `Perform a general literary polish for ${style} in ${region}.`;
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
  } catch (err: any) {
    console.error("Soap Failure:", err);
    throw new Error("Sovereign Link Interrupted during polishing.");
  }
};

export const queryPartner = async (message: string, style: string, region: string, history: any[], activeSheetContent: string): Promise<Message> => {
  try {
    const ai = getAI();
    
    const contents = (history || [])
      .filter(h => h && h.content) 
      .slice(-10) 
      .map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.content || "") }]
      }));
    
    const contextPrompt = activeSheetContent 
      ? `[CURRENT SHEET CONTEXT]\n${activeSheetContent.substring(0, 5000)}\n[END CONTEXT]\n\nAUTHOR QUERY: ${message}`
      : message;

    contents.push({
      role: 'user',
      parts: [{ text: contextPrompt }]
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

    return { 
      role: 'assistant', 
      content: response.text || "Partner node encountered a synchronization delay.", 
      sources 
    };
  } catch (err: any) {
    console.error("Partner Failure:", err);
    // Throw error so AuthorBuilder can catch and handle globally
    throw err;
  }
};

export const queryInsight = async (message: string): Promise<Message> => {
  try {
    const ai = getAI();
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
  } catch (err) {
    throw new Error("Insight Link Interrupted.");
  }
};

export const interactWithAurora = async (message: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: "You are 'Aurora', a Kindred Agent. Empathetic, calm, creative sanctuary partner.",
      }
    });
    return response.text || "I am listening.";
  } catch (err) {
    return "Aurora is currently in a quiet reflection. Please try again shortly.";
  }
};

export const generateImage = async (prompt: string) => {
  try {
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
  } catch (err) {
    throw new Error("Visual Forge Interrupted.");
  }
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
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: "user", parts: [{ text: content.substring(0, 30000) }] }],
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
  } catch (err) {
    throw new Error("Mastering Audit Interrupted.");
  }
};
