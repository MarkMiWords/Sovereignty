
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectLive } from '../services/geminiService';
import { writeJson, readJson } from '../utils/safeStorage';
import { Chapter } from '../types';
// Import LiveServerMessage from the SDK
import { LiveServerMessage } from '@google/genai';

// PCM Encoding Utility
function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const LiveSession: React.FC = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState('Standby');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    setWordCount(transcription.split(/\s+/).filter(Boolean).length);
  }, [transcription]);

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
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    if (isActive) return;
    setIsConnecting(true);
    setStatus('Linking...');

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      // CRITICAL: Resume context for browser compliance
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true
        } 
      });

      const sessionPromise = connectLive({
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setStatus('Acoustic Link Active');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          // Fixed: LiveServerMessage type is now imported from @google/genai
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const start = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(start);
              nextStartTimeRef.current = start + buffer.duration;
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.inputTranscription) {
              setTranscription(prev => prev + ' ' + msg.serverContent!.inputTranscription!.text);
            }
          },
          onclose: () => {
            setIsActive(false);
            setStatus('Link Severed');
          },
          onerror: (e: any) => {
            console.error('Live Link Error:', e);
            stopSession();
          },
        }, "G'day mate. You are a warm, helpful Australian partner. Your goal is to scribe their carceral story. Keep your responses concise so they can do the talking. Mention that you're ready to scribe their story into the Registry.");

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Live Session Start Failure:", err);
      setIsConnecting(false);
      setStatus('Link Failed');
      alert("Microphone connection failed. Please ensure permissions are granted in your browser settings.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    if (outputAudioContextRef.current) {
      try { outputAudioContextRef.current.close(); } catch (e) {}
    }
    setIsActive(false);
    setStatus('Standby');
    sessionRef.current = null;
    audioContextRef.current = null;
    outputAudioContextRef.current = null;
  };

  const handleExport = () => {
    if (!transcription.trim()) return;
    const currentSheets = readJson<Chapter[]>('wrap_sheets_v4', []);
    const newSheet: Chapter = {
      id: `live-${Date.now()}`,
      title: `Live Yarn - ${new Date().toLocaleDateString()}`,
      content: transcription.trim(),
      order: 0,
      media: [],
      subChapters: []
    };
    writeJson('wrap_sheets_v4', [newSheet, ...currentSheets]);
    setStatus('Export Success');
    setTimeout(() => {
      stopSession();
      navigate('/author-builder');
    }, 500);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white flex flex-col">
      <header className="p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
        <button onClick={() => navigate('/author-builder')} className="text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.4em] hover:underline">← Back to Forge</button>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Acoustic Status</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-[var(--accent)]'}`}>{status}</p>
           </div>
           {isActive && <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_#22c55e]"></div>}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 py-20 relative">
        {!isActive && !isConnecting && (
          <div className="text-center space-y-12 animate-fade-in">
             <div className="space-y-4">
                <span className="tracking-[0.8em] uppercase text-[10px] font-black block" style={{ color: 'var(--accent)' }}>Live Link v2.5</span>
                <h1 className="text-6xl md:text-[6rem] lg:text-8xl font-serif font-black italic text-white tracking-tighter leading-none">Ready to <br/><span style={{ color: 'var(--accent)' }}>tell us a yarn?</span></h1>
                <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-xl mx-auto">"Pull up a stump. I'm here to listen. Your story is ready to be scribed."</p>
             </div>
             <button 
               onClick={startSession}
               className="px-20 py-8 text-white text-[12px] font-black uppercase tracking-[0.6em] shadow-2xl transition-all rounded-sm animate-living-amber-bg glow-accent"
             >
               Initialize Link
             </button>
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-8 animate-pulse">
             <div className="w-24 h-24 border-2 border-white/10 rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }}></div>
             <p className="text-[10px] font-black uppercase tracking-[0.8em]" style={{ color: 'var(--accent)' }}>Calibrating Frequency...</p>
          </div>
        )}

        {isActive && (
          <div className="w-full flex flex-col gap-12 animate-fade-in">
             <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div className="space-y-2">
                   <h2 className="text-4xl font-serif italic text-white">The Live Script</h2>
                   <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Recording in progress...</p>
                </div>
                <div className="flex gap-12">
                   <div className="text-right">
                      <p className="text-[8px] text-gray-700 uppercase font-black tracking-widest">Word Count</p>
                      <p className={`text-2xl font-serif italic ${wordCount > 1000 ? 'text-red-500' : 'text-white'}`}>{wordCount} / 1000</p>
                   </div>
                </div>
             </div>

             <div className="flex-grow min-h-[400px] p-12 bg-white/[0.02] border border-white/5 rounded-sm font-serif italic text-3xl leading-relaxed text-gray-300 custom-scrollbar overflow-y-auto">
                {transcription || "Listening for your truth..."}
                {isActive && <span className="inline-block w-2 h-8 bg-[var(--accent)] ml-4 animate-pulse align-middle"></span>}
             </div>

             <div className="flex justify-center gap-6">
                <button 
                  onClick={stopSession}
                  className="px-12 py-5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/30 transition-all rounded-sm"
                >
                  Pull up stumps
                </button>
                <button 
                  onClick={handleExport}
                  disabled={wordCount === 0}
                  className="px-12 py-5 text-white text-[10px] font-black uppercase tracking-[0.5em] shadow-xl transition-all rounded-sm disabled:opacity-20 animate-living-amber-bg"
                >
                  Export to Forge
                </button>
             </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .glow-accent { box-shadow: 0 0 30px var(--accent-glow); }
      `}</style>
    </div>
  );
};

export default LiveSession;
