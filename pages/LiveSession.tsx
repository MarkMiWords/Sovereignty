
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectLive } from '../services/geminiService';
import { writeJson, readJson } from '../utils/safeStorage';
import { Chapter } from '../types';
import { LiveServerMessage } from '@google/genai';

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const LiveSession: React.FC = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [wrapTranscription, setWrapTranscription] = useState('');
  const masterHistoryRef = useRef<string[]>([]);
  const [status, setStatus] = useState('Standby');
  const [showExportToast, setShowExportToast] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentAuthorTurnRef = useRef('');
  const currentWrapTurnRef = useRef('');

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

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const startSession = async () => {
    if (isActive) return;
    setIsConnecting(true);
    setStatus('Linking...');

    const profile = readJson<any>('aca_author_profile', { 
      name: 'Author', 
      wrapName: 'Assistant',
      wrapGender: 'Neutral',
      wrapAccent: 'AU',
      wrapSpeed: '1x',
      wrapSound: 'Normal'
    });

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } 
      });

      const instruction = `
        MISSION: You are ${profile.wrapName}, a warm storytelling partner.
        AUTHOR: ${profile.name}
        
        INITIATION: 
        SAY: "Hi ${profile.name}! I'm listening. What type of story do you have in mind today?"
        
        ONGOING: Listen intently. Scribe their words accurately. Keep the tone warm and supportive.
      `;

      const sessionPromise = connectLive({
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setStatus('Active');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => {
                try { s.sendRealtimeInput({ media: pcmBlob }); } catch(err) { 
                  if (String(err).includes('Network')) stopSession();
                }
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
                    const start = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    const buffer = await decodeAudioData(decode(part.inlineData.data), outputCtx, 24000, 1);
                    const source = outputCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputCtx.destination);
                    source.addEventListener('ended', () => sourcesRef.current.delete(source));
                    source.start(start);
                    nextStartTimeRef.current = start + buffer.duration;
                    // FIX: Access the current property of sourcesRef
                    sourcesRef.current.add(source);
                 }
               }
            }
            if (msg.serverContent?.outputTranscription) {
              currentWrapTurnRef.current += msg.serverContent.outputTranscription.text;
              setWrapTranscription(currentWrapTurnRef.current);
            }
            if (msg.serverContent?.inputTranscription) {
              setIsThinking(true);
              currentAuthorTurnRef.current += msg.serverContent.inputTranscription.text;
            }
            if (msg.serverContent?.turnComplete) {
                if (currentAuthorTurnRef.current.trim()) masterHistoryRef.current.push(`[Author]: ${currentAuthorTurnRef.current.trim()}`);
                if (currentWrapTurnRef.current.trim()) masterHistoryRef.current.push(`[Partner]: ${currentWrapTurnRef.current.trim()}`);
                currentAuthorTurnRef.current = '';
                currentWrapTurnRef.current = '';
                setIsThinking(false);
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsThinking(false);
            }
          },
          onclose: () => stopSession(),
          onerror: () => stopSession(),
        }, instruction);

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsConnecting(false);
      setStatus('Failed');
      alert("Microphone connection failed.");
    }
  };

  const handleExport = (isMidSession = true) => {
    const finalHistory = [...masterHistoryRef.current];
    if (currentAuthorTurnRef.current.trim()) finalHistory.push(`[Author]: ${currentAuthorTurnRef.current.trim()}`);
    if (currentWrapTurnRef.current.trim()) finalHistory.push(`[Partner]: ${currentWrapTurnRef.current.trim()}`);
    if (finalHistory.length === 0) return;
    const fullContent = finalHistory.join('\n\n');
    const currentSheets = readJson<Chapter[]>('wrap_sheets_v4', []);
    const newSheet: Chapter = { id: `voice-${Date.now()}`, title: `Voice Session - ${new Date().toLocaleTimeString()}`, content: fullContent, order: 0, media: [], subChapters: [] };
    writeJson('wrap_sheets_v4', [newSheet, ...currentSheets]);
    if (isMidSession) {
        masterHistoryRef.current = [`--- Session Saved ---`];
        currentAuthorTurnRef.current = '';
        currentWrapTurnRef.current = '';
        setShowExportToast(true);
        setTimeout(() => setShowExportToast(false), 3000);
    }
  };

  const stopSession = () => {
    handleExport(false);
    if (sessionRef.current) try { sessionRef.current.close(); } catch (e) {}
    if (audioContextRef.current) try { audioContextRef.current.close(); } catch (e) {}
    if (outputAudioContextRef.current) try { outputAudioContextRef.current.close(); } catch (e) {}
    setIsActive(false);
    setStatus('Standby');
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    navigate('/author-builder');
  };

  return (
    <div className="bg-[#020202] min-h-screen text-white flex flex-col font-sans overflow-hidden">
      <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black">
        <button onClick={stopSession} className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">← Exit Studio</button>
        <div className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-[var(--accent)]'}`}>{status}</div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 relative">
        {!isActive && !isConnecting && (
          <div className="text-center space-y-12 animate-fade-in">
             <div className="space-y-6">
                <h1 className="text-7xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none uppercase">Acoustic <br/><span className="text-[var(--accent)] animate-living-accent">Link.</span></h1>
                <p className="text-2xl text-gray-500 font-light italic max-w-xl mx-auto leading-relaxed">"Talk freely. Your story will be captured automatically."</p>
             </div>
             <button onClick={startSession} className="px-24 py-8 text-white text-[12px] font-black uppercase tracking-[0.8em] shadow-2xl transition-all rounded-sm animate-living-amber-bg">Initialize Link</button>
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-12">
             <div className="w-32 h-32 border-2 border-white/5 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-t-2 border-[var(--accent)] rounded-full animate-spin"></div>
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[var(--accent)] animate-pulse">Establishing Connection...</p>
          </div>
        )}

        {isActive && (
          <div className="w-full h-full flex flex-col gap-10 animate-fade-in py-12">
             <div className="flex-grow flex flex-col items-center justify-center relative group">
                <div className="w-full max-w-4xl text-center space-y-8">
                   <div className={`transition-all duration-700 min-h-[160px] flex flex-col items-center justify-center ${isThinking ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}>
                      <p className="text-4xl md:text-6xl font-serif italic text-white leading-tight tracking-tight">
                        {wrapTranscription || "Listening..."}
                      </p>
                   </div>
                   {isThinking && <p className="text-[10px] font-black uppercase tracking-[0.8em] text-[var(--accent)] animate-pulse">Working...</p>}
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6 pb-12">
                <button onClick={stopSession} className="group px-12 py-6 bg-black border border-white/5 text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 hover:text-white transition-all rounded-sm">Finish Session</button>
                <button onClick={() => handleExport(true)} className="px-12 py-6 text-white text-[10px] font-black uppercase tracking-[0.5em] shadow-xl transition-all rounded-sm animate-living-amber-bg">Save Draft</button>
             </div>
          </div>
        )}

        {showExportToast && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl animate-bounce-in z-[5000]">✓ Draft Saved</div>
        )}
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LiveSession;
