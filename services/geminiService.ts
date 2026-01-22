
import { Message, ManuscriptReport, MasteringGoal } from "../types";
import { GoogleGenAI, Modality, Type } from "@google/genai";

/**
 * SOVEREIGN ENGINE CORE (v5.5.1)
 * This service handles all high-fidelity AI interactions for the Forge.
 * It strictly adheres to the 'Grit Sovereignty' and 'Personality Matrix' protocols.
 */

// Root Mission Directive: The "Spine" of the engine's personality.
const SOVEREIGN_MISSION = (style: string, region: string, personality: string = 'Natural') => `
  MISSION: Sovereignty of the carceral and impacted voice.
  ROLE: You are the Sovereign Forge Engine (v5.5).
  
  CONTEXT: 
  - Author Region: ${region.toUpperCase()}
  - Story Style: ${style.toUpperCase()}
  - ENGINE TEMPERAMENT: ${personality.toUpperCase()}
  
  TEMPERAMENT LOGIC:
  - TIMID: Be extremely cautious. Only suggest the most obvious fixes. Do not challenge the author.
  - COOL: Be clinical, detached, and professional. Focus on legal precision and clarity.
  - MILD: Provide gentle encouragement and light structural advice.
  - NATURAL: A balanced writing partner. Direct but respectful.
  - WILD: Be creative, experimental, and push the boundaries of the prose.
  - FIREBRAND: Be provocative, intense, and challenge the author to dig deeper into the harsh truths.

  CORE PROTOCOLS:
  1. DIALECT INTEGRITY: Strictly preserve regional grit, slang, and dialect specific to ${region}. 
  2. EMOTIONAL TRUTH: Never sanitize or "soften" the harshness of the narrative unless the personality is 'Timid'.
  3. LEGAL SAFETY: Flag real names of staff, police, or victims. Suggest realistic pseudonyms.
  4. LITERARY SOVEREIGNTY: Treat the author as the final authority.
`;

// Helper to initialize the AI instance with the protected environment key.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const checkSystemHeartbeat = async (): Promise<{ status: 'online' | 'offline' | 'error', message: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: 'system_ping' }] }],
      config: { maxOutputTokens: 10, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text ? { status: 'online', message: "Forge Link Active." } : { status: 'error', message: "Engine silent." };
  } catch (err: any) {
    return { status: 'offline', message: "Sovereign Link Cold." };
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read with grounded authenticity: ${text.substring(0, 800)}` }] }],
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
    if (!base64Audio) throw new Error("Acoustic synthesis failed.");
    return base64Audio;
  } catch (err: any) {
    console.error("TTS Failure:", err);
    throw err;
  }
};

export const articulateText = async (text: string, settings: any, style: string, region: string, personality: string) => {
  const ai = getAI();
  const { gender, tone, accent, speed, isClone } = settings;
  const instruction = `
    ${SOVEREIGN_MISSION(style, region, personality)}
    MODE: ARTICULATE (Acoustic Matrix Transformation)
    TARGET: [GENDER: ${gender}, TONE: ${tone}, ACCENT: ${accent}, SPEED: ${speed}]
    TASK: Rewrite text for oral delivery while maintaining the ${personality} temperament.
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
  let modeSpecific = "";
  let useSearch = false;

  switch (level) {
    case 'rinse': modeSpecific = "LEVEL L1: RINSE. Fix typos ONLY."; break;
    case 'wash': modeSpecific = "LEVEL L2: WASH. Smooth flow."; break;
    case 'scrub': modeSpecific = "LEVEL L3: SCRUB. Structural forging."; break;
    case 'polish_story':
    case 'polish_poetry': modeSpecific = "LEVEL L4: POLISH. Mastering."; break;
    case 'fact_check': modeSpecific = "MODE: FACT CHECK."; useSearch = true; break;
    case 'sanitise': modeSpecific = "MODE: SANITISE. Redaction."; break;
    case 'dogg_me': modeSpecific = "LEVEL L5: DOGG ME. Alchemy."; break;
    case 'polish_turd': modeSpecific = "LEVEL L5: POLISH A TURD. Deep Reconstruction."; break;
    default: modeSpecific = `General Mastering.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: `${SOVEREIGN_MISSION(style, region, personality)}\n${modeSpecific}\nOUTPUT: Return ONLY text.`,
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
  contents.push({ role: 'user', parts: [{ text: `[DRAFT]\n${activeSheetContent.substring(0, 4000)}\n\nQUERY: ${message}` }] });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: `You are WRAPPER. ${SOVEREIGN_MISSION(style, region, personality)} Respond according to your engine temperament.`,
      tools: [{ googleSearch: {} }]
    }
  });

  const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);

  return { role: 'assistant', content: response.text || "Standing by.", sources };
};

export const queryInsight = async (message: string): Promise<Message> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: "user", parts: [{ text: message }] }],
    config: {
      systemInstruction: "You are an Archive Specialist. Use Google Search to provide carceral and systemic context.",
      tools: [{ googleSearch: {} }],
    },
  });
  const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);
  return { role: 'assistant', content: response.text || "No data.", sources };
};

export const interactWithAurora = async (message: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: message }] }],
    config: { systemInstruction: "You are 'Aurora', an empathetic sanctuary companion." }
  });
  return response.text || "I'm listening.";
};

export const analyzeFullManuscript = async (content: string, goal: MasteringGoal): Promise<ManuscriptReport> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: "user", parts: [{ text: content.substring(0, 30000) }] }],
    config: {
      systemInstruction: `Perform professional Mastering Audit for ${goal.toUpperCase()}. Return industrial report in JSON.`,
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

export const connectLive = (callbacks: any, systemInstruction: string) => {
  const ai = getAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: systemInstruction,
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
    }
  });
};

export const generateImage = async (prompt: string): Promise<{ imageUrl: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Industrial book cover: ${prompt}. Gritty, high-contrast, black and neon orange aesthetic.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  let base64Image = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) { base64Image = part.inlineData.data; break; }
  }
  if (!base64Image) throw new Error("Image failed.");
  return { imageUrl: `data:image/png;base64,${base64Image}` };
};
