
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { queryPartner, smartSoap, articulateText, connectLive, generateSpeech, generateImage } from '../services/geminiService';
import { Message, Chapter, VaultStorage, VaultSheet } from '../types';
import { readJson, writeJson } from '../utils/safeStorage';
import { LiveServerMessage } from '@google/genai';
import { useAcousticLink } from '../context/AcousticLinkContext';

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
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
};

const AuthorBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { isActive: isLiveActive, isThinking: isLiveThinking, isOrientation, wrapTranscription, startSession, stopSession: stopLiveSession } = useAcousticLink();
  
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
  
  const [chapters, setChapters] = useState<Chapter[]>(() => readJson<Chapter[]>('wrap_sheets_v4', []));
  const [activeChapterId, setActiveChapterId] = useState(() => chapters[0]?.id || 'initial');
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

  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [activeSceneImage, setActiveSceneImage] = useState<string | null>(null);
  const [showSceneMood, setShowSceneMood] = useState(true);

  // LUMINOUS STROBE SYNC
  const [strobeStage, setStrobeStage] = useState<string | null>(null);
  const strobeTimeoutRef = useRef<number | null>(null);

  // TYPING BUFFER SYNC (Acoustic Ink)
  const transcriptionBufferRef = useRef<string>('');
  const typedCharactersCountRef = useRef<number>(0);
  const [isHeadingComplete, setIsHeadingComplete] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [introJustFinished, setIntroJustFinished] = useState(false);

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
  
  const [isCloneCalibrated, setIsCloneCalibrated] = useState(() => {
    const vault = readJson<any>('sovereign_vault', { sheets: [], books: [], ai: [], audits: [] });
    return !!vault.voiceSignature;
  });
  const [isCloneActive, setIsCloneActive] = useState(isCloneCalibrated);

  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);

  const [isDictating, setIsDictating] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'sheet' | 'partner' | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || (chapters.length > 0 ? chapters[0] : DEFAULT_CHAPTER);
  const wordCount = activeChapter.content.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (chapters.length === 0) {
      const introChapter: Chapter = { id: 'intro-guide', title: "", content: "", order: 0, media: [], subChapters: [] };
      setChapters([introChapter]);
      setActiveChapterId('intro-guide');
    }
  }, []);

  // Transcription Observer: Handling UI Strobe & Typing Buffer
  useEffect(() => {
    const text = wrapTranscription.toLowerCase();
    
    // 1. Handle Luminous UI Sync
    let trigger: string | null = null;
    if (text.includes('write block')) trigger = 'amber';
    else if (text.includes('revise block')) trigger = 'red';
    else if (text.includes('articulate block')) trigger = 'blue';
    else if (text.includes('polish block')) trigger = 'green';
    else if (text.includes('navigator')) trigger = 'cyan';
    else if (text.includes('partner desk')) trigger = 'orange';
    else if (text.includes('wrapp profile')) trigger = 'magenta';

    if (trigger) {
      if (strobeTimeoutRef.current) window.clearTimeout(strobeTimeoutRef.current);
      setStrobeStage(trigger);
      strobeTimeoutRef.current = window.setTimeout(() => setStrobeStage(null), 4000);
    }

    // 2. Feed the transcription buffer for orientation
    if (isOrientation && wrapTranscription) {
        transcriptionBufferRef.current = wrapTranscription;
        
        // Final completion check for strobe
        if (text.includes("orientation complete") || text.includes("anvil is yours")) {
          setIntroJustFinished(true);
        }
    }
  }, [wrapTranscription, isOrientation]);

  // TYPING SPEED CONTROL (Acoustic Ink) - Flows Rap's words onto the page
  useEffect(() => {
    if (!isOrientation) return;

    const typeTimer = setInterval(() => {
        const fullText = transcriptionBufferRef.current;
        if (!fullText || isPausing) return;

        const greeting = "Author, the link is solid.";
        
        if (typedCharactersCountRef.current < fullText.length) {
            const nextCharIndex = typedCharactersCountRef.current + 1;
            const currentSubstr = fullText.substring(0, nextCharIndex);

            if (currentSubstr.length <= greeting.length) {
                // Typying the heading
                setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: currentSubstr } : c));
                typedCharactersCountRef.current = nextCharIndex;
                
                // If heading just finished, trigger dramatic pause
                if (currentSubstr.length === greeting.length) {
                    setIsHeadingComplete(true);
                    setIsPausing(true);
                    setTimeout(() => setIsPausing(false), 2000); // Dramatic 2s pause
                }
            } else if (isHeadingComplete) {
                // Typing the body
                setChapters(prev => prev.map(c => c.id === activeChapterId 
                    ? { ...c, content: currentSubstr.substring(greeting.length).trim() } 
                    : c));
                typedCharactersCountRef.current = nextCharIndex;
            }
        }
    }, 45);

    return () => clearInterval(typeTimer);
  }, [isOrientation, activeChapterId, isHeadingComplete, isPausing]);

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
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    saveTimeoutRef.current = window.setTimeout(() => {
      writeJson('wrap_sheets_v4', chapters);
      setIsSaving(false);
    }, 1000);
  }, [chapters]);

  const handleNewSheet = () => {
    const newId = Date.now().toString(); 
    setChapters(prev => [{ ...DEFAULT_CHAPTER, id: newId, title: "" }, ...prev]); 
    setActiveChapterId(newId);
    setHasBeenRinsed(false);
    setActiveSceneImage(null);
    setIntroJustFinished(false);
    typedCharactersCountRef.current = 0; 
    setIsHeadingComplete(false);
    setIsPausing(false);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const handleWrappChatToggle = async () => {
    if (isLiveActive) {
      stopLiveSession();
    } else {
      // Re-linking always goes through guardrails per user request
      navigate('/live-protocol');
    }
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
    alert("Saved to Big House Vault.");
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
      setMessages(prev => [...prev, { role: 'assistant', content: "Archive link interrupted." }]); 
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

  const handleForgeScene = async () => {
    if (!activeChapter.content?.trim() || isGeneratingScene) return;
    setIsGeneratingScene(true);
    try {
      const result = await generateImage(activeChapter.content.substring(0, 500), true);
      setActiveSceneImage(result.imageUrl);
      setShowSceneMood(true);
    } catch (err) {
      alert("Visualization engine stalled.");
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleArticulate = async () => {
    if (isAcousticActive || isProcessingSpeak) {
        stopAcoustic();
        return;
    }
    if (!activeChapter.content?.trim()) return;
    let textToSpeak = activeChapter.content;
    if (!hasBeenRinsed) textToSpeak = await handleSoap('rinse', 'revise');
    setIsProcessingSpeak(true);
    try {
      const result = await articulateText(textToSpeak, { gender, sound, accent, speed, isClone: isCloneActive }, style, region, personality);
      const voice = isCloneActive ? 'Zephyr' : (gender === 'Female' ? 'Puck' : 'Kore');
      const audioBase64 = await generateSpeech(result.text.substring(0, 1000), voice);
      await playSpeech(audioBase64);
    } catch (err: any) {
      stopAcoustic();
    }
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
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
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

  const startDictation = async (target: 'sheet' | 'partner') => {
    if (isDictating) { stopDictation(); return; }
    setDictationTarget(target);
    setIsDictating(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = connectLive({
          onopen: () => {
            const source = ctx.createMediaStreamSource(stream);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(ctx.destination);
          },
          onmessage: (msg: LiveServerMessage) => {
            const text = msg.serverContent?.inputTranscription?.text;
            if (text) {
              if (target === 'sheet') setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content + ' ' + text).trim() } : c));
              else setPartnerInput(prev => (prev + ' ' + text).trim());
            }
          },
          onclose: () => setIsDictating(false)
        }, "Scribe faithfully.");
      sessionRef.current = await sessionPromise;
    } catch (err: any) { setIsDictating(false); }
  };

  const stopDictation = () => {
    if (sessionRef.current) try { sessionRef.current.close(); } catch (e) {}
    if (audioContextRef.current) try { audioContextRef.current.close(); } catch (e) {}
    setIsDictating(false);
    setDictationTarget(null);
  };

  const anyProcessing = isProcessingWrite || isProcessingRevise || isProcessingSpeak || isProcessingPolish || isGeneratingScene;

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden relative">
      
      {/* GLOBAL STROBE */}
      {(anyProcessing || strobeStage) && (
        <div className={`fixed inset-0 z-[1000] pointer-events-none mix-blend-screen opacity-10 transition-all duration-300
          ${(isProcessingWrite || strobeStage === 'amber') ? 'animate-global-strobe-amber' : ''}
          ${(isProcessingRevise || strobeStage === 'red') ? 'animate-global-strobe-red' : ''}
          ${(isProcessingSpeak || strobeStage === 'blue') ? 'animate-global-strobe-blue' : ''}
          ${(isProcessingPolish || strobeStage === 'green') ? 'animate-global-strobe-green' : ''}
          ${(strobeStage === 'cyan') ? 'animate-global-strobe-cyan' : ''}
          ${(strobeStage === 'orange') ? 'animate-global-strobe-orange' : ''}
          ${(strobeStage === 'magenta') ? 'animate-global-strobe-magenta' : ''}
        `}></div>
      )}

      {/* ATMOSPHERIC SCENE */}
      {activeSceneImage && showSceneMood && (
        <div className="absolute inset-0 z-0 animate-mood-fade-in pointer-events-none">
           <img src={activeSceneImage} className="w-full h-full object-cover opacity-[0.28] grayscale brightness-[0.35] blur-[10px] scale-[1.05]" alt="Scene Mood" />
           <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-transparent to-[#020202] opacity-90"></div>
           <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
        </div>
      )}

      {/* WRAP HUD (Hidden HUD during Orientation because it's on the Sheet) */}
      {isLiveActive && !isOrientation && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-2xl px-6 animate-fade-in pointer-events-none">
           <div className="bg-black/60 backdrop-blur-3xl border border-[var(--accent)]/20 p-6 rounded-sm shadow-none flex items-center gap-8 pointer-events-auto border-b-2 border-b-[var(--accent)]/40">
              <div className="relative w-12 h-12 shrink-0">
                 <div className="absolute inset-0 bg-[var(--accent)] rounded-full animate-ping opacity-10"></div>
                 <div className={`w-full h-full rounded-full border-2 border-[var(--accent)]/40 flex items-center justify-center ${isLiveThinking ? 'animate-spin border-dashed' : 'animate-pulse'}`}>
                    <div className="w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"></div>
                 </div>
              </div>
              <div className="flex-grow">
                 <div className="flex items-center gap-3 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--accent)] opacity-50">Acoustic Link Matrix</span>
                    <div className="h-[1px] flex-grow bg-white/5"></div>
                 </div>
                 <p className="text-lg font-serif italic text-white/90 leading-tight">"{wrapTranscription || "Observing Architect..."}"</p>
              </div>
              <button onClick={stopLiveSession} className="p-3 text-gray-700 hover:text-red-500 transition-colors pointer-events-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
           </div>
        </div>
      )}

      {/* NAVIGATOR SIDEBAR */}
      <aside 
        style={{ width: `${navWidth}px` }} 
        className={`border-r border-white/10 bg-[#080808]/90 backdrop-blur-xl flex flex-col shrink-0 transition-all relative pt-20 z-50 
          ${strobeStage === 'cyan' ? 'bg-cyan-500/20 border-r-cyan-500 shadow-[inset_-20px_0_60px_rgba(6,182,212,0.3)] scale-[1.01]' : ''}`}
      >
        <div className="px-8 mb-6 space-y-4">
           <button 
             onClick={handleNewSheet} 
             className={`w-full py-3 text-white text-[9px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-xl rounded-sm ${introJustFinished ? 'animate-intro-finish-strobe' : 'animate-living-amber-bg'}`}
           >
             + New Sheet
           </button>
           
           <button 
             onClick={handleWrappChatToggle}
             className={`w-full py-3 border border-[var(--accent)]/40 text-[var(--accent)] text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-all rounded-sm ${isLiveActive ? 'bg-[var(--accent)]/20 text-white border-[var(--accent)]' : ''}`}
           >
             {isLiveActive ? 'DISCONNECT CHAT' : 'WRAPP CHAT'}
           </button>
        </div>
        <div className="px-8 py-5 bg-white/5 border-y border-white/10 flex flex-col gap-1" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="text-[7px] font-black uppercase tracking-widest text-[var(--accent)]">Current Sheet</span>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white truncate">{activeChapter.title || 'Untitled Sheet'}</p>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {chapters.filter(c => c.id !== activeChapterId).map(c => (
            <div key={c.id} onClick={() => { setActiveChapterId(c.id); setActiveSceneImage(null); }} className={`py-5 px-10 cursor-pointer border-l-4 border-transparent text-gray-700 hover:bg-white/5 hover:text-gray-400 transition-all`}>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] truncate">{c.title || 'Untitled Sheet'}</p>
            </div>
          ))}
        </div>
        <div className="p-8 border-t border-white/10 bg-black/60 space-y-3">
           <button onClick={handleSaveToVault} className="w-full py-3 border border-dashed border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-700 hover:text-[var(--accent)] transition-all">
             Backup to Vault
           </button>
           <Link to="/sovereign-vault" className="block text-center text-[7px] text-gray-800 uppercase font-black hover:text-cyan-500 transition-all">Sovereign Registry</Link>
        </div>
      </aside>

      {/* MOVEABLE ORANGE LINE (NAV) */}
      <div onMouseDown={() => { isResizingNav.current = true; }} className="w-1 bg-white/5 hover:bg-orange-500 cursor-ew-resize z-[60] transition-colors relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-12 bg-orange-500/20 rounded-full blur-md opacity-0 hover:opacity-100 transition-opacity"></div>
      </div>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-transparent z-40 pt-16">
        <div className="shrink-0 h-24 bg-black/40 backdrop-blur-md flex items-stretch border-b border-white/10 relative z-50">
            {/* WRITE BLOCK */}
            <div className={`flex-1 group/write relative cursor-pointer transition-all border-r border-white/5 ${strobeStage === 'amber' ? 'bg-orange-500/40 border-b-8 border-b-orange-500 shadow-[inset_0_0_80px_rgba(245,158,11,0.5)] scale-[1.02]' : 'hover:bg-white/[0.02]'}`}>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${strobeStage === 'amber' ? 'text-orange-500 scale-125' : 'text-gray-700 group-hover/write:text-orange-500'}`}>
                    <span className="text-2xl mr-0.5">{isProcessingWrite ? '...' : 'W'}</span>rite
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-orange-500 shadow-2xl z-[100] opacity-0 invisible group-hover/write:opacity-100 group-hover/write:visible translate-y-2 group-hover/write:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 hover:bg-white/5 border-b border-white/5 transition-colors">Import Files</button>
                  <button onClick={() => startDictation('sheet')} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest border-b border-white/5 transition-colors ${dictationTarget === 'sheet' ? 'text-orange-500 animate-pulse' : 'text-white/40 hover:text-orange-500'}`}>Dictation</button>
                  <button onClick={handleForgeScene} disabled={isGeneratingScene} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest border-b border-white/5 transition-colors ${isGeneratingScene ? 'text-orange-500 animate-pulse' : 'text-white/40 hover:text-orange-500'}`}>Manifest Scene</button>
                  <button onClick={() => handleSoap('dogg_me', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 transition-colors">Dogg Me (Poetry)</button>
               </div>
            </div>

            {/* REVISE BLOCK */}
            <div className={`flex-1 group/revise relative cursor-pointer transition-all border-r border-white/5 ${strobeStage === 'red' ? 'bg-red-500/40 border-b-8 border-b-red-500 shadow-[inset_0_0_80px_rgba(231,76,60,0.5)] scale-[1.02]' : 'hover:bg-white/[0.02]'}`}>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${strobeStage === 'red' ? 'text-red-500 scale-125' : 'text-gray-700 group-hover/revise:text-red-500'}`}>
                    <span className="text-2xl mr-0.5">{isProcessingRevise ? '...' : 'R'}</span>evise
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-red-500 shadow-2xl z-[100] opacity-0 invisible group-hover/revise:opacity-100 group-hover/revise:visible translate-y-2 group-hover/revise:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('rinse', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 border-b border-white/5 transition-colors">Rinse (Typos)</button>
                  <button onClick={() => handleSoap('wash', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 border-b border-white/5 transition-colors">Wash (Structure)</button>
                  <button onClick={() => handleSoap('scrub', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Scrub (Deep)</button>
                  <button onClick={() => handleSoap('fact_check', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 transition-colors">Fact Check</button>
               </div>
            </div>

            {/* ARTICULATE BLOCK */}
            <div className={`flex-1 group/articulate relative cursor-pointer transition-all border-r border-white/5 ${strobeStage === 'blue' ? 'bg-blue-500/40 border-b-8 border-b-blue-500 shadow-[inset_0_0_80px_rgba(52,152,219,0.5)] scale-[1.02]' : 'hover:bg-white/[0.02]'}`}>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${strobeStage === 'blue' ? 'text-blue-500 scale-125' : 'text-gray-700 group-hover/articulate:text-blue-500'}`}>
                    <span className="text-2xl mr-0.5">{isProcessingSpeak ? '...' : 'A'}</span>rticulate
                  </span>
               </div>
               <div className="absolute top-full left-0 w-80 bg-black border border-blue-500 shadow-2xl z-[100] opacity-0 invisible group-hover/articulate:opacity-100 group-hover/articulate:visible translate-y-2 group-hover/articulate:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <div className="p-6 space-y-6 bg-black/95">
                     <button onClick={() => setShowCalibrationModal(true)} className={`w-full py-3 border text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${isCloneActive ? 'bg-blue-500 border-blue-500 text-white' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}`}>
                        {isCloneCalibrated ? (isCloneActive ? 'Vocal Identity: Active' : 'Enable My Voice') : 'Clone My Voice'}
                     </button>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Gender</p>
                           <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-black border border-white/10 text-[9px] font-black uppercase p-2 text-blue-400 outline-none">
                              {['Male', 'Female', 'Neutral'].map(g => <option key={g} value={g}>{g}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Matrix</p>
                           <select value={sound} onChange={(e) => setSound(e.target.value)} className="w-full bg-black border border-white/10 text-[9px] font-black uppercase p-2 text-blue-400 outline-none">
                              {['Soft', 'Normal', 'Loud'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Accent</p>
                           <select value={accent} onChange={(e) => setAccent(e.target.value)} className="w-full bg-black border border-white/10 text-[9px] font-black uppercase p-2 text-blue-400 outline-none">
                              {['AU', 'UK', 'US'].map(a => <option key={a} value={a}>{a}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Speed</p>
                           <select value={speed} onChange={(e) => setSpeed(e.target.value)} className="w-full bg-black border border-white/10 text-[9px] font-black uppercase p-2 text-blue-400 outline-none">
                              {['1x', '1.25x', '1.5x'].map(sp => <option key={sp} value={sp}>{sp}</option>)}
                           </select>
                        </div>
                     </div>

                     <button onClick={handleArticulate} className="w-full py-4 bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-600 transition-all rounded-sm shadow-xl">
                       {isAcousticActive ? 'Stop Forging' : 'Vocalize Forge'}
                     </button>
                  </div>
               </div>
            </div>

            {/* POLISH BLOCK */}
            <div className={`flex-1 group/polish relative cursor-pointer transition-all ${strobeStage === 'green' ? 'bg-green-500/40 border-b-8 border-b-green-500 shadow-[inset_0_0_80px_rgba(46,204,113,0.5)] scale-[1.02]' : 'hover:bg-white/[0.02]'}`}>
               <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <span className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 ${strobeStage === 'green' ? 'text-green-500 scale-125' : 'text-gray-700 group-hover/polish:text-green-500'}`}>
                    <span className="text-2xl mr-0.5">{isProcessingPolish ? '...' : 'P'}</span>olish
                  </span>
               </div>
               <div className="absolute top-full right-0 w-64 bg-black border border-green-500 shadow-2xl z-[100] opacity-0 invisible group-hover/polish:opacity-100 group-hover/polish:visible translate-y-2 group-hover/polish:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('polish_story', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish Story</button>
                  <button onClick={() => handleSoap('polish_poetry', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish Poetry</button>
                  <button onClick={() => handleSoap('sanitise', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Sanitise PII</button>
                  <button onClick={() => handleSoap('polish_turd', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 transition-colors">Polish a Turd</button>
               </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar">
          <div className="py-4 bg-[#030303]/40 border-b border-white/5 px-12">
               <input 
                 ref={titleInputRef}
                 type="text" 
                 value={activeChapter.title}
                 onChange={(e) => setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: e.target.value } : c))} 
                 className={`w-full bg-transparent border-none outline-none focus:ring-0 text-white text-3xl md:text-5xl font-serif italic placeholder:text-white/10 tracking-tighter transition-all duration-700 ${isPausing ? 'animate-intro-heading-glow text-orange-500' : isOrientation ? 'text-[var(--accent)] opacity-80' : ''}`}
                 placeholder={isOrientation ? "" : "Draft Title..."}
                 readOnly={isOrientation}
               />
          </div>
          <div className="px-12 py-6 flex flex-grow relative">
               {activeSceneImage && (
                 <div className="hidden lg:block absolute right-12 top-6 w-48 animate-polaroid-entry group z-20">
                    <div className="bg-white p-2 pb-10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] -rotate-3 transition-all hover:rotate-0 hover:scale-110 cursor-pointer border border-white/10 relative">
                       <img src={activeSceneImage} className="w-full h-auto grayscale-[0.2] group-hover:grayscale-0 transition-all" alt="Scene Polaroid" />
                       <div className="absolute bottom-2 left-0 w-full text-center text-[8px] text-gray-500 font-serif italic tracking-tighter">Scene Manifested.</div>
                       <button onClick={() => setShowSceneMood(!showSceneMood)} className="absolute top-2 right-2 bg-black/80 text-white w-5 h-5 rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">👁</button>
                    </div>
                 </div>
               )}
               <textarea 
                 ref={contentInputRef}
                 value={activeChapter.content} 
                 onChange={(e) => setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: e.target.value } : c))} 
                 className={`w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-300 text-2xl font-serif leading-[2.2] placeholder:text-white/5 relative z-10 transition-all duration-500 ${isOrientation ? 'opacity-80' : ''}`} 
                 placeholder={isOrientation ? "" : "Begin your reclamation..."} 
                 readOnly={isOrientation}
               />
          </div>
        </div>

        <div className="h-10 px-12 bg-black border-t border-white/10 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-gray-800">
           <div className="flex gap-12 items-center">
              <span>Words: {wordCount}</span>
              <div className="h-3 w-[1px] bg-white/5"></div>
              <span>Temperament: <span className="text-[var(--accent)] animate-pulse">{personality}</span></span>
              <div className="h-3 w-[1px] bg-white/5"></div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'}`}></div>
                <span>{isSaving ? 'SAVING...' : 'SECURED'}</span>
              </div>
           </div>
        </div>
      </main>

      <div onMouseDown={() => { isResizingPartner.current = true; }} className="w-1 bg-white/5 hover:bg-orange-500 cursor-ew-resize z-[60] transition-colors relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-12 bg-orange-500/20 rounded-full blur-md opacity-0 hover:opacity-100 transition-opacity"></div>
      </div>

      {/* PARTNER SIDEBAR */}
      <aside 
        className={`border-l border-white/10 bg-[#080808]/90 backdrop-blur-xl flex flex-col shrink-0 relative transition-all z-50
          ${strobeStage === 'orange' ? 'bg-orange-500/20 border-l-orange-500 shadow-[inset_20px_0_60px_rgba(245,158,11,0.3)] scale-[1.01]' : ''}
          ${strobeStage === 'magenta' ? 'bg-purple-500/20 border-l-purple-500 shadow-[inset_20px_0_60px_rgba(168,85,247,0.3)]' : ''}
        `} 
        style={{ width: `${partnerWidth}px` }}
      >
        <div className="p-10 border-b border-white/10 bg-black flex items-center justify-between">
             <Link to="/wrapper-info" className={`flex items-center gap-4 group transition-all ${strobeStage === 'magenta' ? 'scale-110' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${strobeStage === 'magenta' ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-[var(--accent)]'}`}></div>
                <h3 className={`text-[11px] font-black uppercase tracking-[0.6em] group-hover:underline ${strobeStage === 'magenta' ? 'text-purple-500' : ''}`} style={{ color: strobeStage === 'magenta' ? undefined : 'var(--accent)' }}>WRAPP PROFILE</h3>
             </Link>
             <button onClick={() => startDictation('partner')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${dictationTarget === 'partner' ? 'bg-[var(--accent)] text-white animate-pulse' : 'bg-white/5 text-gray-600 hover:text-white'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
            <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Ask Rap..." className="w-full bg-[#030303] border border-white/10 p-6 text-[14px] font-serif italic text-white focus:border-[var(--accent)] outline-none h-32 rounded-sm resize-none transition-all" />
            <button type="submit" disabled={isPartnerLoading || !partnerInput.trim()} className="w-full py-4 animate-living-amber-bg text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-sm disabled:opacity-30 shadow-xl">Send</button>
         </form>
      </aside>

      {showCalibrationModal && (
        <div className="fixed inset-0 z-[5000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="max-w-2xl w-full bg-[#0a0a0a] border border-blue-500/30 p-12 rounded-sm shadow-2xl text-center relative">
              <button onClick={() => setShowCalibrationModal(false)} className="absolute top-6 right-6 text-gray-700 hover:text-white text-2xl leading-none">×</button>
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="text-5xl font-serif font-black italic text-white tracking-tighter">Clone my voice</h2>
                  <p className="text-gray-500 text-sm italic font-light max-w-sm mx-auto">"Read this clearly to let Rap learn your unique frequency."</p>
                </div>
                <div className="p-10 bg-black/60 border border-blue-500/10 rounded-sm italic font-serif text-xl text-blue-100 min-h-[160px] flex flex-col items-center justify-center gap-6">
                    <p className="flex-grow flex items-center">"{CALIBRATION_SCRIPTS[activeScriptIndex].text}"</p>
                    <button onClick={() => setActiveScriptIndex(prev => (prev + 1) % CALIBRATION_SCRIPTS.length)} className="text-[9px] font-black uppercase tracking-widest text-blue-400/50 hover:text-blue-400 border border-blue-400/20 px-4 py-2 transition-all rounded-full">Flip Script</button>
                </div>
                {calibrationProgress === 0 ? (
                  <button onClick={async () => {
                    setCalibrationProgress(1);
                    const interval = setInterval(() => setCalibrationProgress(p => {
                      if (p >= 100) { clearInterval(interval); return 100; }
                      return p + 5;
                    }), 100);
                    setTimeout(() => { setIsCloneCalibrated(true); setIsCloneActive(true); setShowCalibrationModal(false); }, 2500);
                  }} className="w-full py-6 bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.5em] rounded-sm">Start Calibration</button>
                ) : (
                  <div className="space-y-4">
                     <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-blue-500"><span>Mapping Signature...</span><span>{calibrationProgress}%</span></div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${calibrationProgress}%` }}></div></div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes global-strobe-amber { 0%, 100% { background-color: rgba(230, 126, 34, 0); } 50% { background-color: rgba(230, 126, 34, 0.4); } }
        @keyframes global-strobe-red { 0%, 100% { background-color: rgba(231, 76, 60, 0); } 50% { background-color: rgba(231, 76, 60, 0.4); } }
        @keyframes global-strobe-blue { 0%, 100% { background-color: rgba(52, 152, 219, 0); } 50% { background-color: rgba(52, 152, 219, 0.4); } }
        @keyframes global-strobe-green { 0%, 100% { background-color: rgba(46, 204, 113, 0); } 50% { background-color: rgba(46, 204, 113, 0.4); } }
        @keyframes global-strobe-cyan { 0%, 100% { background-color: rgba(6, 182, 212, 0); } 50% { background-color: rgba(6, 182, 212, 0.4); } }
        @keyframes global-strobe-orange { 0%, 100% { background-color: rgba(245, 158, 11, 0); } 50% { background-color: rgba(245, 158, 11, 0.4); } }
        @keyframes global-strobe-magenta { 0%, 100% { background-color: rgba(168, 85, 247, 0); } 50% { background-color: rgba(168, 85, 247, 0.4); } }
        .animate-global-strobe-amber { animation: global-strobe-amber 0.8s infinite ease-in-out; }
        .animate-global-strobe-red { animation: global-strobe-red 0.8s infinite ease-in-out; }
        .animate-global-strobe-blue { animation: global-strobe-blue 0.8s infinite ease-in-out; }
        .animate-global-strobe-green { animation: global-strobe-green 0.8s infinite ease-in-out; }
        .animate-global-strobe-cyan { animation: global-strobe-cyan 0.8s infinite ease-in-out; }
        .animate-global-strobe-orange { animation: global-strobe-orange 0.8s infinite ease-in-out; }
        .animate-global-strobe-magenta { animation: global-strobe-magenta 0.8s infinite ease-in-out; }
        @keyframes intro-heading-glow { 0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0); } 50% { text-shadow: 0 0 30px rgba(230,126,34,0.8); } }
        .animate-intro-heading-glow { animation: intro-heading-glow 2s ease-in-out infinite; }
        @keyframes intro-finish-strobe { 0%, 100% { background-color: var(--accent); box-shadow: 0 0 0px var(--accent); } 50% { background-color: #fff; box-shadow: 0 0 30px #fff; } }
        .animate-intro-finish-strobe { animation: intro-finish-strobe 0.8s infinite ease-in-out; }
        @keyframes polaroid-entry { from { opacity: 0; transform: translateY(40px) rotate(12deg); } to { opacity: 1; transform: translateY(0) rotate(-3deg); } }
        .animate-polaroid-entry { animation: polaroid-entry 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s forwards; }
      `}</style>
      <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.txt" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsProcessingWrite(true);
        try {
          const text = await file.text();
          setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: text } : c));
        } finally {
          setIsProcessingWrite(false);
        }
      }} />
    </div>
  );
};

export default AuthorBuilder;
