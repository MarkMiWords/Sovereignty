
import { Message, ManuscriptReport, MasteringGoal } from "../types";
import { GoogleGenAI, Modality, Type } from "@google/genai";

const SOVEREIGN_MISSION = (style: string, region: string, personality: string = 'Natural') => `
  MISSION: Sovereignty of the carceral and impacted voice.
  CONTEXT: Author Region: ${region.toUpperCase()}, Style: ${style.toUpperCase()}.
  TEMPERAMENT: ${personality.toUpperCase()}. 
  RULES: 
  - If Timid: Be gentle, prioritize safety, make minimal changes.
  - If Firebrand: Be aggressive, challenge the prose, push for high emotional intensity.
  - If Natural: Be a balanced partner, mirror the author's cadence.
`;

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key || key === "undefined") {
    throw new Error("CORE_LINK_FAILURE: Sovereign API Key is missing. Check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const checkSystemHeartbeat = async (): Promise<{ status: 'online' | 'offline' | 'error', message: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    });
    return response.text
      ? { status: 'online', message: "Acoustic Link Stable. Forging logic active." }
      : { status: 'error', message: "Empty response from forge." };
  } catch (err: any) {
    if (err.message?.includes("API_KEY_INVALID")) {
      return { status: 'offline', message: "INVALID_KEY: The Sovereign Link requires a valid API key." };
    }
    return { status: 'offline', message: err.message || "Link interrupted." };
  }
};

export const articulateText = async (text: string, settings: any, style: string, region: string, personality: string) => {
  const ai = getAI();
  const { gender, sound, accent, speed, isClone } = settings;
  const instruction = `
    ${SOVEREIGN_MISSION(style, region, personality)}
    MODE: ARTICULATE
    ACOUSTIC MATRIX: 
    - GENDER: ${gender}
    - SOUND_LEVEL: ${sound} 
    - REGIONAL_ACCENT: ${accent}
    - PACE: ${speed} 
    - CLONE_MODE: ${isClone ? 'ACTIVE' : 'OFF'}
    
    GOAL: Refine sentence length and oral rhythm for the selected profile while keeping carceral dialect 100% intact.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: { systemInstruction: instruction }
  });
  return { text: response.text || text };
};

export const smartSoap = async (text: string, level: string, style: string, region: string, personality: string) => {
  const ai = getAI();
  let modeSpecific = `General Mastering for ${style}.`;
  let useSearch = false;

  switch (level) {
    case 'rinse': 
      modeSpecific = `
        MODE: RINSE AND WIPE. 
        1. WIPE: Permanently REMOVE all lines starting with '[WRAP]:' or any dialogue belonging to the AI assistant. 
        2. CLEAN: Remove the '[Author]:' prefixes. Fix basic typos and punctuation. 
        3. CONNECT THE DOTS: Smooth the transitions between the remaining fragments to form a cohesive, continuous first-person story thread. 
        4. INTEGRITY: Do not change the author's slang, grit, or dialect.
      `; 
      break;
    case 'wash': 
      modeSpecific = "LEVEL L2: WASH. Smooth transitions, preserve 100% of dialect."; 
      break;
    case 'scrub': 
      modeSpecific = "LEVEL L3: SCRUB. Structural forging. Tighten prose for impact."; 
      break;
    case 'fact_check': 
      modeSpecific = "MODE: FACT CHECK. Audit for legal safety and verify systemic context."; 
      useSearch = true; 
      break;
    case 'dogg_me': 
      modeSpecific = "MODE: DOGG ME. Alchemical transformation to verse. Yard cadence."; 
      break;
    case 'polish_story': 
      modeSpecific = "MODE: POLISH STORY. Enhance narrative beats."; 
      break;
    case 'polish_poetry': 
      modeSpecific = "MODE: POLISH POETRY. Enhance meter and resonance."; 
      break;
    case 'sanitise': 
      modeSpecific = "MODE: SANITISE. Strictly redact PII (Names, ID numbers)."; 
      break;
    case 'polish_turd': 
      modeSpecific = "MODE: POLISH A TURD. Deep tissue reconstruction from the soul out."; 
      break;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: `${SOVEREIGN_MISSION(style, region, personality)}\n${modeSpecific}`,
      tools: useSearch ? [{ googleSearch: {} }] : []
    }
  });
  return { text: response.text || text };
};

export const queryPartner = async (message: string, style: string, region: string, history: any[], activeSheetContent: string, personality: string): Promise<Message> => {
  const ai = getAI();
  const contents = (history || []).slice(-10).map((h: any) => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(h.content || "") }]
  }));
  contents.push({ role: 'user', parts: [{ text: `[DRAFT CONTENT]\n${activeSheetContent.substring(0, 4000)}\n\n[USER QUERY]\n${message}` }] });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: `You are WRAPPER. ${SOVEREIGN_MISSION(style, region, personality)} Respond as a collaborative, insightful partner.`,
      tools: [{ googleSearch: {} }]
    }
  });
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);
  return { role: 'assistant', content: response.text || "Standing by at the Forge.", sources };
};

export const analyzeFullManuscript = async (content: string, goal: MasteringGoal): Promise<ManuscriptReport> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: "user", parts: [{ text: content.substring(0, 30000) }] }],
    config: {
      systemInstruction: `Perform a Sovereign Audit for ${goal.toUpperCase()} mastering. Return precise JSON.`,
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

export const generateSpeech = async (text: string, voiceName: string = 'Puck') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No acoustic data returned.");
  return base64Audio;
};

export const connectLive = (callbacks: any, systemInstruction: string) => {
  const ai = getAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: callbacks.onopen,
      onmessage: callbacks.onmessage,
      onerror: (e) => {
        console.error("Live link failed:", e);
        if (callbacks.onerror) callbacks.onerror(e);
      },
      onclose: (e) => {
        if (callbacks.onclose) callbacks.onclose(e);
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,
      inputAudioTranscription: {},
      outputAudioTranscription: {}, // Required for real-time model transcription
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
      }
    },
  });
};

// --- Added missing exports to fix compilation errors in pages/Narratives.tsx, pages/Kindred.tsx, and pages/PublishedBooks.tsx ---

/**
 * queryInsight: Used in Narratives.tsx to search the archive context with Search grounding.
 */
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

/**
 * interactWithAurora: Used in Kindred.tsx for synthetic agent chat.
 */
export const interactWithAurora = async (message: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: "You are 'Aurora', a Kindred Agent. Empathetic, calm, creative sanctuary partner.",
    }
  });
  return response.text || "I am listening.";
};

/**
 * generateImage: Used in PublishedBooks.tsx for AI-driven book cover generation.
 */
export const generateImage = async (description: string): Promise<{ imageUrl: string }> => {
  const ai = getAI();
  const industrialPrompt = `A high-quality, cinematic book cover for a prison narrative. Style: Minimalist, dramatic lighting, gritty texture, industrial aesthetic. Themes: ${description}. Aspect Ratio 16:9. Colors: Black, white, and high-contrast orange.`;

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
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }
  }

  if (!base64Image) {
    throw new Error("No image data returned from model.");
  }

  return { imageUrl: `data:image/png;base64,${base64Image}` };
};
