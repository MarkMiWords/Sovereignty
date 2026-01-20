
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryPartner, smartSoap } from '../services/geminiService';
import { Message, Chapter, VaultStorage, VaultSheet } from '../types';
import { readJson, writeJson } from '../utils/safeStorage';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const DEFAULT_CHAPTER: Chapter = { id: '1', title: "", content: '', order: 0, media: [], subChapters: [] };

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
  const [isSoaping, setIsSoaping] = useState(false);
  const [showPartnerIntel, setShowPartnerIntel] = useState(false);
  
  // Voice & Cloner State
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [hasClonedVoice, setHasClonedVoice] = useState(() => localStorage.getItem('aca_voice_cloned') === 'true');

  // Dictation States
  const [isDictating, setIsDictating] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'sheet' | 'partner' | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const profile = readJson<any>('aca_author_profile', { fontIndex: 0, motivation: 'Prison Life', region: 'Australia' });
  const [style, setStyle] = useState(profile.motivation || STYLES[2]); 
  const [region, setRegion] = useState(profile.region || REGIONS[1]);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0] || DEFAULT_CHAPTER;

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
    const currentVaultSheets = vault.sheets || [];
    const newVaultSheets: VaultSheet[] = chapters.map(c => ({
      id: `vault-${c.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'archived',
      data: c
    }));
    vault.sheets = [...newVaultSheets, ...currentVaultSheets];
    writeJson('sovereign_vault', vault);
    alert("Saved: All navigation sheets moved to Vault.");
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
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Link Interrupted. Try resending." }]);
    } finally { 
      setIsPartnerLoading(false); 
      // Auto-scroll to bottom
      setTimeout(() => chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  };

  const handleSoap = async (level: string) => {
    if (!activeChapter.content?.trim() || isSoaping) return;
    setIsSoaping(true); 
    try {
      const result = await smartSoap(activeChapter.content, level, style, region);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
    } finally { setIsSoaping(false); }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      contentInputRef.current?.focus();
    }
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
          setTimeout(() => setIsCloning(false), 1000);
          return 100;
        }
        return prev + 1;
      });
    }, 300); // ~30 second simulation
  };

  // --- Dictation Logic ---
  const startDictation = async (target: 'sheet' | 'partner') => {
    if (isDictating) { stopDictation(); return; }
    
    setDictationTarget(target);
    setIsDictating(true);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
              const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
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
          onerror: (e) => { console.error(e); stopDictation(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "You are an invisible transcription engine. Just transcribe the user's spoken words accurately. Do not reply with audio."
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
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
      
      {/* LHS Panel: Registry */}
      <aside 
        style={{ width: `${navWidth}px` }}
        className="border-r border-white/10 bg-[#080808] flex flex-col shrink-0 transition-all relative pt-20"
      >
        <div className="px-8 mb-6">
           <button onClick={handleNewSheet} className="w-full py-3 bg-orange-500 text-white text-[9px] font-black uppercase tracking-[0.4em] hover:bg-orange-600 transition-all shadow-xl rounded-sm">
             + New Sheet
           </button>
        </div>

        <div className="px-8 py-5 bg-orange-500/10 border-y border-orange-500/20 flex flex-col gap-1">
          <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Currently Editing</span>
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
           <button onClick={handleSaveToVault} className="w-full py-3 border border-dashed border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-700 hover:text-orange-500 hover:border-orange-500 transition-all">
             Save all to Vault
           </button>
        </div>
      </aside>

      <div onMouseDown={() => { isResizingNav.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1 bg-white/5 hover:bg-orange-500 cursor-ew-resize z-50 transition-colors"></div>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-[#020202]">
        
        {/* WRAP BAR */}
        <div className="shrink-0 h-24 border-b border-white/10 bg-black flex items-stretch">
            {/* Write (Amber) */}
            <div className="flex-1 group/wrap relative border-r border-white/5 cursor-pointer hover:shadow-[inset_0_0_40px_rgba(230,126,34,0.3)] transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className="text-[14px] font-black text-gray-700 group-hover:neon-amber transition-all tracking-[0.3em]">
                    <span className="text-2xl">W</span>rite
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-[#0a0a0a] border border-orange-500 shadow-2xl z-[100] opacity-0 invisible group-hover/wrap:opacity-100 group-hover/wrap:visible translate-y-2 group-hover/wrap:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 hover:bg-white/5 border-b border-white/5 transition-colors">Import Docs</button>
                  <button onClick={() => startDictation('sheet')} className={`w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest border-b border-white/5 transition-colors ${dictationTarget === 'sheet' ? 'text-orange-500 animate-pulse bg-orange-500/5' : 'text-white/40 hover:text-orange-500 hover:bg-white/5'}`}>
                    {dictationTarget === 'sheet' ? 'Recording...' : 'Dictation'}
                  </button>
                  <button onClick={() => handleSoap('dogg_me')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 hover:bg-white/5 border-b border-white/5 transition-colors">Dogg Me</button>
                  <button onClick={() => navigate('/wrapper-info')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 hover:bg-white/5 transition-colors">Profile Settings</button>
               </div>
            </div>

            {/* Revise (Red Glow Re-established) */}
            <div className="flex-1 group/wrap relative border-r border-white/5 cursor-pointer hover:shadow-[inset_0_0_60px_rgba(192,57,43,0.5)] transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className="text-[14px] font-black text-gray-700 group-hover:neon-red transition-all tracking-[0.3em]">
                    <span className="text-2xl">R</span>evise
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-[#0a0a0a] border border-red-600 shadow-2xl z-[100] opacity-0 invisible group-hover/wrap:opacity-100 group-hover/wrap:visible translate-y-2 group-hover/wrap:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => handleSoap('rinse')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 border-b border-white/5 transition-colors">Rinse</button>
                  <button onClick={() => handleSoap('wash')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 border-b border-white/5 transition-colors">Wash</button>
                  <button onClick={() => handleSoap('scrub')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Scrub</button>
                  <button onClick={() => handleSoap('fact_check')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 transition-colors">Fact Check</button>
               </div>
            </div>

            {/* Articulate (Blue) */}
            <div className="flex-1 group/wrap relative border-r border-white/5 cursor-pointer hover:shadow-[inset_0_0_40px_rgba(41,128,185,0.4)] transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className="text-[14px] font-black text-gray-700 group-hover:neon-blue transition-all tracking-[0.3em]">
                    <span className="text-2xl">A</span>rticulate
                  </span>
               </div>
               <div className="absolute top-full left-0 w-64 bg-[#0a0a0a] border border-blue-500 shadow-2xl z-[100] opacity-0 invisible group-hover/wrap:opacity-100 group-hover/wrap:visible translate-y-2 group-hover/wrap:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={startVoiceClone} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-400/10 border-b border-white/5 transition-colors">Clone Voice</button>
                  <button onClick={() => {}} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-blue-400 hover:bg-white/5 border-b border-white/5 transition-colors">Gender</button>
                  <button onClick={() => {}} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-blue-400 hover:bg-white/5 border-b border-white/5 transition-colors">
                     {hasClonedVoice ? 'My Voice (Active)' : 'Accent'}
                  </button>
                  <button onClick={() => {}} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-blue-400 hover:bg-white/5 transition-colors">Speed</button>
               </div>
            </div>

            {/* Produce (Green Glow Re-established) */}
            <div className="flex-1 group/wrap relative cursor-pointer hover:shadow-[inset_0_0_40px_rgba(39,174,96,0.3)] transition-all">
               <div className="h-full flex flex-col items-center justify-center">
                  <span className="text-[14px] font-black text-gray-700 group-hover:neon-green transition-all tracking-[0.3em]">
                    <span className="text-2xl">P</span>roduce
                  </span>
               </div>
               <div className="absolute top-full right-0 w-64 bg-[#0a0a0a] border border-green-500 shadow-2xl z-[100] opacity-0 invisible group-hover/wrap:opacity-100 group-hover/wrap:visible translate-y-2 group-hover/wrap:translate-y-0 transition-all duration-200 rounded-sm overflow-hidden">
                  <button onClick={() => alert("Synchronized.")} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 border-b border-white/5 transition-colors">Save Sheet</button>
                  <button onClick={() => handleSoap('sanitise')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-b border-white/5 transition-colors">Sanitise</button>
                  <button onClick={() => handleSoap('expand')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-green-500 hover:bg-white/5 border-b border-white/5 transition-colors">Sheet me to tears</button>
                  <button onClick={() => handleSoap('polish_turd')} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-green-500 hover:bg-white/5 transition-colors">Polish a turd</button>
               </div>
            </div>
        </div>

        {/* FORGE EDITOR (Tighter Proportions) */}
        <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar bg-[#020202]">
          <div className="py-6 bg-[#030303]/40 border-b border-white/5">
             <div className="max-w-4xl px-12">
               <h2 className="text-[8px] font-black uppercase tracking-[0.8em] text-gray-900 mb-2">Registry Identifier</h2>
               <input 
                 ref={titleInputRef}
                 type="text" 
                 value={activeChapter.title}
                 onKeyDown={handleTitleKeyDown}
                 onChange={(e) => setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: e.target.value } : c))} 
                 className="w-full bg-transparent border-none outline-none focus:ring-0 text-white text-3xl md:text-5xl font-serif italic placeholder:text-white/10 tracking-tighter leading-tight"
                 placeholder="Tell us a yarn..."
               />
             </div>
          </div>

          <div className="px-12 py-8 flex flex-col flex-grow">
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
              <span>Words: {activeChapter.content.split(/\s+/).filter(Boolean).length}</span>
              <span>Context: {region}</span>
              <span>Style: {style}</span>
           </div>
           <span>Forge v5.8 Stabilized</span>
        </div>
      </main>

      <div onMouseDown={() => { isResizingPartner.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1 bg-white/5 hover:bg-orange-500 cursor-ew-resize z-50 transition-colors"></div>

      {/* RHS Panel: WRAP Partner */}
      <aside className="border-l border-white/10 bg-[#080808] flex flex-col shrink-0 relative transition-all" style={{ width: `${partnerWidth}px` }}>
        <div className="p-10 border-b border-white/10 bg-black">
           <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#e67e22]"></div>
                <h3 className="text-orange-500 text-[11px] font-black uppercase tracking-[0.6em]">WRAP Partner</h3>
             </div>
             <button onClick={() => navigate('/live-link')} className="px-4 py-2 text-[8px] font-black uppercase tracking-[0.4em] border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all rounded-sm">
                Live Link
             </button>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <select value={style} onChange={e => setStyle(e.target.value)} className="bg-black border border-white/10 text-[9px] font-black text-gray-700 p-4 uppercase tracking-widest outline-none focus:border-orange-500 rounded-sm">
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={region} onChange={e => setRegion(e.target.value)} className="bg-black border border-white/10 text-[9px] font-black text-gray-700 p-4 uppercase tracking-widest outline-none focus:border-orange-500 rounded-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
           </div>
        </div>

        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-12 space-y-12 custom-scrollbar bg-black/40">
           {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center opacity-10 italic font-serif px-12 text-3xl">"Tell us a yarn."</div>}
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start animate-fade-in'}`}>
                <div className={`max-w-[95%] p-10 rounded-sm text-[16px] font-serif italic leading-[1.8] ${m.role === 'user' ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-orange-500/5 text-gray-300 border border-orange-500/10'}`}>
                  {m.content}
                </div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] text-orange-500 animate-pulse uppercase tracking-[0.6em] px-8">Synching Response...</div>}
        </div>

        <form onSubmit={handlePartnerChat} className="p-10 bg-black border-t border-white/10 space-y-4">
            <div className="relative group">
              <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Message Partner..." className="w-full bg-[#030303] border border-white/10 p-6 pr-14 text-[14px] font-serif italic text-white focus:border-orange-500 outline-none h-32 rounded-sm resize-none transition-all shadow-inner" />
              <button type="button" onClick={() => startDictation('partner')} className={`absolute right-4 bottom-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${dictationTarget === 'partner' ? 'bg-orange-500 text-white animate-pulse' : 'bg-white/5 text-gray-600 hover:text-orange-500 hover:bg-white/10'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            </div>
            <button type="submit" disabled={isPartnerLoading || !partnerInput.trim()} className="w-full py-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-sm hover:bg-orange-600 transition-all shadow-2xl disabled:opacity-30">
              {isPartnerLoading ? 'Engaging...' : 'Shoot it over'}
            </button>
         </form>
      </aside>

      {/* Voice Cloning Studio Modal */}
      {isCloning && (
        <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
           <div className="max-w-2xl w-full text-center space-y-12">
              <div className="space-y-4">
                 <span className="text-blue-400 tracking-[1em] uppercase text-[10px] font-black block">Acoustic Forge</span>
                 <h2 className="text-5xl font-serif font-black italic text-white tracking-tighter leading-none">Voice Cloning <span className="text-blue-500">Studio.</span></h2>
                 <p className="text-xl text-gray-500 font-light italic max-w-lg mx-auto">"Read the text below for 30 seconds to synchronize your vocal signature."</p>
              </div>

              <div className="p-10 bg-white/[0.02] border border-blue-500/20 rounded-sm text-2xl font-serif italic text-gray-400 leading-relaxed shadow-inner">
                 "I am a sovereign author. My voice is my legacy. I reclaim the narrative and build the bridge between the system and the world. Every word I speak is an evidence of life."
              </div>

              <div className="relative pt-12">
                 <div className="h-1 bg-white/10 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${cloneProgress}%` }}></div>
                 </div>
                 <div className="flex justify-between mt-4 text-[9px] font-black uppercase tracking-widest text-gray-600">
                    <span>Capturing Frequencies...</span>
                    <span>{cloneProgress}% Complete</span>
                 </div>
              </div>

              {cloneProgress === 0 ? (
                <button onClick={startVoiceClone} className="px-16 py-6 bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-blue-600 transition-all rounded-sm">Begin Capture</button>
              ) : cloneProgress === 100 ? (
                <div className="text-blue-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Signature Secured. Initializing "My Voice" Profile...</div>
              ) : (
                <div className="text-blue-400 animate-pulse text-[10px] font-black uppercase tracking-widest">Speaking... Keep going...</div>
              )}
           </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.txt" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .neon-amber { color: #e67e22; text-shadow: 0 0 10px #e67e22, 0 0 20px #e67e22; }
        .neon-red { color: #c0392b; text-shadow: 0 0 10px #c0392b, 0 0 25px #c0392b; }
        .neon-blue { color: #2980b9; text-shadow: 0 0 10px #2980b9, 0 0 20px #2980b9; }
        .neon-green { color: #27ae60; text-shadow: 0 0 10px #27ae60, 0 0 20px #27ae60; }
      `}</style>
    </div>
  );
};

export default AuthorBuilder;
