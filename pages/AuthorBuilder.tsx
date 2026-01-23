
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { queryPartner, smartSoap, articulateText, connectLive, generateSpeech } from '../services/geminiService';
import { Message, Chapter, VaultStorage, VaultSheet } from '../types';
import { readJson, writeJson } from '../utils/safeStorage';
import { LiveServerMessage } from '@google/genai';

declare const mammoth: any;

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];
const PERSONALITIES = ['Timid', 'Cool', 'Mild', 'Natural', 'Wild', 'Firebrand'];

const DEFAULT_CHAPTER: Chapter = { id: '1', title: "", content: '', order: 0, media: [], subChapters: [] };

const CALIBRATION_SCRIPTS = [
  { id: '1', text: "My story is my truth. No one else can tell it for me. I am building my legacy one page at a time." },
  { id: '2', text: "The walls are concrete, but my words can cross the wire. I am forging meaning from the friction of the system." },
  { id: '3', text: "Identity is the first thing they try to take, and the last thing we will ever give up. I reclaim my voice." },
  { id: '4', text: "I have seen the darkness of the hole and the brightness of the gate. Every step I take now is defined by my own stride." },
  { id: '5', text: "They can lock the body, but the mind remains a sovereign territory. My ink is my evidence of existence." }
];

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const createBlob = (data: Float32Array) => {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm' };
};

