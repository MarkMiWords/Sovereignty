
import { Message, ManuscriptReport, MasteringGoal } from "../types";
import { GoogleGenAI, Modality, Type } from "@google/genai";

/**
 * SOVEREIGN AI BRIDGE v8.9 - MIRROR PROTOCOL
 */

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: The Sovereign Engine requires an industrial API key to operate.");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkSystemHeartbeat = async (): Promise<{ status: 'online' | 'offline' | 'error', message: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      config: { maxOutputTokens: 10, thinkingConfig: { thinkingBudget: 0 } }
    });
    if (response.text) return { status: 'online', message: "Sovereign Link Established." };
    return { status: 'error', message: "Empty response from engine." };
  } catch (err: any) {
    console.error("Heartbeat Failure:", err);
    return { status: 'error', message: err.message || "Engine link severed." };
  }
};

/**
 * GENERATE SPEECH (TTS)
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with grit and authentic character: ${text.substring(0, 1000)}` }] }],
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
    if (!base64Audio) throw new Error("Acoustic synthesis returned no data.");
    return base64Audio;
  } catch (err) {
    console.error("TTS Failure:", err);
    throw new Error("Vocal Forge Interrupted.");
  }
};

export const articulateText = async (text: string, settings: { gender: string, tone: string, accent: string, speed: string, isClone?: boolean }, style: string, region: string) => {
  const ai = getAI();
  const { gender, tone, accent, speed, isClone } = settings;
  
  const cloneProtocol = isClone ? "PROTOCOL: AUTHOR CLONE. Emulate the calibrated signature: high grit, personalized cadence, and raw emotional resonance from the 30-second calibration data." : "";
  const instruction = `${cloneProtocol}
    Transform the provided carceral narrative for oral storytelling. 
    PROFILE: ${gender}, TONE: ${tone}, ACCENT: ${accent}, SPEED: ${speed}. 
    CONTEXT: ${region}, STYLE: ${style}. 
    RULE: Maintain authentic carceral grit. Enhance the spoken rhythm for a captive audience.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: { systemInstruction: instruction }
  });

  return { text: response.text || text };
};

export const smartSoap = async (text: string, level: string, style: string, region: string) => {
  const ai = getAI();
  let instruction = "";
  let useTools = false;

  switch (level) {
    case 'rinse': instruction = "Fix light grammar only. Preserve carceral dialect and raw grit."; break;
    case 'scrub': instruction = `Elevate literary structure for a ${style} narrative in ${region}.`; break;
    case 'fact_check': instruction = `Verify legal/factual claims relevant to ${region}.`; useTools = true; break;
    case 'sanitise': instruction = "Replace names with realistic fictional aliases to prevent defamation."; break;
    case 'dogg_me': instruction = "Convert to a rhythmic, raw industrial poem."; break;
    default: instruction = `Refine for ${style}.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: `SOVEREIGN SOAP: ${instruction}`,
      tools: useTools ? [{ googleSearch: {} }] : []
    }
  });

  return { text: response.text || text };
};

export const queryPartner = async (message: string, style: string, region: string, history: any[], activeSheetContent: string): Promise<Message> => {
  const ai = getAI();
  const contents = (history || [])
    .filter(h => h && h.content)
    .slice(-10)
    .map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(h.content || "") }]
    }));

  contents.push({
    role: 'user',
    parts: [{ text: activeSheetContent ? `[CONTEXT: ${activeSheetContent.substring(0, 4000)}]\n\nAUTHOR QUERY: ${message}` : message }]
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: `You are WRAPPER, the Sovereign Writing Partner. Tone: ${style}. Region: ${region}. Provide empathetic, industrial-focused advice. Use Google Search for factual grounding.`,
      tools: [{ googleSearch: {} }]
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    web: { uri: chunk.web?.uri || "", title: chunk.web?.title || "" }
  })).filter((s: any) => s.web.uri);

  return { role: 'assistant', content: response.text || "Partner node idle.", sources };
};

export const queryInsight = async (message: string): Promise<Message> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: "user", parts: [{ text: message }] }],
    config: {
      systemInstruction: "You are an Archive Specialist for carceral narratives. Use Google Search for systemic context.",
      tools: [{ googleSearch: {} }],
    },
  });

  const content = response.text || "Insight unavailable.";
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
      systemInstruction: "You are 'Aurora', the Sanctuary Node. High empathy, calm cadence, creative sanctuary partner.",
    }
  });
  return response.text || "I am listening.";
};

export const generateImage = async (prompt: string): Promise<{ imageUrl: string }> => {
  const ai = getAI();
  const industrialPrompt = `A high-quality, dramatic book cover for a prison narrative. Style: Minimalist noir, gritty texture, industrial lighting. Themes: ${prompt}. Aspect Ratio 16:9. Colors: Black, white, and high-contrast orange.`;

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

  if (!base64Image) throw new Error("Visual Forge failed to manifest image data.");
  return { imageUrl: `data:image/png;base64,${base64Image}` };
};

export const connectLive = (callbacks: any, systemInstruction: string) => {
  const ai = getAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,
      inputAudioTranscription: {},
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
    contents: [{ role: "user", parts: [{ text: content.substring(0, 30000) }] }],
    config: {
      systemInstruction: `Perform a Sovereign Audit for ${goal}. Return JSON.`,
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
