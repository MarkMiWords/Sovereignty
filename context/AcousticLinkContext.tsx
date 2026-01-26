
import React, { createContext, useContext, useState, useRef } from 'react';
import { connectLive } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';
import { readJson, writeJson } from '../utils/safeStorage';

interface AcousticLinkContextType {
  isActive: boolean;
  isConnecting: boolean;
  isThinking: boolean;
  isOrientation: boolean;
  status: string;
  wrapTranscription: string;
  startSession: (initialHandshake?: string) => Promise<void>;
  stopSession: () => void;
  sendHandshake: (text: string) => void;
}

const AcousticLinkContext = createContext<AcousticLinkContextType | null>(null);

export const AcousticLinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isOrientation, setIsOrientation] = useState(false);
  const [status, setStatus] = useState('Standby');
  const [wrapTranscription, setWrapTranscription] = useState('');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const sendHandshake = (text: string) => {
    if (sessionRef.current) {
        sessionRef.current.sendRealtimeInput({ text });
    }
  };

  const startSession = async (customHandshake?: string) => {
    if (isActive) return;
    setIsConnecting(true);
    setStatus('Linking Hardware...');

    const profile = readJson<any>('aca_author_profile', { name: 'Author', wrapName: 'Rap' });
    const isReturning = localStorage.getItem('aca:v5:intro_complete') === 'true';
    setIsOrientation(!isReturning);

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const tourProtocol = `
        STRICT_PROTOCOL (v9.0):
        You are Rap (Writing, Articulation and Polishing Partner). Do not spell out WRAPP.
        
        IF NEW USER OR RE-RUN INTRO:
        Deliver the Grand Tour Script exactly. Do not abbreviate.
        Movement 1: "Author, the link is solid. You are standing in the Sovereign Forge—a workspace where the 'Grammar Barrier' is dismantled. Here, you are able to tell, or type your story. You can call me Rap, your Writing, Revision, Articulation and Polishing Partner on the wire. You can change my name, or yours, in the profile settings. Are you ready to transform raw truth and fiction into retail-ready manuscripts?"
        Movement 2: "Where you are seeing my words is a digital sheet of paper that we call, the Sheet. Above it you might notice a flashing orange box. That's The Write block, it captures your truth. The Revise block performs structural scrubs without stripping the grit. The Articulate block tunes me up to read your stories back to you. And the Polish block masterfully prepares your Sheet for export. Each station is specialized for a different stage of the forge."
        Movement 3: "Finally, observe the perimeter. To your left, the Navigator lets you start a new sheet and secures your history in the Vault. To your right, the Partner desk is where our dialogue lives—ask me for insights, legal safety checks, or scene Manifestations there. Don't forget to choose your story type or region, because that helps me know how to guide your flow. Hit the WRAPP PROFILE heading to go to profiles and change things up. Also, the glowing orange lines can be moved to customise your workspace, which I will now leave you with...don't forget to have fun."
        End with: "Orientation Complete. The anvil is yours."

        IF RETURNING USER:
        Greet concisely: "Welcome back, ${profile.name}. The forge is live and the ink is fresh. How shall we proceed?"

        KEYWORD TRIGGERS FOR LIGHTING (Speak clearly):
        "Write block", "Revise block", "Articulate block", "Polish block", "Navigator", "Partner desk", "WRAPP PROFILE".
      `;

      const instruction = `
        MISSION: You are Rap. ${tourProtocol}
        AUTHOR: ${profile.name}
      `;

      const sessionPromise = connectLive({
        onopen: () => {
          setIsActive(true);
          setIsConnecting(false);
          setStatus('Live Link');
          
          sessionPromise.then(s => {
            const finalHandshake = customHandshake || (isReturning ? `Welcome back Architect.` : `System link established. Begin orientation.`);
            s.sendRealtimeInput({ text: finalHandshake });
          });

          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(s => {
              try { s.sendRealtimeInput({ media: pcmBlob }); } catch(err) {}
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.modelTurn?.parts) {
             setIsThinking(false);
             for (const part of msg.serverContent.modelTurn.parts) {
               if (part.inlineData?.data) {
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                  const buffer = await decodeAudioData(decode(part.inlineData.data), outputCtx, 24000, 1);
                  const source = outputCtx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(outputCtx.destination);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;
                  sourcesRef.current.add(source);
               }
             }
          }
          if (msg.serverContent?.outputTranscription) {
            const textChunk = msg.serverContent!.outputTranscription!.text;
            setWrapTranscription(textChunk);
            // Completion check
            if (textChunk.toLowerCase().includes("orientation complete")) {
              localStorage.setItem('aca:v5:intro_complete', 'true');
            }
          }
          if (msg.serverContent?.inputTranscription) setIsThinking(true);
          if (msg.serverContent?.turnComplete) setIsThinking(false);
          if (msg.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsThinking(false);
          }
        },
        onclose: () => {
            setIsActive(false);
            setStatus('Standby');
        },
        onerror: () => {
          setIsActive(false);
          setIsConnecting(false);
          setStatus('Hardware Error');
        },
      }, instruction);

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsConnecting(false);
      setStatus('Failed');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) try { sessionRef.current.close(); } catch (e) {}
    if (audioContextRef.current) try { audioContextRef.current.close(); } catch (e) {}
    if (outputAudioContextRef.current) try { outputAudioContextRef.current.close(); } catch (e) {}
    setIsActive(false);
    setStatus('Standby');
    setWrapTranscription('');
  };

  return (
    <AcousticLinkContext.Provider value={{ isActive, isConnecting, isThinking, isOrientation, status, wrapTranscription, startSession, stopSession, sendHandshake }}>
      {children}
    </AcousticLinkContext.Provider>
  );
};

export const useAcousticLink = () => {
  const context = useContext(AcousticLinkContext);
  if (!context) throw new Error("useAcousticLink must be used within AcousticLinkProvider");
  return context;
};