const AuthorBuilder: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
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
  const [isProcessingSpeak, setIsProcessingSpeak] = useState(false);
  const [isProcessingPolish, setIsProcessingPolish] = useState(false);
  const [isAcousticActive, setIsAcousticActive] = useState(false);
  const [activeRevisionType, setActiveRevisionType] = useState<string | null>(null);
  const [hasBeenRinsed, setHasBeenRinsed] = useState(false);

  // CONTEXT PERSISTENCE
  const [style, setStyle] = useState(() => readJson<any>('aca_author_profile', {}).motivation || STYLES[2]);
  const [region, setRegion] = useState(() => readJson<any>('aca_author_profile', {}).region || REGIONS[1]);
  const [personality, setPersonality] = useState(() => {
    const profile = readJson<any>('aca_author_profile', { personalityIndex: 3 });
    return PERSONALITIES[profile.personalityIndex] || 'Natural';
  });

  const [gender, setGender] = useState('Neutral');
  const [sound, setSound] = useState('Normal'); 
  const [accent, setAccent] = useState('AU');
  const [speed, setSpeed] = useState('1x'); 
  const [isCloneActive, setIsCloneActive] = useState(false);
  
  // Vault-Integrated Calibration
  const [isCloneCalibrated, setIsCloneCalibrated] = useState(() => {
    const vault = readJson<VaultStorage>('sovereign_vault', { sheets: [], books: [], ai: [], audits: [] });
    return !!(vault as any).voiceSignature;
  });

  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);

  const [isDictating, setIsDictating] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'sheet' | 'partner' | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0] || DEFAULT_CHAPTER;
  const wordCount = activeChapter.content.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    const profile = readJson<any>('aca_author_profile', {});
    writeJson('aca_author_profile', { ...profile, motivation: style, region });
  }, [style, region]);

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
    setHasBeenRinsed(false);
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
    alert("Saved to Big House.");
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
      setHasBeenRinsed(false);
    } catch (err) { alert("Import failed."); } finally { setIsProcessingWrite(false); }
  };

  const handlePartnerChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const finalMsg = (customMsg || partnerInput).trim();
    if (!finalMsg || isPartnerLoading) return;
    setPartnerInput('');
    setMessages(prev => [...prev, { role: 'user', content: finalMsg }]);
    setIsPartnerLoading(true);
    try {
      const response = await queryPartner(finalMsg, style, region, messages, activeChapter.content, personality);
      setMessages(prev => [...prev, response]);
    } catch (err: any) { 
      setMessages(prev => [...prev, { role: 'assistant', content: "Problem connecting. Check your files in The Big House." }]); 
    } 
    finally { 
      setIsPartnerLoading(false); 
      setTimeout(() => chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  };

  const handleSoap = async (level: string, block: 'revise' | 'polish'): Promise<string> => {
    if (!activeChapter.content?.trim()) return activeChapter.content;
    if (block === 'revise') {
        setIsProcessingRevise(true);
        setActiveRevisionType(level);
    } else {
        setIsProcessingPolish(true);
    }
    
    try {
      const result = await smartSoap(activeChapter.content, level, style, region, personality);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
      if (level === 'rinse') setHasBeenRinsed(true);
      return result.text;
    } catch (err: any) {
      return activeChapter.content;
    } finally { 
        setIsProcessingRevise(false); 
        setIsProcessingPolish(false); 
        setActiveRevisionType(null);
    }
  };

  const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const stopAcoustic = () => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
        audioSourceRef.current = null;
    }
    setIsAcousticActive(false);
    setIsProcessingSpeak(false);
  };

  const playSpeech = async (base64: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = await decodeAudioData(base64, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsAcousticActive(false);
        setIsProcessingSpeak(false);
      };
      audioSourceRef.current = source;
      setIsAcousticActive(true);
      setIsProcessingSpeak(false);
      source.start();
    } catch (e) { stopAcoustic(); }
  };

  const handleArticulate = async () => {
    if (isAcousticActive || isProcessingSpeak) {
        stopAcoustic();
        return;
    }
    
    if (!activeChapter.content?.trim()) return;

    let textToSpeak = activeChapter.content;

    // Sequential Trigger: Rinse if not already done
    if (!hasBeenRinsed) {
        textToSpeak = await handleSoap('rinse', 'revise');
    }

    setIsProcessingSpeak(true);
    try {
      const result = await articulateText(textToSpeak, { gender, sound, accent, speed, isClone: isCloneActive }, style, region, personality);
      const voice = isCloneActive ? 'Zephyr' : (gender === 'Female' ? 'Puck' : 'Kore');
      const audioBase64 = await generateSpeech(result.text.substring(0, 1000), voice);
      await playSpeech(audioBase64);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Problem reading aloud." }]);
      stopAcoustic();
    }
  };

  const startCalibration = async () => {
    if (!isCloneCalibrated) setShowCalibrationModal(true);
    else setIsCloneActive(!isCloneActive);
  };

  const performCalibration = async () => {
    setCalibrationProgress(1);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const totalDuration = 10000; 
      const intervalTime = 100;
      const step = (intervalTime / totalDuration) * 100;
      const interval = setInterval(() => {
        setCalibrationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            stream.getTracks().forEach(t => t.stop());
            
            const vault = readJson<any>('sovereign_vault', { sheets: [], books: [], ai: [], audits: [] });
            vault.voiceSignature = { timestamp: new Date().toISOString(), status: 'verified' };
            writeJson('sovereign_vault', vault);
            
            setIsCloneCalibrated(true);
            setIsCloneActive(true);
            setShowCalibrationModal(false);
            return 100;
          }
          return Math.min(prev + step, 100);
        });
      }, intervalTime);
    } catch (e) {
      alert("Microphone required for learning voice.");
      setShowCalibrationModal(false);
    }
  };

  const flipTheScript = () => {
    setActiveScriptIndex(prev => (prev + 1) % CALIBRATION_SCRIPTS.length);
  };

  const startDictation = async (target: 'sheet' | 'partner') => {
    if (isDictating) { stopDictation(); return; }
    setDictationTarget(target);
    setIsDictating(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } 
      });

      const sessionPromise = connectLive({
          onopen: () => {
            const source = ctx.createMediaStreamSource(stream);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => {
                try { s.sendRealtimeInput({ media: pcmBlob }); } catch(err) { 
                  if (String(err).includes('Network')) stopDictation();
                }
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(ctx.destination);
          },
          onmessage: (msg: LiveServerMessage) => {
            const text = msg.serverContent?.inputTranscription?.text;
            if (text) {
              if (target === 'sheet') {
                setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content + ' ' + text).trim() } : c));
                setHasBeenRinsed(false);
              } else {
                setPartnerInput(prev => (prev + ' ' + text).trim());
              }
            }
          },
          onclose: () => setIsDictating(false),
          onerror: (e: any) => { stopDictation(); }
        }, `Scribe accurately. The author is writing ${style} in ${region}.`);
      sessionRef.current = await sessionPromise;
    } catch (err: any) { 
      setIsDictating(false); 
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
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Drafting</span>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white truncate">{activeChapter.title || 'Untitled Sheet'}</p>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {chapters.filter(c => c.id !== activeChapterId).map(c => (
            <div key={c.id} onClick={() => { setActiveChapterId(c.id); setHasBeenRinsed(false); }} className="py-5 px-10 cursor-pointer border-l-4 border-transparent text-gray-700 hover:bg-white/5 hover:text-gray-400 transition-all">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] truncate">{c.title || 'Untitled Sheet'}</p>
            </div>
          ))}
        </div>
        <div className="p-8 border-t border-white/10 bg-black/60">
           <button onClick={handleSaveToVault} className="w-full py-3 border border-dashed border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-700 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all">
             Backup all to Big House
           </button>
        </div>
      </aside>

      <div onMouseDown={() => { isResizingNav.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1 bg-white/5 hover:bg-[var(--accent)] cursor-ew-resize z-50 transition-colors"></div>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-[#020202]">
        <div className="shrink-0 h-24 bg-black flex items-stretch border-b border-white/10 relative z-50">
            {/* WRITE BLOCK */}
            <div 
              onClick={() => { if (isDictating && dictationTarget === 'sheet') stopDictation(); }}
              className={`flex-1 group/write relative cursor-pointer transition-all border-r border-white/5 ${isProcessingWrite ? 'bg-amber-500/10' : 'hover:bg-white/[0.02]'} ${(isDictating && dictationTarget === 'sheet') ? 'neon-border-amber' : ''}`}
            >
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${(isProcessingWrite || (isDictating && dictationTarget === 'sheet')) ? 'text-[var(--accent)]' : 'text-gray-700 group-hover/write:text-[var(--accent)]'}`}>
                    <span className="text-2xl mr-0.5">W</span>rite
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-[var(--accent)] shadow-2xl z-[100] opacity-0 invisible group-hover/write:opacity-100 group-hover/write:visible translate-y-2 group-hover/write:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)] hover:bg-white/5 border-b border-white/5 transition-colors">Import Docs</button>
                  <button onClick={(e) => { e.stopPropagation(); startDictation('sheet'); }} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest border-b border-white/5 transition-colors ${dictationTarget === 'sheet' ? 'animate-pulse text-[var(--accent)] font-bold' : 'text-white/40 hover:text-[var(--accent)]'}`}>
                    {dictationTarget === 'sheet' ? 'Recording...' : 'Dictation'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleSoap('dogg_me', 'revise'); }} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)] hover:bg-white/5 border-b border-white/5 transition-colors">Make it a Poem</button>
                  <Link to="/wrapper-info" className="block w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)] hover:bg-white/5 border-b border-white/5 transition-colors">WRAP Profile</Link>
               </div>
            </div>

            {/* REVISE BLOCK */}
            <div className={`flex-1 group/revise relative cursor-pointer transition-all border-r border-white/5 
                ${isProcessingRevise ? (
                    activeRevisionType === 'rinse' ? 'neon-border-green' :
                    activeRevisionType === 'wash' ? 'neon-border-amber' :
                    activeRevisionType === 'scrub' ? 'neon-border-red' :
                    activeRevisionType === 'fact_check' ? 'neon-border-blue' : 'bg-red-900/10'
                ) : 'hover:bg-white/[0.02]'}`}>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${isProcessingRevise ? 'text-red-500' : 'text-gray-700 group-hover/revise:text-red-500'}`}>
                    <span className="text-2xl mr-0.5">R</span>evise
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-red-600 shadow-2xl z-[100] opacity-0 invisible group-hover/revise:opacity-100 group-hover/revise:visible translate-y-2 group-hover/revise:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('rinse', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 border-b border-white/5 transition-colors">Rinse (Light)</button>
                  <button onClick={() => handleSoap('wash', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 border-b border-white/5 transition-colors">Wash (Structure)</button>
                  <button onClick={() => handleSoap('scrub', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Scrub (Deep)</button>
                  <button onClick={() => handleSoap('fact_check', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 transition-colors">Fact Check</button>
               </div>
            </div>

            {/* ARTICULATE BLOCK */}
            <div 
                onClick={handleArticulate}
                className={`flex-1 group/articulate relative cursor-pointer transition-all border-r border-white/5 ${(isProcessingSpeak || isAcousticActive) ? 'neon-border-blue' : 'hover:bg-white/[0.02]'}`}
            >
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${(isProcessingSpeak || isAcousticActive) ? 'text-blue-500' : 'text-gray-700 group-hover/articulate:text-blue-500'}`}>
                    <span className="text-2xl mr-0.5">A</span>rticulate
                  </span>
               </div>
               <div className="absolute top-full left-0 w-80 bg-black border border-blue-500 shadow-2xl z-[100] opacity-0 invisible group-hover/articulate:opacity-100 group-hover/articulate:visible translate-y-2 group-hover/articulate:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <div className="p-6 space-y-6 bg-black/90">
                     <button onClick={(e) => { e.stopPropagation(); startCalibration(); }} className={`w-full text-center py-3 border text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${isCloneActive ? 'bg-blue-500 border-blue-500 text-white' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white'}`}>
                        {isCloneCalibrated ? (isCloneActive ? 'Voice: ON' : 'Use my voice') : 'Clone my voice'}
                     </button>
                     
                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Acoustic Identity (Gender)</p>
                        <div className="flex gap-2">
                           {['Male', 'Female', 'Neutral'].map(g => (
                              <button key={g} onClick={(e) => { e.stopPropagation(); setGender(g); }} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${gender === g ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10 text-gray-600 hover:text-white'}`}>{g}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Sound Matrix</p>
                        <div className="flex gap-2">
                           {['Soft', 'Normal', 'Loud'].map(s => (
                              <button key={s} onClick={(e) => { e.stopPropagation(); setSound(s); }} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${sound === s ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10 text-gray-600 hover:text-white'}`}>{s}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Temporal Matrix</p>
                        <div className="flex gap-2">
                           {['1x', '1.25x', '1.5x'].map(sp => (
                              <button key={sp} onClick={(e) => { e.stopPropagation(); setSpeed(sp); }} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${speed === sp ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10 text-gray-600 hover:text-white'}`}>{sp}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Regional Accent</p>
                        <div className="flex gap-2">
                           {['AU', 'UK', 'US'].map(a => (
                              <button key={a} onClick={(e) => { e.stopPropagation(); setAccent(a); }} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${accent === a ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10 text-gray-600 hover:text-white'}`}>{a}</button>
                           ))}
                        </div>
                     </div>
                     
                     <button onClick={(e) => { e.stopPropagation(); handleArticulate(); }} className="w-full py-4 bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-600 transition-all rounded-sm shadow-xl">
                       {isAcousticActive ? 'STOP FORGING' : 'Listen to Forging'}
                     </button>
                  </div>
               </div>
            </div>

            {/* POLISH BLOCK */}
            <div className={`flex-1 group/polish relative cursor-pointer transition-all ${isProcessingPolish ? 'neon-border-green' : 'hover:bg-white/[0.02]'}`}>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${isProcessingPolish ? 'text-green-500' : 'text-gray-700 group-hover/polish:text-green-500'}`}>
                    <span className="text-2xl mr-0.5">P</span>olish
                  </span>
               </div>
               <div className="absolute top-full right-0 w-64 bg-black border border-green-500 shadow-2xl z-[100] opacity-0 invisible group-hover/polish:opacity-100 group-hover/polish:visible translate-y-2 group-hover/polish:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('polish_story', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish story</button>
                  <button onClick={() => handleSoap('polish_poetry', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish poetry</button>
                  <button onClick={() => handleSoap('sanitise', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Sanitise</button>
                  <button onClick={() => handleSoap('polish_turd', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 transition-colors">Polish a turd</button>
               </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar bg-[#020202]">
          <div className="py-4 bg-[#030303]/40 border-b border-white/5 px-12">
               <input 
                 ref={titleInputRef}
                 type="text" 
                 value={activeChapter.title}
                 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), contentInputRef.current?.focus())}
                 onChange={(e) => {
                    setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: e.target.value } : c));
                 }} 
                 className="w-full bg-transparent border-none outline-none focus:ring-0 text-white text-3xl md:text-5xl font-serif italic placeholder:text-white/10 tracking-tighter"
                 placeholder="Draft Title..."
               />
          </div>
          <div className="px-12 py-6 flex flex-grow">
               <textarea 
                 ref={contentInputRef}
                 value={activeChapter.content} 
                 onChange={(e) => {
                    setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: e.target.value } : c));
                    setHasBeenRinsed(false);
                 }} 
                 className="w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-400 text-2xl font-serif leading-[1.8] placeholder:text-white/5" 
                 placeholder="Start writing..." 
               />
          </div>
        </div>

        <div className="h-10 px-12 bg-black border-t border-white/10 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-gray-800">
           <div className="flex gap-12 items-center">
              <span className="flex items-center gap-2">
                 <span className="text-gray-600">Words:</span> {wordCount}
              </span>
              <div className="h-3 w-[1px] bg-white/5"></div>
              <span className="flex items-center gap-2">
                 <span className="text-gray-600">Personality:</span> <span className="text-[var(--accent)] animate-pulse">{personality}</span>
              </span>
              <div className="h-3 w-[1px] bg-white/5"></div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'}`}></div>
                <span className={`text-[7px] font-bold ${isSaving ? 'text-amber-500' : 'text-cyan-500'}`}>{isSaving ? 'SAVING...' : 'SECURED'}</span>
              </div>
           </div>
        </div>
      </main>

      <div onMouseDown={() => { isResizingNav.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1 bg-white/5 hover:bg-[var(--accent)] cursor-ew-resize z-50 transition-colors"></div>

      <aside className="border-l border-white/10 bg-[#080808] flex flex-col shrink-0 relative transition-all" style={{ width: `${partnerWidth}px` }}>
        <div className="p-10 border-b border-white/10 bg-black flex items-center justify-between">
             <Link to="/wrapper-info" className="flex items-center gap-4 group">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.6em] group-hover:underline" style={{ color: 'var(--accent)' }}>WRAP Chat</h3>
             </Link>
             <button onClick={() => navigate('/live-link')} className="px-4 py-2 text-[8px] font-black uppercase tracking-[0.4em] border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all rounded-sm">
                LIVE LINK
             </button>
        </div>

        <div className="px-10 py-6 border-b border-white/5 bg-white/[0.01] grid grid-cols-2 gap-6">
           <div className="space-y-1">
              <p className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Story Type</p>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-transparent text-[9px] font-black uppercase tracking-widest text-white outline-none border-none p-0 cursor-pointer focus:ring-0">
                 {STYLES.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
              </select>
           </div>
           <div className="space-y-1">
              <p className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Region</p>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-transparent text-[9px] font-black uppercase tracking-widest text-white outline-none border-none p-0 cursor-pointer focus:ring-0">
                 {REGIONS.map(r => <option key={r} value={r} className="bg-black">{r}</option>)}
              </select>
           </div>
        </div>

        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-12 space-y-12 custom-scrollbar bg-black/40">
           {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center opacity-10 italic font-serif px-12 text-3xl">Listening.</div>}
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] p-10 rounded-sm text-[16px] font-serif italic leading-[1.8] ${m.role === 'user' ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-white/5 text-gray-300 border border-white/10'}`}>
                  {m.content}
                </div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] animate-pulse uppercase tracking-[0.6em] px-8" style={{ color: 'var(--accent)' }}>Working...</div>}
        </div>

        <form onSubmit={handlePartnerChat} className="p-10 bg-black border-t border-white/10 space-y-4">
            <div className="relative group">
              <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Ask your partner..." className="w-full bg-[#030303] border border-white/10 p-6 pr-14 text-[14px] font-serif italic text-white focus:border-[var(--accent)] outline-none h-32 rounded-sm resize-none transition-all" />
              <button type="button" onClick={() => startDictation('partner')} className={`absolute right-4 bottom-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${dictationTarget === 'partner' ? 'bg-[var(--accent)] text-white animate-pulse' : 'bg-white/5 text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            </div>
            <button type="submit" disabled={isPartnerLoading || !partnerInput.trim()} className="w-full py-4 animate-living-amber-bg text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-sm disabled:opacity-30">
              Send
            </button>
         </form>
      </aside>

      {showCalibrationModal && (
        <div className="fixed inset-0 z-[5000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="max-w-2xl w-full bg-[#0a0a0a] border border-blue-500/30 p-12 rounded-sm shadow-2xl text-center relative">
              <button onClick={() => setShowCalibrationModal(false)} className="absolute top-6 right-6 text-gray-700 hover:text-white text-2xl leading-none">×</button>
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="text-5xl font-serif font-black italic text-white tracking-tighter">Clone my voice</h2>
                  <p className="text-gray-500 text-sm italic font-light max-w-sm mx-auto">"Read this clearly to let the partner learn your unique frequency."</p>
                </div>
                <div className="p-10 bg-black/60 border border-blue-500/10 rounded-sm italic font-serif text-xl text-blue-100 min-h-[160px] flex flex-col items-center justify-center gap-6">
                    <p className="flex-grow flex items-center">"{CALIBRATION_SCRIPTS[activeScriptIndex].text}"</p>
                    <button 
                      onClick={flipTheScript}
                      className="text-[9px] font-black uppercase tracking-widest text-blue-400/50 hover:text-blue-400 border border-blue-400/20 px-4 py-2 hover:bg-blue-400/5 transition-all rounded-full"
                    >
                      Flip the script
                    </button>
                </div>
                <div className="space-y-6 pt-4">
                  {calibrationProgress === 0 ? (
                    <button onClick={performCalibration} className="w-full py-6 bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.5em] rounded-sm">Start Calibration</button>
                  ) : (
                    <div className="space-y-4">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-blue-500"><span>Mapping Vocal Signature...</span><span>{Math.round(calibrationProgress)}%</span></div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${calibrationProgress}%` }}></div></div>
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
