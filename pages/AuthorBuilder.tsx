
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { queryPartner, smartSoap, performOCR } from '../services/geminiService';
import { Message, Chapter, VaultStorage, VaultSheet, EfficiencyLog } from '../types';

// Declare mammoth for Word import
declare const mammoth: any;

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const FONT_PAIRINGS = [
  { name: 'Classic', title: 'font-serif font-black italic', body: 'font-serif text-xl' },
  { name: 'Modern', title: 'font-serif font-bold', body: 'font-sans text-lg' },
  { name: 'Typewriter', title: 'font-mono uppercase tracking-tighter', body: 'font-mono text-base tracking-tight' },
  { name: 'Manuscript', title: 'font-serif italic font-light', body: 'font-serif italic text-2xl leading-relaxed' },
];

const DEFAULT_TITLE = "In the beginning was the word...";
const MAX_WORDS = 1000;
const WARNING_WORDS = 900;
const MAX_OCR_SIZE = 4 * 1024 * 1024; // 4MB

function generateCourierCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'AT-';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  code += '-';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

const AuthorBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('wrap_sheets_v4');
    return saved ? JSON.parse(saved) : [{ id: '1', title: DEFAULT_TITLE, content: '', order: 0, media: [], subChapters: [] }];
  });
  
  const [activeChapterId, setActiveChapterId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);
  const [fontIndex, setFontIndex] = useState(0);
  const currentFont = FONT_PAIRINGS[fontIndex];
  const [showSoapMenu, setShowSoapMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isSoaping, setIsSoaping] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [wrapperWidth, setWrapperWidth] = useState(420); 
  
  const [style, setStyle] = useState(STYLES[2]); 
  const [region, setRegion] = useState(REGIONS[1]);

  const authorProfile = (() => {
    const saved = localStorage.getItem('aca_author_profile');
    return saved ? JSON.parse(saved) : null;
  })();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const isResizing = useRef(false);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];
  const wordCount = activeChapter.content ? activeChapter.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  const isLimitReached = wordCount >= MAX_WORDS;
  const isWarningReached = wordCount >= WARNING_WORDS;

  useEffect(() => {
    localStorage.setItem('wrap_sheets_v4', JSON.stringify(chapters));
    if (isLimitReached) handleEmergencyAutoVault();
  }, [chapters]);

  useEffect(() => {
    if (messages.length === 0 && authorProfile) {
      setMessages([{ 
        role: 'assistant', 
        content: `Welcome back, ${authorProfile.name}. I have loaded your WRAP Profile (${authorProfile.dialectLevel}). Ready to polish the next chapter of your legacy.` 
      }]);
    }
  }, [authorProfile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerLoading]);

  const logEfficiency = (action: string, metrics: any) => {
    const vault = JSON.parse(localStorage.getItem('aca_sovereign_vault') || '{"sheets":[],"books":[],"ai":[],"audits":[],"efficiencyLogs":[]}');
    if (!vault.efficiencyLogs) vault.efficiencyLogs = [];
    const newLog = { 
      id: Date.now().toString(), 
      timestamp: new Date().toISOString(), 
      action, 
      metrics: {
        ...metrics,
        wholesaleCostEstimate: metrics.simulatedResourceLoad || 0
      } 
    };
    vault.efficiencyLogs.unshift(newLog);
    localStorage.setItem('aca_sovereign_vault', JSON.stringify(vault));
  };

  const handleEmergencyAutoVault = () => {
    const vault = JSON.parse(localStorage.getItem('aca_sovereign_vault') || '{"sheets":[],"books":[],"ai":[],"audits":[]}');
    const newKey = generateCourierCode();
    const newSheet = { id: `auto-${Date.now()}`, timestamp: new Date().toISOString(), dispatchKey: newKey, status: 'archived', data: { ...activeChapter } };
    vault.sheets.unshift(newSheet);
    localStorage.setItem('aca_sovereign_vault', JSON.stringify(vault));
    alert(`SOVEREIGN STANDARD REACHED: 1,000-word quality threshold hit. Installment archived to THE BIG HOUSE. Continuing session.`);
    const nextId = Date.now().toString();
    const nextTitle = activeChapter.title !== DEFAULT_TITLE ? `${activeChapter.title} (Cont.)` : DEFAULT_TITLE;
    setChapters(prev => prev.map(c => c.id === activeChapterId ? { id: nextId, title: nextTitle, content: '', order: c.order, media: [], subChapters: [] } : c));
    setActiveChapterId(nextId);
  };

  const handleSoap = async (level: 'rinse' | 'scrub' | 'sanitize') => {
    if (!activeChapter.content.trim()) return;
    setIsSoaping(true); setShowSoapMenu(false);
    try {
      const result = await smartSoap(activeChapter.content, level);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
      logEfficiency(`Soap: ${level}`, result.metrics);
    } finally { setIsSoaping(false); }
  };

  const handlePartnerChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const finalMsg = customMsg || partnerInput;
    if (!finalMsg.trim()) return;
    const userMsg = finalMsg;
    setPartnerInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsPartnerLoading(true);
    try {
      const context = authorProfile ? `AUTHOR_NAME: ${authorProfile.name}. MISSION: ${authorProfile.customContext}. ` : "";
      const response = await queryPartner(context + userMsg, style, region, messages, activeChapter.content);
      setMessages(prev => [...prev, response]);
      if (response.metrics) logEfficiency('Partner Chat', response.metrics);
    } finally { setIsPartnerLoading(false); }
  };

  const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Industrial Validation: Size Check
    if (file.size > MAX_OCR_SIZE) {
      alert("FILE EXCEEDS 4MB LIMIT. PLEASE COMPRESS FOR SOVEREIGN PROCESSING.");
      return;
    }

    setIsOCRLoading(true); setShowActionMenu(false);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const result = await performOCR(base64);
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content ? c.content + '\n\n' : '') + result.text } : c));
        logEfficiency('Paper-to-Pixel OCR', result.metrics);
      } catch (err: any) { 
        alert(err.message); 
      } finally { 
        setIsOCRLoading(false); 
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (isResizing.current) { const newWidth = window.innerWidth - e.clientX; if (newWidth > 300 && newWidth < 800) setWrapperWidth(newWidth); } };
    const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = 'default'; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  const isAnythingLoading = isPartnerLoading || isSoaping || isOCRLoading;

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden selection:bg-orange-500/30">
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0">
        <div className="flex-grow overflow-y-auto pt-32 pb-4 custom-scrollbar">
          {chapters.map(c => (
            <div key={c.id} onClick={() => setActiveChapterId(c.id)} className={`py-4 px-6 cursor-pointer border-l-2 transition-all ${activeChapterId === c.id ? 'bg-orange-500/15 border-orange-500 text-orange-500' : 'border-transparent text-gray-700 hover:bg-white/5'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{c.title === DEFAULT_TITLE ? 'Untitled Sheet' : c.title}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-6 border-t border-white/5 bg-black/40 space-y-4">
          <Link to="/wrap-it-up" className="w-full p-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all rounded-sm flex items-center justify-center gap-2">Mastering Suite</Link>
          <button disabled={isLimitReached} onClick={() => { const newId = Date.now().toString(); setChapters([...chapters, { id: newId, title: DEFAULT_TITLE, content: '', order: 0, media: [], subChapters: [] }]); setActiveChapterId(newId); }} className="w-full p-4 border border-dashed border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-orange-500 transition-all rounded-sm disabled:opacity-30">+ New Sheet</button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative bg-[#020202]">
        <div className="px-12 py-8 border-b border-white/[0.03] bg-[#050505] flex items-center justify-between sticky top-0 z-[60] backdrop-blur-xl">
           <div className="flex items-center gap-10">
              <button onClick={() => setFontIndex((fontIndex + 1) % FONT_PAIRINGS.length)} className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors">Font: {currentFont.name}</button>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-2 rounded-sm group relative">
                 <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : isWarningReached ? 'bg-orange-500' : 'bg-gray-700'}`} style={{ width: `${(wordCount / MAX_WORDS) * 100}%` }}></div>
                 </div>
                 <span className={`text-[9px] font-black uppercase tracking-widest ${isWarningReached ? 'text-orange-500 animate-pulse' : 'text-gray-600'}`}>{wordCount} / {MAX_WORDS}</span>
              </div>
              <button onClick={() => setShowSoapMenu(!showSoapMenu)} className={`flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 transition-all bg-white/5 font-black uppercase tracking-widest text-[9px] ${isSoaping ? 'text-orange-500 animate-pulse' : 'text-gray-500 hover:text-white'}`}>Drop The Soap</button>
              {showSoapMenu && (
                <div className="absolute right-0 mt-32 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden">
                  <button onClick={() => handleSoap('rinse')} className="w-full p-4 text-left group">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Rinse</p>
                    <p className="text-[7px] text-gray-700 uppercase">Light Punctuation only</p>
                  </button>
                  <button onClick={() => handleSoap('scrub')} className="w-full p-4 text-left group border-t border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 group-hover:text-white">Scrub</p>
                    <p className="text-[7px] text-gray-700 uppercase">Tighten prose, keep dialogue</p>
                  </button>
                  <button onClick={() => handleSoap('sanitize')} className="w-full p-4 text-left group border-t border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-400">Sanitize</p>
                    <p className="text-[7px] text-gray-700 uppercase">PII Redaction Mode</p>
                  </button>
                </div>
              )}
              <button onClick={() => setShowActionMenu(!showActionMenu)} className="bg-orange-500 text-white px-10 py-3 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-orange-600 transition-all">Actions</button>
              {showActionMenu && (
                <div className="absolute right-0 mt-32 w-56 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden">
                  <button onClick={() => ocrInputRef.current?.click()} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-white hover:bg-orange-500/10 border-b border-white/5">Paper to Pixel (OCR)</button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5">Import File</button>
                </div>
              )}
           </div>
        </div>

        <div className="flex-grow flex flex-col px-12 py-12 overflow-y-auto custom-scrollbar">
           <div className="w-full max-w-none space-y-12 h-full flex flex-col relative">
              <textarea rows={2} value={activeChapter.title} onChange={(e) => { const val = e.target.value; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: val } : c)); }} className={`w-full bg-transparent border-none outline-none focus:ring-0 text-5xl md:text-8xl leading-tight tracking-tighter resize-none overflow-hidden ${currentFont.title}`} placeholder={DEFAULT_TITLE} />
              <textarea value={activeChapter.content} onChange={(e) => { if (isLimitReached) return; const val = e.target.value; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: val } : c)); }} className={`w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-400 text-xl font-serif leading-[2.2] transition-all ${currentFont.body} ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`} placeholder="The narrative begins here..." />
           </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.txt,.md" />
        <input type="file" ref={ocrInputRef} onChange={handleOCRUpload} className="hidden" accept="image/*" />
      </main>

      <div onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1.5 hover:bg-orange-500/40 cursor-ew-resize transition-colors z-[80] bg-white/5 no-print"></div>

      <aside className="border-l border-white/5 bg-[#080808] flex flex-col shrink-0 relative no-print h-full" style={{ width: `${wrapperWidth}px` }}>
        <div className="shrink-0 p-10 border-b border-white/5 flex flex-col gap-4 bg-[#0a0a0a] pt-48">
           <div className="flex items-center justify-between">
              <Link to="/wrapper-info" className="flex flex-col">
                <h3 className="text-orange-500 text-[12px] font-black uppercase tracking-[0.5em] glow-orange mb-1">WRAP PARTNER</h3>
                <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Profile: {authorProfile ? authorProfile.name : 'Uncalibrated'}</span>
              </Link>
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1 border border-white/5 rounded-full">
                 <div className={`w-1.5 h-1.5 rounded-full ${isAnythingLoading ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(230,126,34,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`}></div>
                 <span className={`text-[7px] font-black uppercase tracking-widest transition-colors ${isAnythingLoading ? 'text-orange-500' : 'text-gray-500'}`}>
                   {isAnythingLoading ? 'Shield Tunneling' : 'Shield Secured'}
                 </span>
              </div>
           </div>
           {!authorProfile && <Link to="/wrapper-info" className="text-[8px] font-black text-orange-500 animate-pulse underline">Set Profile</Link>}
        </div>
        <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar bg-black/10">
           {messages.map((m, i) => (
             <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start animate-fade-in'}`}>
                <div className={`max-w-[90%] p-6 rounded-sm text-sm font-serif leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-500 italic' : 'bg-orange-500/5 border border-orange-500/20 text-gray-300'}`}>{m.content}</div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] text-orange-500 animate-pulse uppercase tracking-widest ml-6">Consulting Archives...</div>}
           <div ref={chatEndRef} />
        </div>
        <form onSubmit={handlePartnerChat} className="shrink-0 p-10 bg-[#0a0a0a] border-t border-white/5 flex flex-col gap-4">
           <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePartnerChat())} className="w-full bg-[#030303] border border-white/10 p-4 text-base font-serif italic text-white focus:border-orange-500/50 outline-none resize-none h-24 rounded-sm shadow-inner" placeholder="Talk to WRAP..." />
           <button type="submit" className="w-full bg-white text-black py-4 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm transition-all hover:bg-orange-500 hover:text-white shadow-xl">Transcribe To Partner</button>
        </form>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AuthorBuilder;
