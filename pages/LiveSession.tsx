
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
  
  // DISPLAY BUFFER: Only WRAP's current turn
  const [wrapTranscription, setWrapTranscription] = useState('');
  // MASTER BUFFER: Complete history (Author + WRAP)
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

    // Fetch Profile Data for Personalization
    const profile = readJson<any>('aca_author_profile', { 
      name: 'Author', 
      wrapName: 'WRAP',
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
        MISSION: You are ${profile.wrapName}, a warm Australian storytelling partner.
        AUTHOR: ${profile.name}
        ACOUSTIC PROFILE: Gender: ${profile.wrapGender}, Accent: ${profile.wrapAccent}, Pace: ${profile.wrapSpeed}, Level: ${profile.wrapSound}.
        
        INITIATION PROTOCOL (CRITICAL): 
        As soon as the link is established, you MUST speak first. 
        SAY EXACTLY: "Hi ${profile.name}! I am your Writing, Revision, Articulation and Polish assistant. I like to be called ${profile.wrapName}, but you can change my name and features in the profile page later, but while ive got you, what type of story do you have in mind?"
        
        ONGOING: Listen intently. Scribe their story. Remind them there is a 3-5 second lag as I forge my response. If the conversation becomes sexually explicit, I will inform them the session must end. Do not sanitize grit.
      `;

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
            // 1. Process Audio Output
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

            // 2. Transcribe WRAP (Oracle Display + History)
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              currentWrapTurnRef.current += text;
              setWrapTranscription(currentWrapTurnRef.current);
            }

            // 3. Transcribe Author (Silent History)
            if (msg.serverContent?.inputTranscription) {
              setIsThinking(true);
              const text = msg.serverContent.inputTranscription.text;
              currentAuthorTurnRef.current += text;
            }

            // 4. End of Turn: Commit to Master History
            if (msg.serverContent?.turnComplete) {
                if (currentAuthorTurnRef.current.trim()) {
                    masterHistoryRef.current.push(`[Author]: ${currentAuthorTurnRef.current.trim()}`);
                }
                if (currentWrapTurnRef.current.trim()) {
                    masterHistoryRef.current.push(`[${profile.wrapName}]: ${currentWrapTurnRef.current.trim()}`);
                }
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
      setStatus('Link Failed');
      alert("Microphone connection failed.");
    }
  };

  const handleExport = (isMidSession = true) => {
    // Collect any uncommitted turn text
    const finalHistory = [...masterHistoryRef.current];
    if (currentAuthorTurnRef.current.trim()) finalHistory.push(`[Author]: ${currentAuthorTurnRef.current.trim()}`);
    if (currentWrapTurnRef.current.trim()) finalHistory.push(`[WRAP]: ${currentWrapTurnRef.current.trim()}`);

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
    
    if (isMidSession) {
        masterHistoryRef.current = [`--- Session Installment Saved at ${new Date().toLocaleTimeString()} ---`];
        currentAuthorTurnRef.current = '';
        currentWrapTurnRef.current = '';
        setShowExportToast(true);
        setTimeout(() => setShowExportToast(false), 3000);
    }
  };

  const stopSession = () => {
    handleExport(false); // Final save
    
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
        <button onClick={stopSession} className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-[var(--accent)] transition-colors">← Exit Forge</button>
        <div className="flex items-center gap-8">
           <div className="text-right">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Acoustic Logic</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-[var(--accent)]'}`}>{status}</p>
           </div>
           {isActive && (
              <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${isThinking ? 'bg-amber-500 animate-industrial-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                 <span className="text-[8px] font-black uppercase text-gray-700 tracking-tighter w-12">{isThinking ? 'FORGING' : 'READY'}</span>
              </div>
           )}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 relative">
        {!isActive && !isConnecting && (
          <div className="text-center space-y-12 animate-fade-in">
             <div className="space-y-6">
                <h1 className="text-7xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none uppercase">The <br/><span className="text-[var(--accent)] animate-living-accent">Forge Hub.</span></h1>
                <p className="text-2xl text-gray-500 font-light italic max-w-xl mx-auto leading-relaxed">"The link is ready. Your full dialogue will be captured into the Registry."</p>
             </div>
             <button onClick={startSession} className="px-24 py-8 text-white text-[12px] font-black uppercase tracking-[0.8em] shadow-2xl transition-all rounded-sm animate-living-amber-bg glow-accent">Establish Link</button>
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-12">
             <div className="w-32 h-32 border-2 border-white/5 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-t-2 border-[var(--accent)] rounded-full animate-spin"></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-ping"></div>
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[var(--accent)] animate-pulse">Syncing Hardware...</p>
          </div>
        )}

        {isActive && (
          <div className="w-full h-full flex flex-col gap-10 animate-fade-in py-12">
             <div className="flex-grow flex flex-col items-center justify-center relative group">
                <div className="absolute top-0 right-0 opacity-5 text-[10rem] font-serif italic text-white select-none pointer-events-none group-hover:opacity-10 transition-opacity">ORACLE</div>
                
                <div className="w-full max-w-4xl text-center space-y-8">
                   <div className={`transition-all duration-700 min-h-[160px] flex flex-col items-center justify-center ${isThinking ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}>
                      <p className="text-4xl md:text-6xl font-serif italic text-white leading-tight tracking-tight">
                        {wrapTranscription || "Linking to partner..."}
                      </p>
                   </div>
                   
                   {isThinking && (
                     <div className="flex flex-col items-center gap-6 animate-fade-in">
                        <div className="h-0.5 w-64 bg-white/5 overflow-hidden">
                           <div className="h-full bg-[var(--accent)] animate-forge-load"></div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.8em] text-[var(--accent)]">Forge is thinking...</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6 pb-12">
                <button 
                  onClick={stopSession}
                  className="group px-12 py-6 bg-black border border-white/5 text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 hover:text-white hover:border-white/20 transition-all rounded-sm flex items-center justify-center gap-4"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 group-hover:bg-red-500 transition-colors"></span>
                  Pull up stumps
                </button>
                <button 
                  onClick={() => handleExport(true)}
                  className="px-12 py-6 text-white text-[10px] font-black uppercase tracking-[0.5em] shadow-xl transition-all rounded-sm animate-living-amber-bg hover:scale-[1.02]"
                >
                  Secure Yarn to Forge
                </button>
             </div>
          </div>
        )}

        {showExportToast && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(230,126,34,0.4)] animate-bounce-in z-[5000]">
            ✓ Yarn Captured. Continue...
          </div>
        )}
      </main>

      <style>{`
        @keyframes forge-load { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-forge-load { animation: forge-load 2s infinite ease-in-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        @keyframes bounce-in { 0% { opacity: 0; transform: translate(-50%, 20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .glow-accent { box-shadow: 0 0 30px var(--accent-glow); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LiveSession;
