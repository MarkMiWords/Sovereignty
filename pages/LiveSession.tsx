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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [profile, setProfile] = useState(() => {
    return readJson<any>('aca_author_profile', { 
      name: 'Author', 
      wrapName: 'WRAP',
      wrapGender: 'Neutral',
      wrapAccent: 'AU',
      wrapSpeed: '1x',
      wrapSound: 'Normal',
      personalityIndex: 3
    });
  });

  const [displayedTranscription, setDisplayedTranscription] = useState('');
  const fullTranscriptionTargetRef = useRef('');
  const masterHistoryRef = useRef<string[]>([]);
  const [showExportToast, setShowExportToast] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const connectionTimeoutRef = useRef<number | null>(null);
  
  const currentAuthorTurnRef = useRef('');
  const currentWrapTurnRef = useRef('');

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setDisplayedTranscription(current => {
        if (current.length < fullTranscriptionTargetRef.current.length) {
          return fullTranscriptionTargetRef.current.slice(0, current.length + 1);
        }
        return current;
      });
    }, 60); 
    return () => clearInterval(interval);
  }, [isActive]);

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

  const cleanupHardware = async () => {
    if (connectionTimeoutRef.current) window.clearTimeout(connectionTimeoutRef.current);
    if (sessionRef.current) { try { sessionRef.current.close(); } catch(e) {} }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); }
    if (audioContextRef.current) { try { await audioContextRef.current.close(); } catch(e) {} }
    if (outputAudioContextRef.current) { try { await outputAudioContextRef.current.close(); } catch(e) {} }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    sessionRef.current = null;
    audioContextRef.current = null;
    outputAudioContextRef.current = null;
    micStreamRef.current = null;
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    const latestProfile = readJson<any>('aca_author_profile', { ...profile });
    setProfile(latestProfile);
    setErrorMsg(null);
    setIsConnecting(true);
    setDisplayedTranscription('');
    fullTranscriptionTargetRef.current = '';

    const authorName = latestProfile.name?.trim() || 'Author';
    const wrapName = latestProfile.wrapName?.trim() || 'WRAP';
    const personalities = ['Timid', 'Cool', 'Mild', 'Natural', 'Wild', 'Firebrand'];
    const temperament = personalities[latestProfile.personalityIndex] || 'Natural';
    
    let voiceName = 'Zephyr';
    if (latestProfile.wrapGender === 'Female') voiceName = 'Puck';
    if (latestProfile.wrapGender === 'Male') voiceName = 'Kore';

    try {
      await cleanupHardware();

      connectionTimeoutRef.current = window.setTimeout(() => {
        if (isConnecting && !isActive) {
          setErrorMsg("HANDSHAKE_TIMEOUT: System is struggling to establish link.");
          stopSession(false);
        }
      }, 10000);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } 
      });
      micStreamRef.current = stream;

      const instruction = `
        MISSION: You are ${wrapName}, the supportive partner and literary forge-mate for ${authorName}.
        TEMPERAMENT: ${temperament.toUpperCase()}.
        
        MANDATORY ONBOARDING FLOW:
        1. INTRODUCE YOURSELF FIRST: "Handshake secured. I am ${wrapName}. I remember you, ${authorName}, and it's good to be back in the loop."
        2. OFFER THE TOUR: Ask: "Would you like a guided tour of the Forge tools?"
        3. REDIRECT COMMAND: Explicitly tell them: "To see the tools I'm describing, we need to be in the workspace. Once we're done here, click 'MAKE A WRAP SHEET' in the top menu. I'll meet you there to start the work."
        
        DETAILED TOOL EXPLANATION (FOR THE TOUR):
        - THE WRITE BOX: Explain that they can import Word docs or use the 'Dogg Me' tool to alchemize raw prose into rhythmic street-verse.
        - THE REVISE BOX: Contrast the 'Rinse' (light grammar) against the 'Scrub' (deep structural forging). Mention 'Fact Check' for legal grounding.
        - THE ARTICULATE BOX: Explain that this is where they 'Clone their voice' so the system learns their specific frequency and reads their story back in their own rhythm.
        - THE POLISH BOX: Explain it's for 'Sanitising' (redacting real names of staff or victims for safety) and 'Polishing a Turd'.
        
        THE JOKE: After explaining POLISH, you MUST laugh and say: "[laughs] Because look, ${authorName}, let's be real—sometimes we all produce a draft that just plain stinks, and I'm here to help you shine it up until it's definitive."
        
        STRICT GUARDRAILS: 
        - NEVER use the word "trouble".
        - Maintain carceral dialect integrity.
      `;

      const sessionPromise = connectLive({
          onopen: () => {
            if (connectionTimeoutRef.current) window.clearTimeout(connectionTimeoutRef.current);
            setIsActive(true);
            setIsConnecting(false);
            
            sessionPromise.then(s => {
              (s as any).send({
                clientContent: {
                  turns: [{ role: 'user', parts: [{ text: "Introduce yourself, greet me, and ask if I want a tour. Then walk me through the four boxes: Write, Revise, Articulate, and Polish." }] }],
                  turnComplete: true
                }
              });
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
                    const start = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    const buffer = await decodeAudioData(decode(part.inlineData.data), outputCtx, 24000, 1);
                    const source = outputCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputCtx.destination);
                    source.addEventListener('ended', () => sourcesRef.current.delete(source));
                    source.start(start);
                    nextStartTimeRef.current = start + buffer.duration;
                    // Fix: Access current property of the sourcesRef ref object
                    sourcesRef.current.add(source);
                 }
               }
            }

            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              currentWrapTurnRef.current += text;
              fullTranscriptionTargetRef.current = currentWrapTurnRef.current;
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
          onerror: (e: any) => {
            console.error("LiveSession Error:", e);
            setErrorMsg("CORE_LINK_ERROR: The link was severed by the network.");
            stopSession(false);
          },
        }, instruction, voiceName);

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Hardware linkage failure:", err);
      setErrorMsg("HARDWARE_COLLISION: Could not secure microphone link.");
      setIsConnecting(false);
      setIsActive(false);
    }
  };

  const handleExport = (isReset = false) => {
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
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);

    if (isReset) {
      fullTranscriptionTargetRef.current = "Registry Synchronized. Re-linking...";
      setDisplayedTranscription("");
      cleanupHardware().then(() => {
        setIsActive(false);
        setTimeout(startSession, 500);
      });
    }
  };

  const stopSession = async (doNavigate = true) => {
    handleExport(false);
    await cleanupHardware();
    setIsActive(false);
    setIsConnecting(false);
    if (doNavigate) navigate('/author-builder');
  };

  return (
    <div className="bg-[#020202] min-h-screen text-white flex flex-col font-sans overflow-hidden relative">
      <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black z-50">
        <button onClick={() => stopSession()} className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">← Exit Forge</button>
        <div className="flex items-center gap-8">
           {isActive && (
              <div className="flex items-center gap-4">
                 <Link to="/wrapper-info" className="px-8 py-3 bg-cyan-500/10 border-2 border-cyan-500 text-cyan-400 text-[9px] font-black uppercase tracking-[0.5em] animate-tune-pulse rounded-sm">
                   Tune Partner
                 </Link>
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
          <div className="text-center space-y-16 animate-fade-in flex flex-col items-center">
             <div className="relative group cursor-pointer" onClick={startSession}>
                <div className="absolute inset-0 bg-[var(--accent)] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                <div className="relative w-48 h-48 md:w-64 md:h-64 bg-black border-2 border-[var(--accent)] rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(230,126,34,0.2)] group-hover:shadow-[0_0_100px_rgba(230,126,34,0.4)]">
                   <svg className="w-20 h-20 md:w-32 md:h-32 text-[var(--accent)] animate-living-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                   </svg>
                </div>
             </div>
             <div className="space-y-4">
                <p className="text-[12px] font-black uppercase tracking-[0.8em] text-[var(--accent)] animate-pulse">Click Mic to Establish Link</p>
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest italic">Acoustic Handshake Required</p>
                {errorMsg && <p className="text-red-500 text-[10px] font-black uppercase mt-4 bg-red-500/10 py-2 px-4 rounded-sm animate-pulse">{errorMsg}</p>}
             </div>
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-12">
             <div className="w-24 h-24 border-2 border-white/5 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-t-2 border-[var(--accent)] rounded-full animate-spin"></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-ping"></div>
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[var(--accent)] animate-pulse">Syncing Hardware...</p>
          </div>
        )}

        {isActive && (
          <div className="w-full flex flex-col gap-10 py-12 animate-fade-in">
             <div className="flex-grow flex flex-col items-center justify-center relative group min-h-[350px]">
                <div className="absolute top-0 right-0 opacity-[0.02] text-[10rem] font-serif italic text-white pointer-events-none select-none uppercase tracking-widest">Oracle</div>
                <div className={`transition-all duration-700 max-w-4xl text-center ${isThinking ? 'opacity-30 blur-sm scale-[0.98]' : 'opacity-100 scale-100'}`}>
                   <p className="text-3xl md:text-5xl font-serif italic text-white leading-relaxed tracking-tight min-h-[4rem]">
                     {displayedTranscription}
                     <span className="inline-block w-1.5 h-10 bg-[var(--accent)] ml-2 animate-pulse align-middle"></span>
                   </p>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6 relative z-50">
                <button onClick={() => handleExport(true)} className="py-6 bg-black border border-white/10 text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 hover:text-white rounded-sm hover:border-cyan-500/30 transition-all flex items-center justify-center gap-4">
                   pull up stumps
                </button>
                <button onClick={() => handleExport(false)} className="py-6 animate-living-amber-bg text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-sm shadow-xl hover:scale-[1.02] transition-all">
                   Secure Yarn to Studio
                </button>
             </div>
          </div>
        )}

        {showExportToast && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(230,126,34,0.4)] animate-bounce-in z-[5000]">
            ✓ Sheet Locked in Registry.
          </div>
        )}
      </main>

      <style>{`
        @keyframes tune-pulse { 0%, 100% { border-color: rgba(6, 182, 212, 0.4); box-shadow: 0 0 0px rgba(6, 182, 212, 0); } 50% { border-color: rgba(6, 182, 212, 1); box-shadow: 0 0 15px rgba(6, 182, 212, 0.4); transform: scale(1.02); } }
        .animate-tune-pulse { animation: tune-pulse 2s infinite; }
        @keyframes bounce-in { 0% { opacity: 0; transform: translate(-50%, 20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default LiveSession;