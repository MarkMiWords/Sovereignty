
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { queryPartner, smartSoap, articulateText, connectLive, generateSpeech } from '../services/geminiService';
import { Message, Chapter, VaultStorage, VaultSheet } from '../types';
import { readJson, writeJson } from '../utils/safeStorage';
import { LiveServerMessage } from '@google/genai';

declare const mammoth: any;

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const DEFAULT_CHAPTER: Chapter = { id: '1', title: "", content: '', order: 0, media: [], subChapters: [] };

const CALIBRATION_SCRIPTS = [
  {
    id: 'sovereignty',
    title: 'The Rebellion Protocol',
    text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion. My story is my truth, and my truth is my sovereignty."
  },
  {
    id: 'architect',
    title: 'The Architect\'s Script',
    text: "They build walls to contain bodies, but they haven't built a wall yet that can contain a story. I am the architect of my own legacy, forging meaning from the friction of the system."
  }
];

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const AuthorBuilder: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  
  const [navWidth, setNavWidth] = useState(320);
  const [partnerWidth, setPartnerWidth] = useState(400);
  const isResizingNav = useRef(false);
  const isResizingPartner = useRef(false);
  
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const val = readJson<Chapter[]>('wrap_sheets_v4', [DEFAULT_CHAPTER]);
    return val.length > 0 ? val : [DEFAULT_CHAPTER];
  });
  
  const [activeChapterId, setActiveChapterId] = useState(() => chapters[0]?.id || '1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isProcessingWrite, setIsProcessingWrite] = useState(false);
  const [isProcessingRevise, setIsProcessingRevise] = useState(false);
  const [isProcessingArticulate, setIsProcessingArticulate] = useState(false);
  const [isProcessingPolish, setIsProcessingPolish] = useState(false);
  const [isAcousticActive, setIsAcousticActive] = useState(false);

  // Articulate Calibration States
  const [gender, setGender] = useState('Neutral');
  const [tone, setTone] = useState('Normal');
  const [accent, setAccent] = useState('AU');
  const [speed, setSpeed] = useState('1.0x');
  const [isCloneActive, setIsCloneActive] = useState(false);
  const [isCloneCalibrated, setIsCloneCalibrated] = useState(() => readJson<boolean>('aca_clone_calibrated', false));
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);

  const [isDictating, setIsDictating] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'sheet' | 'partner' | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const profile = readJson<any>('aca_author_profile', { fontIndex: 0, motivation: 'Prison Life', region: 'Australia' });
  const [style] = useState(profile.motivation || STYLES[2]); 
  const [region] = useState(profile.region || REGIONS[1]);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0] || DEFAULT_CHAPTER;
  const wordCount = activeChapter.content.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    saveTimeoutRef.current = window.setTimeout(() => {
      writeJson('wrap_sheets_v4', chapters);
      setIsSaving(false);
    }, 1000);
    return () => { if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current); };
  }, [chapters]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingNav.current) {
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 500) setNavWidth(newWidth);
      }
      if (isResizingPartner.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 300 && newWidth < 800) setPartnerWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      isResizingNav.current = false;
      isResizingPartner.current = false;
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleNewSheet = () => {
    const newId = Date.now().toString(); 
    setChapters(prev => [{ ...DEFAULT_CHAPTER, id: newId, title: "" }, ...prev]); 
    setActiveChapterId(newId);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const handleSaveToVault = () => {
    const vault = readJson<VaultStorage>('sovereign_vault', { sheets: [], books: [], ai: [], audits: [] });
    const newVaultSheets: VaultSheet[] = chapters.map(c => ({
      id: `vault-${c.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'archived',
      data: c
    }));
    vault.sheets = [...newVaultSheets, ...(vault.sheets || [])];
    writeJson('sovereign_vault', vault);
    alert("Saved to Vault.");
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingWrite(true);
    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const h1 = doc.querySelector('h1')?.textContent || doc.querySelector('h2')?.textContent || "";
        const plainText = doc.body.innerText || doc.body.textContent || "";
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: h1 || file.name.replace('.docx', ''), content: plainText } : c));
      } else {
        const text = await file.text();
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: text } : c));
      }
    } catch (err) { 
       console.error(err); 
       alert("Import Link Failure. The file may be corrupt.");
    } finally { setIsProcessingWrite(false); }
  };

  const handlePartnerChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const finalMsg = (customMsg || partnerInput).trim();
    if (!finalMsg || isPartnerLoading) return;
    setPartnerInput('');
    setMessages(prev => [...prev, { role: 'user', content: finalMsg }]);
    setIsPartnerLoading(true);
    try {
      const response = await queryPartner(finalMsg, style, region, messages, activeChapter.content);
      setMessages(prev => [...prev, response]);
    } catch (err: any) { 
      console.error("Partner Chat Failure:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Partner Link Failure. Diagnostic: ${err.message || 'Catastrophic Engine Delay'}` }]); 
    } 
    finally { 
      setIsPartnerLoading(false); 
      setTimeout(() => chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  };

  const handleSoap = async (level: string, block: 'revise' | 'polish') => {
    if (!activeChapter.content?.trim()) return;
    if (block === 'revise') setIsProcessingRevise(true);
    else setIsProcessingPolish(true);
    try {
      const result = await smartSoap(activeChapter.content, level, style, region);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Forge Failure during ${level.toUpperCase()}. Diagnostic: ${err.message}` }]);
    } finally { 
       setIsProcessingRevise(false); 
       setIsProcessingPolish(false); 
    }
  };

  // AUDIO UTILITIES
  const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const playSpeech = async (base64: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = await decodeAudioData(base64, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsAcousticActive(false);
      setIsAcousticActive(true);
      source.start();
    } catch (e) {
      console.error("Playback Failure:", e);
      setIsAcousticActive(false);
    }
  };

  const handleArticulate = async () => {
    if (!activeChapter.content?.trim()) return;
    setIsProcessingArticulate(true);
    try {
      const result = await articulateText(activeChapter.content, { gender, tone, accent, speed, isClone: isCloneActive }, style, region);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
      
      const voice = isCloneActive ? 'Zephyr' : (gender === 'Female' ? 'Puck' : 'Kore');
      const audioBase64 = await generateSpeech(result.text.substring(0, 600), voice);
      await playSpeech(audioBase64);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Acoustic Transformation Failure. Diagnostic: ${err.message}` }]);
    } finally {
      setIsProcessingArticulate(false);
    }
  };

  const startCalibration = async () => {
    if (!isCloneCalibrated) setShowCalibrationModal(true);
    else setIsCloneActive(!isCloneActive);
  };

  const flipScript = () => {
    setActiveScriptIndex((prev) => (prev + 1) % CALIBRATION_SCRIPTS.length);
  };

  const performCalibration = async () => {
    setCalibrationProgress(1);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Sequence increased to 45 seconds for high-fidelity character extraction
      const totalDuration = 45000; 
      const intervalTime = 500;
      const step = (intervalTime / totalDuration) * 100;
      
      const interval = setInterval(() => {
        setCalibrationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            stream.getTracks().forEach(t => t.stop());
            ctx.close();
            writeJson('aca_clone_calibrated', true);
            setIsCloneCalibrated(true);
            setIsCloneActive(true);
            setShowCalibrationModal(false);
            return 100;
          }
          return Math.min(prev + step, 100);
        });
      }, intervalTime);
    } catch (e) {
      alert("Calibration failed: Mic access required.");
      setShowCalibrationModal(false);
    }
  };

  const startDictation = async (target: 'sheet' | 'partner') => {
    if (isDictating) { stopDictation(); return; }
    setDictationTarget(target);
    setIsDictating(true);
    
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } });
      
      const sessionPromise = connectLive({
          onopen: () => {
            const source = ctx.createMediaStreamSource(stream);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const base64 = encode(new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(ctx.destination);
          },
          onmessage: (msg: LiveServerMessage) => {
            const text = msg.serverContent?.inputTranscription?.text;
            if (text) {
              if (target === 'sheet') {
                setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: c.content + ' ' + text } : c));
              } else {
                setPartnerInput(prev => prev + ' ' + text);
              }
            }
          },
          onclose: () => setIsDictating(false),
          onerror: (e: any) => {
             console.error("Dictation Error", e);
             stopDictation();
          }
        }, "Transcribe precisely. Maintain carceral grit.");
      
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      console.error(err);
      setIsDictating(false); 
      alert("Microphone Access Denied.");
    }
  };

  const stopDictation = () => {
    if (sessionRef.current) try { sessionRef.current.close(); } catch (e) {}
    if (audioContextRef.current) try { audioContextRef.current.close(); } catch (e) {}
    setIsDictating(false);
    setDictationTarget(null);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden">
      <aside style={{ width: `${navWidth}px` }} className="border-r border-white/10 bg-[#080808] flex flex-col shrink-0 transition-all relative pt-20">
        <div className="px-8 mb-6 space-y-4">
           <button onClick={handleNewSheet} className="w-full py-3 animate-living-amber-bg text-white text-[9px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-xl rounded-sm">
             + New Sheet
           </button>
           <Link to="/live-protocol" className="w-full py-3 border border-[var(--accent)]/40 text-[var(--accent)] text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-all rounded-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></div>
             LIVE LINK
           </Link>
        </div>
        <div className="px-8 py-5 bg-white/5 border-y border-white/10 flex flex-col gap-1" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Currently Editing</span>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white truncate">{activeChapter.title || 'Untitled Draft'}</p>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {chapters.filter(c => c.id !== activeChapterId).map(c => (
            <div key={c.id} onClick={() => setActiveChapterId(c.id)} className="py-5 px-10 cursor-pointer border-l-4 border-transparent text-gray-700 hover:bg-white/5 hover:text-gray-400 transition-all">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] truncate">{c.title || 'Untitled Draft'}</p>
            </div>
          ))}
        </div>
        <div className="p-8 border-t border-white/10 bg-black/60">
           <button onClick={handleSaveToVault} className="w-full py-3 border border-dashed border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-700 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all">
             Save all to Vault
           </button>
        </div>
      </aside>

      <div onMouseDown={() => { isResizingNav.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1 bg-white/5 hover:bg-[var(--accent)] cursor-ew-resize z-50 transition-colors"></div>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-[#020202]">
        <div className="shrink-0 h-24 bg-black flex items-stretch border-b border-white/10 relative z-50">
            {/* Write */}
            <div className={`flex-1 group/write relative cursor-pointer transition-all border-r border-white/5 ${isProcessingWrite ? 'bg-amber-500/10' : 'hover:bg-white/[0.02]'}`}>
               <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${isProcessingWrite ? 'neon-border-amber' : 'border border-transparent group-hover/write:border-[var(--accent)]/40'}`}></div>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[13px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${isProcessingWrite ? 'text-[var(--accent)] animate-industrial-pulse' : 'text-gray-700 group-hover/write:text-[var(--accent)]'}`}>
                    <span className="text-xl">W</span>rite
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-[var(--accent)] shadow-[0_25px_60px_rgba(0,0,0,1)] z-[100] opacity-0 invisible group-hover/write:opacity-100 group-hover/write:visible translate-y-2 group-hover/write:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)] hover:bg-white/5 border-b border-white/5 transition-colors">Import Docs</button>
                  <button onClick={() => startDictation('sheet')} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest border-b border-white/5 transition-colors ${dictationTarget === 'sheet' ? 'animate-pulse text-[var(--accent)]' : 'text-white/40 hover:text-[var(--accent)]'}`}>
                    {dictationTarget === 'sheet' ? 'Recording...' : 'Dictation'}
                  </button>
                  <button onClick={() => handleSoap('dogg_me', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)] hover:bg-white/5 border-b border-white/5 transition-colors">Dogg Me</button>
               </div>
            </div>

            {/* Revise */}
            <div className={`flex-1 group/revise relative cursor-pointer transition-all border-r border-white/5 ${isProcessingRevise ? 'bg-red-900/10' : 'hover:bg-white/[0.02]'}`}>
               <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${isProcessingRevise ? 'neon-border-red' : 'border border-transparent group-hover/revise:border-red-600/40'}`}></div>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[13px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${isProcessingRevise ? 'text-red-500 animate-industrial-pulse' : 'text-gray-700 group-hover/revise:text-red-500'}`}>
                    <span className="text-xl">R</span>evise
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-red-600 shadow-[0_25px_60px_rgba(0,0,0,1)] z-[100] opacity-0 invisible group-hover/revise:opacity-100 group-hover/revise:visible translate-y-2 group-hover/revise:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('rinse', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 border-b border-white/5 transition-colors">Rinse</button>
                  <button onClick={() => handleSoap('wash', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 border-b border-white/5 transition-colors">Wash</button>
                  <button onClick={() => handleSoap('scrub', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Scrub</button>
                  <button onClick={() => handleSoap('fact_check', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 transition-colors">Fact Check</button>
               </div>
            </div>

            {/* Articulate */}
            <div className={`flex-1 group/articulate relative cursor-pointer transition-all border-r border-white/5 ${isProcessingArticulate ? 'bg-blue-900/10' : 'hover:bg-white/[0.02]'}`}>
               <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${isProcessingArticulate ? 'neon-border-blue' : 'border border-transparent group-hover/articulate:border-blue-500/40'}`}></div>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[13px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${isProcessingArticulate ? 'text-blue-500 animate-industrial-pulse' : 'text-gray-700 group-hover/articulate:text-blue-500'}`}>
                    <span className="text-xl">A</span>rticulate
                  </span>
               </div>
               <div className="absolute top-full left-0 w-80 bg-black border border-blue-500 shadow-[0_25px_60px_rgba(0,0,0,1)] z-[100] opacity-0 invisible group-hover/articulate:opacity-100 group-hover/articulate:visible translate-y-2 group-hover/articulate:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <div className="p-6 space-y-6 bg-black/90">
                     <button onClick={startCalibration} className={`w-full text-center py-3 border text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${isCloneActive ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white'}`}>
                        {isCloneCalibrated ? (isCloneActive ? 'Clone Voice: Active' : 'Engage My Own Clone') : 'Calibrate My Own Clone'}
                     </button>
                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Gender Matrix</p>
                        <div className="flex gap-2">
                           {['Male', 'Female', 'Neutral'].map(g => (
                              <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${gender === g ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-white/10 text-gray-600 hover:text-white'}`}>{g[0]}</button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Calibration Tone</p>
                        <div className="flex gap-2">
                           {['Soft', 'Normal', 'Loud'].map(t => (
                              <button key={t} onClick={() => setTone(t)} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${tone === t ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-white/10 text-gray-600 hover:text-white'}`}>{t[0]}</button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Regional Accent</p>
                        <div className="flex gap-2">
                           {['AU', 'UK', 'US'].map(a => (
                              <button key={a} onClick={() => setAccent(a)} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${accent === a ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-white/10 text-gray-600 hover:text-white'}`}>{a}</button>
                           ))}
                        </div>
                     </div>
                     <button onClick={handleArticulate} className="w-full py-4 bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-600 transition-all rounded-sm shadow-xl relative overflow-hidden">
                       {isAcousticActive ? (
                         <div className="flex items-center justify-center gap-2">
                            <div className="w-1 h-3 bg-white animate-pulse"></div>
                            <div className="w-1 h-5 bg-white animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <span>AUDITIONING...</span>
                         </div>
                       ) : 'Apply Transformation'}
                     </button>
                  </div>
               </div>
            </div>

            {/* Polish */}
            <div className={`flex-1 group/polish relative cursor-pointer transition-all ${isProcessingPolish ? 'bg-green-900/10' : 'hover:bg-white/[0.02]'}`}>
               <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${isProcessingPolish ? 'neon-border-green' : 'border border-transparent group-hover/polish:border-green-500/40'}`}></div>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[13px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${isProcessingPolish ? 'text-green-500 animate-industrial-pulse' : 'text-gray-700 group-hover/polish:text-green-500'}`}>
                    <span className="text-xl">P</span>olish
                  </span>
               </div>
               <div className="absolute top-full right-0 w-64 bg-black border border-green-500 shadow-[0_25px_60px_rgba(0,0,0,1)] z-[100] opacity-0 invisible group-hover/polish:opacity-100 group-hover/polish:visible translate-y-2 group-hover/polish:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('polish_story', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish story</button>
                  <button onClick={() => handleSoap('polish_poetry', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish poetry</button>
                  <button onClick={() => handleSoap('sanitise', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Sanitise</button>
               </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar bg-[#020202]">
          <div className="py-4 bg-[#030303]/40 border-b border-white/5">
             <div className="max-w-4xl px-12">
               <input 
                 ref={titleInputRef}
                 type="text" 
                 value={activeChapter.title}
                 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), contentInputRef.current?.focus())}
                 onChange={(e) => setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: e.target.value } : c))} 
                 className="w-full bg-transparent border-none outline-none focus:ring-0 text-white text-3xl md:text-5xl font-serif italic placeholder:text-white/10 tracking-tighter"
                 placeholder="Untitled Draft..."
               />
             </div>
          </div>
          <div className="px-12 py-6 flex flex-grow">
            <div className="max-w-4xl w-full flex flex-col flex-grow">
               <textarea 
                 ref={contentInputRef}
                 value={activeChapter.content} 
                 onChange={(e) => setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: e.target.value } : c))} 
                 className="w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-500 text-2xl font-serif leading-[1.8] placeholder:text-white/5" 
                 placeholder="Forge your truth..." 
               />
            </div>
          </div>
        </div>

        <div className="h-10 px-12 bg-black border-t border-white/10 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-gray-800">
           <div className="flex gap-12 items-center">
              <span>Words: {wordCount}</span>
              <span>Context: {region}</span>
              <span>Style: {style}</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isSaving ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'}`}></div>
                <span className={`text-[7px] font-bold ${isSaving ? 'text-amber-500' : 'text-cyan-500'}`}>{isSaving ? 'SYNCING...' : 'VAULT SECURED'}</span>
              </div>
           </div>
           <span>Forge v7.5 Alchemist</span>
        </div>
      </main>

      <div onMouseDown={() => { isResizingPartner.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1 bg-white/5 hover:bg-[var(--accent)] cursor-ew-resize z-50 transition-colors"></div>

      <aside className="border-l border-white/10 bg-[#080808] flex flex-col shrink-0 relative transition-all" style={{ width: `${partnerWidth}px` }}>
        <div className="p-10 border-b border-white/10 bg-black">
           <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.6em]" style={{ color: 'var(--accent)' }}>WRAP Partner</h3>
             </div>
             <button onClick={() => navigate('/live-link')} className="px-4 py-2 text-[8px] font-black uppercase tracking-[0.4em] border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all rounded-sm flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse"></div>
                LIVE LINK
             </button>
           </div>
        </div>

        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-12 space-y-12 custom-scrollbar bg-black/40">
           {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center opacity-10 italic font-serif px-12 text-3xl">"Listening."</div>}
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] p-10 rounded-sm text-[16px] font-serif italic leading-[1.8] ${m.role === 'user' ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-white/5 text-gray-300 border border-white/10'}`} style={m.role !== 'user' ? { backgroundColor: 'rgba(var(--accent-rgb), 0.05)', borderColor: 'rgba(var(--accent-rgb), 0.1)' } : {}}>
                  {m.content}
                </div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] animate-pulse uppercase tracking-[0.6em] px-8" style={{ color: 'var(--accent)' }}>Engaging...</div>}
        </div>

        <form onSubmit={handlePartnerChat} className="p-10 bg-black border-t border-white/10 space-y-4">
            <div className="relative group">
              <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Message Partner..." className="w-full bg-[#030303] border border-white/10 p-6 pr-14 text-[14px] font-serif italic text-white focus:border-[var(--accent)] outline-none h-32 rounded-sm resize-none transition-all" />
              <button type="button" onClick={() => startDictation('partner')} className={`absolute right-4 bottom-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${dictationTarget === 'partner' ? 'bg-[var(--accent)] text-white animate-pulse' : 'bg-white/5 text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            </div>
            <button type="submit" disabled={isPartnerLoading || !partnerInput.trim()} className="w-full py-4 animate-living-amber-bg text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-sm disabled:opacity-30">
              Shoot it over
            </button>
         </form>
      </aside>

      {/* CLONE CALIBRATION MODAL */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-[5000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="max-w-2xl w-full bg-[#0a0a0a] border border-blue-500/30 p-12 rounded-sm shadow-[0_0_100px_rgba(59,130,246,0.1)] relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
              <button onClick={() => setShowCalibrationModal(false)} className="absolute top-6 right-6 text-gray-700 hover:text-white text-2xl leading-none">×</button>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <span className="text-blue-500 tracking-[0.8em] uppercase text-[9px] font-black block">Calibration Protocol v2.3</span>
                  <h2 className="text-5xl font-serif font-black italic text-white tracking-tighter leading-none">Acoustic <br/><span className="text-blue-500">Mirror.</span></h2>
                  <p className="text-gray-500 text-sm italic font-light leading-relaxed max-w-sm mx-auto">
                    "Read the quote below clearly for 45 seconds to anchor your vocal signature into the Sovereign Engine."
                  </p>
                </div>

                <div className="relative group">
                  <div className="p-10 bg-black/60 border border-blue-500/10 rounded-sm italic font-serif text-xl text-blue-100 leading-relaxed shadow-inner min-h-[160px] flex items-center justify-center">
                    "{CALIBRATION_SCRIPTS[activeScriptIndex].text}"
                  </div>
                  {calibrationProgress === 0 && (
                    <button 
                      onClick={flipScript}
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#111] border border-blue-500/40 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-full hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Flip the Script
                    </button>
                  )}
                </div>

                <div className="space-y-6 pt-4">
                  {calibrationProgress === 0 ? (
                    <button onClick={performCalibration} className="w-full py-6 bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:brightness-110 transition-all rounded-sm">
                      Initialize Recording
                    </button>
                  ) : (
                    <div className="space-y-4">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-blue-500">
                          <span>Hardening Signature...</span>
                          <span>{Math.round(calibrationProgress)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${calibrationProgress}%` }}></div>
                       </div>
                       <p className="text-[8px] text-gray-700 uppercase tracking-widest">Maintain consistent cadence. 45s threshold active.</p>
                    </div>
                  )}
                </div>
              </div>
           </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.txt" onChange={handleFileImport} />
    </div>
  );
};

export default AuthorBuilder;
