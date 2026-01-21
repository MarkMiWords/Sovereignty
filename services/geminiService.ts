import { Message, ManuscriptReport, MasteringGoal } from "../types";
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * SOVEREIGN AI BRIDGE v7.5 - STABLE PROXY MODE
 */

export const articulateText = async (text: string, settings: { gender: string, tone: string, accent: string, speed: string }, style: string, region: string) => {
  const response = await fetch('/api/articulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, settings, style, region })
  });
  if (!response.ok) throw new Error("Acoustic Link Interrupted");
  return response.json();
};

export const smartSoap = async (text: string, level: string, style: string, region: string) => {
  const response = await fetch('/api/soap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, level, style, region })
  });
  if (!response.ok) throw new Error("Soap Link Interrupted");
  return response.json();
};

export const queryPartner = async (message: string, style: string, region: string, history: any[], activeSheetContent: string): Promise<Message> => {
  const response = await fetch('/api/partner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, style, region, history, activeSheetContent })
  });
  if (!response.ok) throw new Error("Partner Link Interrupted");
  return response.json();
};

export const queryInsight = async (message: string): Promise<Message> => {
  const response = await fetch('/api/insight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!response.ok) throw new Error("Insight Link Interrupted");
  return response.json();
};

export const interactWithAurora = async (message: string): Promise<string> => {
  const response = await fetch('/api/kindred', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!response.ok) throw new Error("Kindred Link Interrupted");
  const data = await response.json();
  return data.text || "I am listening.";
};

export const generateImage = async (prompt: string) => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) throw new Error("Image Generation Failed");
  return response.json();
};

export const analyzeFullManuscript = async (content: string, goal: MasteringGoal): Promise<ManuscriptReport> => {
  const response = await fetch('/api/manuscript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, goal })
  });
  if (!response.ok) throw new Error("Manuscript Audit Failed");
  return response.json();
};

// LIVE SDK Logic must remain in browser for microphone access
// Using process.env.API_KEY directly as per guidelines
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
