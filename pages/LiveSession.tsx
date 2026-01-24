
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  
  const [profile] = useState(() => {
    return readJson<any>('aca_author_profile', { 
      name: 'Author', 
      wrapName: 'WRAP',
      wrapGender: 'Neutral',
      wrapAccent: 'AU',
      wrapSpeed: '1x',
      wrapSound: 'Normal'
    });
  });

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
    setIsConnecting(true);
    setStatus('Linking...');

    const currentProfile = readJson<any>('aca_author_profile', { ...profile });
    const authorName = currentProfile.name?.trim() || 'Author';
    const wrapName = currentProfile.wrapName?.trim() || 'WRAP';

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

      // EXACT SCRIPT ENFORCEMENT
      const instruction = `
        MISSION: You are ${wrapName}, an assistant for ${authorName}.
        ACOUSTIC PROFILE: Gender: ${currentProfile.wrapGender}, Accent: ${currentProfile.wrapAccent}, Speed: ${currentProfile.wrapSpeed}, Sound: ${currentProfile.wrapSound}.
        
        INITIATION PROTOCOL (MANDATORY): 
        As soon as the link is established, speak FIRST.
        SAY EXACTLY: "Hi ${authorName}! I am your Writing, Revision, Articulation and Polish assistant. I like to be called ${wrapName}, but you can change my name and features by clicking the flashing button up there. If you change my features, i might need a moment to change into something your more comfortable with. But while ive got you, what type of story do you have in mind?"
        
        ONGOING: Scribe accurately. Remind them of the 3-5s lag. No sexual content.
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
                    sourcesRef.current.add(source);
                 }
               }
            }

            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              currentWrapTurnRef.current += text;
              setWrapTranscription(currentWrapTurnRef.current);
            }

            if (msg.serverContent?.inputTranscription) {
              setIsThinking(true);
              const text = msg.serverContent.inputTranscription.text;
              currentAuthorTurnRef.current += text;
            }

            if (msg.serverContent?.turnComplete) {
                if (currentAuthorTurnRef.current.trim()) masterHistoryRef.current.push(`[Author]: ${currentAuthorTurnRef.current.trim()}`);
                if (currentWrapTurnRef.current.trim()) masterHistoryRef.current.push(`[${wrapName}]: ${currentWrapTurnRef.current.trim()}`);
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
          onclose: () => stopSession(false),
          onerror: () => stopSession(false),
        }, instruction);

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsConnecting(false);
      setStatus('Failed');
    }
  };

  const handleExport = (isMidSession = true) => {
    const finalHistory = [...masterHistoryRef.current];
    if (currentAuthorTurnRef.current.trim()) finalHistory.push(`[Author]: ${currentAuthorTurnRef.current.trim()}`);
    if (currentWrapTurnRef.current.trim()) finalHistory.push(`[${profile.wrapName}]: ${currentWrapTurnRef.current.trim()}`);

    if (finalHistory.length === 0) return;

    const fullContent = finalHistory.join('\n\n');
    const currentSheets = readJson<Chapter[]>('wrap_sheets_v4', []);
    
    const newSheet: Chapter = {
      id: `live-${Date.now()}`,
      title: `Acoustic Yarn - ${new Date().toLocaleTimeString()}`,
      content: fullContent,
      order: 0,
      media: [],
      subChapters: []
    };
    
    writeJson('wrap_sheets_v4', [newSheet, ...currentSheets]);
    masterHistoryRef.current = [];
    if (isMidSession) {
        setShowExportToast(true);
        setTimeout(() => setShowExportToast(false), 3000);
    }
  };

  const stopSession = (doNavigate = true) => {
    handleExport(false);
    if (sessionRef.current) try { sessionRef.current.close(); } catch (e) {}
    if (audioContextRef.current) try { audioContextRef.current.close(); } catch (e) {}
    if (outputAudioContextRef.current) try { outputAudioContextRef.current.close(); } catch (e) {}
    setIsActive(false);
    setStatus('Standby');
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    if (doNavigate) navigate('/author-builder');
  };

  return (
    <div className="bg-[#020202] min-h-screen text-white flex flex-col font-sans overflow-hidden relative">
      <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black z-50">
        <button onClick={() => stopSession()} className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">← Exit Forge</button>
        <div className="flex items-center gap-8">
           {isActive && (
              <div className="flex items-center gap-4">
                 <Link to="/wrapper-info" className="px-6 py-2 border border-cyan-500 text-cyan-500 text-[8px] font-black uppercase tracking-[0.4em] animate-tune-pulse rounded-sm">Tune Partner</Link>
                 <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isThinking ? 'bg-amber-500 animate-industrial-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className="text-[8px] font-black uppercase text-gray-700 tracking-tighter w-12">{isThinking ? 'FORGING' : 'READY'}</span>
                 </div>
              </div>
           )}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 relative z-10">
        {!isActive && !isConnecting && (
          <div className="text-center space-y-12 animate-fade-in">
             <h1 className="text-7xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none uppercase">The <br/><span className="text-[var(--accent)] animate-living-accent">Forge Hub.</span></h1>
             <p className="text-xl text-gray-500 font-light italic max-w-md mx-auto">"Ready to link? Ensure your volume is up for WRAP's greeting."</p>
             <button onClick={startSession} className="px-24 py-8 text-white text-[12px] font-black uppercase tracking-[0.8em] shadow-2xl rounded-sm animate-living-amber-bg">Establish Link</button>
          </div>
        )}
        {isConnecting && <div className="text-center animate-pulse text-[var(--accent)] text-[11px] font-black uppercase tracking-[0.6em]">Syncing Hardware...</div>}
        {isActive && (
          <div className="w-full flex flex-col gap-10 py-12">
             <div className="flex-grow flex flex-col items-center justify-center relative group">
                <div className="absolute top-0 right-0 opacity-5 text-[10rem] font-serif italic text-white pointer-events-none">ORACLE</div>
                <div className={`transition-all duration-700 max-w-4xl text-center ${isThinking ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
                   <p className="text-4xl md:text-6xl font-serif italic text-white leading-tight">{wrapTranscription || "Awaiting signal..."}</p>
                </div>
             </div>
             <div className="grid md:grid-cols-2 gap-6 relative z-50">
                <button onClick={() => stopSession()} className="py-6 bg-black border border-white/5 text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 hover:text-white rounded-sm">Exit Session</button>
                <button onClick={() => handleExport(true)} className="py-6 animate-living-amber-bg text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-sm">Secure Yarn</button>
             </div>
          </div>
        )}

        {showExportToast && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(230,126,34,0.4)] animate-bounce-in z-[5000]">
            ✓ Yarn Captured to Studio.
          </div>
        )}
      </main>

      <style>{`
        @keyframes tune-pulse { 0%, 100% { border-color: rgba(6, 182, 212, 0.4); box-shadow: 0 0 0px rgba(6, 182, 212, 0); } 50% { border-color: rgba(6, 182, 212, 1); box-shadow: 0 0 15px rgba(6, 182, 212, 0.4); transform: scale(1.05); } }
        .animate-tune-pulse { animation: tune-pulse 2s infinite; }
        @keyframes bounce-in { 0% { opacity: 0; transform: translate(-50%, 20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LiveSession;
