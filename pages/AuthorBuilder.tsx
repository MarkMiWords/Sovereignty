
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryPartner, smartSoap } from '../services/geminiService';
import { Message, Chapter, VaultStorage, VaultSheet } from '../types';
import { readJson, writeJson } from '../utils/safeStorage';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

declare const mammoth: any;

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const INSPIRATIONAL_QUOTES = [
  "Everything is hard before it is easy. - Goethe",
  "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion. - Camus",
  "I can be changed by what happens to me. But I refuse to be reduced by it. - Maya Angelou",
  "The sun does not realize how wonderful it is until after a room is made visible. - Louis Kahn",
  "Your voice is your legacy. Reclaim the narrative and build the bridge between the system and the world."
];

const PREMADE_PROMPTS = [
  "Tell Wrap more about myself",
  "Understand how to use Wrap",
  "Summarise my sheet",
  "Suggest a title",
  "Get through a writers block",
  "Brainstorm ideas",
  "Research a subject",
  "Reach for support",
  "Access Support"
];

const DEFAULT_CHAPTER: Chapter = { id: '1', title: "", content: '', order: 0, media: [], subChapters: [] };

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
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
  const [showPrompts, setShowPrompts] = useState(false);
  
  const [isProcessingWrite, setIsProcessingWrite] = useState(false);
  const [isProcessingRevise, setIsProcessingRevise] = useState(false);
  const [isProcessingArticulate, setIsProcessingArticulate] = useState(false);
  const [isProcessingPolish, setIsProcessingPolish] = useState(false);

  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [hasClonedVoice, setHasClonedVoice] = useState(() => localStorage.getItem('aca_voice_cloned') === 'true');
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const [gender, setGender] = useState('Neutral');
  const [vocalStyle, setVocalStyle] = useState('Normal');
  const [accent, setAccent] = useState('Australian');
  const [speed, setSpeed] = useState('1.0');

  const [isDictating, setIsDictating] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'sheet' | 'partner' | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const profile = readJson<any>('aca_author_profile', { fontIndex: 0, motivation: 'Prison Life', region: 'Australia' });
  const [style, setStyle] = useState(profile.motivation || STYLES[2]); 
  const [region, setRegion] = useState(profile.region || REGIONS[1]);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0] || DEFAULT_CHAPTER;
  const wordCount = activeChapter.content.split(/\s+/).filter(Boolean).length;

  useEffect(() => { writeJson('wrap_sheets_v4', chapters); }, [chapters]);

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
    alert("Saved: All navigation sheets moved to Vault.");
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
        
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { 
          ...c, 
          title: h1 || c.title || file.name.replace('.docx', ''),
          content: plainText 
        } : c));
      } else {
        const text = await file.text();
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: text } : c));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingWrite(false);
    }
  };

  const handlePartnerChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const finalMsg = (customMsg || partnerInput).trim();
    if (!finalMsg || isPartnerLoading) return;
    
    setPartnerInput('');
    setShowPrompts(false);
    setMessages(prev => [...prev, { role: 'user', content: finalMsg }]);
    setIsPartnerLoading(true);
    
    try {
      const response = await queryPartner(finalMsg, style, region, messages, activeChapter.content);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Link Interrupted." }]);
    } finally { 
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
    } finally { 
      setIsProcessingRevise(false); 
      setIsProcessingPolish(false);
    }
  };

  const handleSaveSheet = () => {
    setIsProcessingPolish(true);
    setTimeout(() => {
      setIsProcessingPolish(false);
      alert("Registry Synchronized.");
    }, 1500);
  };

  const startVoiceClone = () => {
    setIsCloning(true);
    setCloneProgress(0);
    const interval = setInterval(() => {
      setCloneProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setHasClonedVoice(true);
          localStorage.setItem('aca_voice_cloned', 'true');
          setAccent('Cloned');
          setTimeout(() => setIsCloning(false), 1000);
          return 100;
        }
        return prev + 1;
      });
    }, 300); 
  };

  const startDictation = async (target: 'sheet' | 'partner') => {
    if (isDictating) { stopDictation(); return; }
    setDictationTarget(target);
    setIsDictating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } 
      });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
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
              if (target === 'sheet') setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: c.content + ' ' + text } : c));
              else setPartnerInput(prev => prev + ' ' + text);
            }
          },
          onclose: () => setIsDictating(false),
          onerror: () => stopDictation()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "Transcribe precisely."
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsDictating(false);
    }
  };

  const stopDictation = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsDictating(false);
    setDictationTarget(null);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden">
      <aside style={{ width: `${navWidth}px` }} className="border-r border-white/10 bg-[#080808] flex flex-col shrink-0 transition-all relative pt-20">
        <div className="px-8 mb-6">
           <button onClick={handleNewSheet} className="w-full py-3 animate-living-amber-bg text-white text-[9px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-xl rounded-sm">
             + New Sheet
           </button>
        </div>
        <div className="px-8 py-5 bg-white/5 border-y border-white/10 flex flex-col gap-1" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)', borderColor: 'rgba(var(--accent-rgb), 0.2)' }}>
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
        <div className="shrink-0 h-24 border-b border-white/10 bg-black flex items-stretch">
            {/* Write */}
            <div className="flex-1 group/write relative border-r border-white/5 cursor-pointer hover:bg-[var(--accent)]/5 transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className={`text-[14px] font-black text-gray-700 tracking-[0.3em] uppercase transition-all duration-300 group-hover/write:text-[var(--accent)] ${isProcessingWrite ? 'animate-industrial-pulse text-[var(--accent)]' : ''}`}>
                    <span className="text-2xl">W</span>rite
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-[var(--accent)] shadow-2xl z-[100] opacity-0 invisible group-hover/write:opacity-100 group-hover/write:visible translate-y-2 group-hover/write:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)] hover:bg-white/5 border-b border-white/5 transition-colors">Import Docs</button>
                  <button onClick={() => startDictation('sheet')} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest border-b border-white/5 transition-colors ${dictationTarget === 'sheet' ? 'animate-pulse text-[var(--accent)]' : 'text-white/40 hover:text-[var(--accent)]'}`}>
                    {dictationTarget === 'sheet' ? 'Recording...' : 'Dictation'}
                  </button>
                  <button onClick={() => handleSoap('dogg_me', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--accent)] hover:bg-white/5 border-b border-white/5 transition-colors">Dogg Me</button>
               </div>
            </div>

            {/* Revise */}
            <div className="flex-1 group/revise relative border-r border-white/5 cursor-pointer hover:bg-red-500/5 transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className={`text-[14px] font-black text-gray-700 tracking-[0.3em] uppercase transition-all duration-300 group-hover/revise:text-red-500 ${isProcessingRevise ? 'animate-industrial-pulse text-red-500' : ''}`}>
                    <span className="text-2xl">R</span>evise
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-red-600 shadow-2xl z-[100] opacity-0 invisible group-hover/revise:opacity-100 group-hover/revise:visible translate-y-2 group-hover/revise:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('rinse', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 border-b border-white/5 transition-colors">Rinse</button>
                  <button onClick={() => handleSoap('wash', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 border-b border-white/5 transition-colors">Wash</button>
                  <button onClick={() => handleSoap('scrub', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Scrub</button>
                  <button onClick={() => handleSoap('fact_check', 'revise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 transition-colors">Fact Check</button>
               </div>
            </div>

            {/* Articulate */}
            <div className="flex-1 group/articulate relative border-r border-white/5 cursor-pointer hover:bg-blue-500/5 transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className={`text-[14px] font-black text-gray-700 tracking-[0.3em] uppercase transition-all duration-300 group-hover/articulate:text-blue-500 ${isProcessingArticulate ? 'animate-industrial-pulse text-blue-500' : ''}`}>
                    <span className="text-2xl">A</span>rticulate
                  </span>
               </div>
               <div className="absolute top-full left-0 w-72 bg-black border border-blue-500 shadow-2xl z-[100] opacity-0 invisible group-hover/articulate:opacity-100 group-hover/articulate:visible translate-y-2 group-hover/articulate:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={startVoiceClone} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-400/10 border-b border-white/5 transition-colors">Clone Voice</button>
                  <div className="p-6 space-y-6 border-b border-white/5 bg-black/40">
                     <div className="space-y-3">
                        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Gender Matrix</p>
                        <div className="flex gap-2">
                           <button onClick={() => setGender('Male')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${gender === 'Male' ? 'bg-[#3498db] border-[#3498db] text-white' : 'border-white/10 text-gray-600'}`}>M</button>
                           <button onClick={() => setGender('Female')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${gender === 'Female' ? 'bg-[#f95bf6] border-[#f95bf6] text-white' : 'border-white/10 text-gray-600'}`}>F</button>
                           <button onClick={() => setGender('Neutral')} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-sm border transition-all ${gender === 'Neutral' ? 'bg-white border-white text-black' : 'border-white/10 text-gray-600'}`}>N</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Polish */}
            <div className="flex-1 group/polish relative cursor-pointer hover:bg-green-500/5 transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className={`text-[14px] font-black text-gray-700 tracking-[0.3em] uppercase transition-all duration-300 group-hover/polish:text-green-500 ${isProcessingPolish ? 'animate-industrial-pulse text-green-500' : ''}`}>
                    <span className="text-2xl">P</span>olish
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-black border border-green-500 shadow-2xl z-[100] opacity-0 invisible group-hover/polish:opacity-100 group-hover/polish:visible translate-y-2 group-hover/polish:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('polish_story', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish story</button>
                  <button onClick={() => handleSoap('polish_poetry', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Polish poetry</button>
                  <button onClick={() => handleSoap('sanitise', 'polish')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Sanitise</button>
                  <button onClick={handleSaveSheet} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 transition-colors">Save Sheet</button>
               </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar bg-[#020202]">
          <div className="py-4 bg-[#030303]/40 border-b border-white/5">
             <div className="max-w-4xl px-12">
               <h2 className="text-[8px] font-black uppercase tracking-[0.8em] text-gray-900 mb-2">Registry Identifier</h2>
               <input 
                 ref={titleInputRef}
                 type="text" 
                 value={activeChapter.title}
                 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), contentInputRef.current?.focus())}
                 onChange={(e) => setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: e.target.value } : c))} 
                 className="w-full bg-transparent border-none outline-none focus:ring-0 text-white text-3xl md:text-5xl font-serif italic placeholder:text-white/10 tracking-tighter"
                 placeholder="Tell us a yarn..."
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
           <div className="flex gap-12">
              <span>Words: {wordCount}</span>
              <span>Context: {region}</span>
              <span>Style: {style}</span>
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
             <button onClick={() => navigate('/live-link')} className="px-4 py-2 text-[8px] font-black uppercase tracking-[0.4em] border border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all rounded-sm">
                Live Link
             </button>
           </div>
        </div>

        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-12 space-y-12 custom-scrollbar bg-black/40">
           {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center opacity-10 italic font-serif px-12 text-3xl">"Tell us a yarn."</div>}
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start animate-fade-in'}`}>
                <div className={`max-w-[95%] p-10 rounded-sm text-[16px] font-serif italic leading-[1.8] ${m.role === 'user' ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-white/5 text-gray-300 border border-white/10'}`} style={m.role !== 'user' ? { backgroundColor: 'rgba(var(--accent-rgb), 0.05)', borderColor: 'rgba(var(--accent-rgb), 0.1)' } : {}}>
                  {m.content}
                </div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] animate-pulse uppercase tracking-[0.6em] px-8" style={{ color: 'var(--accent)' }}>Engaging...</div>}
        </div>

        <form onSubmit={handlePartnerChat} className="p-10 bg-black border-t border-white/10 space-y-4">
            <div className="relative group">
              <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Message Partner..." className="w-full bg-[#030303] border border-white/10 p-6 pr-14 text-[14px] font-serif italic text-white focus:border-[var(--accent)] outline-none h-32 rounded-sm resize-none transition-all shadow-inner" />
              <button type="button" onClick={() => startDictation('partner')} className={`absolute right-4 bottom-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${dictationTarget === 'partner' ? 'bg-[var(--accent)] text-white animate-pulse' : 'bg-white/5 text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            </div>
            <button type="submit" disabled={isPartnerLoading || !partnerInput.trim()} className="w-full py-4 animate-living-amber-bg text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-sm shadow-2xl disabled:opacity-30">
              Shoot it over
            </button>
         </form>
      </aside>

      <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.txt" onChange={handleFileImport} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AuthorBuilder;
