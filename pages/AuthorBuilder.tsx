
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { queryPartner, smartSoap, performOCR } from '../services/geminiService';
import { Message, Chapter } from '../types';

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const FONT_PAIRINGS = [
  { name: 'Classic', title: 'font-serif font-black italic', body: 'font-serif text-xl' },
  { name: 'Modern', title: 'font-serif font-bold', body: 'font-sans text-lg' },
  { name: 'Typewriter', title: 'font-mono uppercase tracking-tighter', body: 'font-mono text-base tracking-tight' },
  { name: 'Manuscript', title: 'font-serif italic font-light', body: 'font-serif italic text-2xl leading-relaxed' },
];

const DEFAULT_TITLE = "";
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
  
  // Menu Visibilities
  const [showSoapMenu, setShowSoapMenu] = useState(false);
  const [showSpeakMenu, setShowSpeakMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Protocol Activity States
  const [isWriting, setIsWriting] = useState(false);
  const [isSoaping, setIsSoaping] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [wrapperWidth, setWrapperWidth] = useState(420); 

  // Speak Console Settings
  const [speakGender, setSpeakGender] = useState<'male' | 'female'>('female');
  const [speakSpeed, setSpeakSpeed] = useState(1);
  const [speakLang, setSpeakLang] = useState('en-AU');

  const [style, setStyle] = useState(STYLES[2]); 
  const [region, setRegion] = useState(REGIONS[1]);

  const authorProfile = (() => {
    const saved = localStorage.getItem('aca_author_profile');
    return saved ? JSON.parse(saved) : null;
  })();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
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
        content: `Welcome back, ${authorProfile.name}. Protocol: Write, Refine, Articulate, Produce. Digital sovereignty active.` 
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

  // --- PROTOCOLS ---

  const handleWrite = () => {
    setIsWriting(true);
    contentRef.current?.focus();
  };

  const handleSoap = async (level: 'rinse' | 'scrub' | 'sanitize') => {
    if (!activeChapter.content.trim()) return;
    setIsSoaping(true); 
    setShowSoapMenu(false);
    try {
      const result = await smartSoap(activeChapter.content, level);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
      logEfficiency(`Soap Protocol: ${level}`, result.metrics);
    } finally { setIsSoaping(false); }
  };

  const handleRefine = () => handleSoap('rinse');

  const handleArticulate = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("SPEECH PROTOCOL ERROR: Browser does not support dictation.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speakLang;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content ? c.content + ' ' : '') + finalTranscript } : c));
      }
    };
    recognition.start();
  };

  const handleProduce = async () => {
    if (!activeChapter.content.trim()) return;
    setIsExpanding(true);
    try {
      // Stage 1: Industrial Scrub
      const soapResult = await smartSoap(activeChapter.content, 'scrub');
      
      // Stage 2: Narrative Expansion
      const context = authorProfile ? `AUTHOR_NAME: ${authorProfile.name}. MISSION: ${authorProfile.customContext}. ` : "";
      const prompt = `EXPAND THE NARRATIVE BY 100%. RETAIN THE RAW EMOTIONAL CORE. ADD SENSORY DETAILS. PREPARE FOR SUBSTACK DISTRIBUTION. OUTPUT ONLY THE EXPANDED TEXT.\n\nTEXT:\n${soapResult.text}`;
      
      const response = await queryPartner(context + prompt, style, region, [], soapResult.text);
      if (response.content) {
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: response.content } : c));
        logEfficiency('Produce Protocol (Scrub + Expand)', response.metrics);
      }
    } finally { setIsExpanding(false); }
  };

  const handleDoggMe = async () => {
    if (!activeChapter.content.trim()) return;
    setIsSoaping(true);
    try {
      const prompt = `TRANSFORM THE TEXT INTO DOGGEREL. Doggerel is poetry that is irregular in rhythm and rhyme, often comical or satirical. Use crude, simple, rhyming stanzas. TEXT:\n${activeChapter.content}`;
      const response = await queryPartner(prompt, style, region, [], activeChapter.content);
      if (response.content) {
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: response.content } : c));
      }
    } finally { setIsSoaping(false); }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!activeChapter.content.trim()) return;
    const utterance = new SpeechSynthesisUtterance(activeChapter.content);
    utterance.lang = speakLang;
    utterance.rate = speakSpeed;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === speakLang && (speakGender === 'female' ? v.name.includes('Female') || v.name.includes('AU English') : v.name.includes('Male') || v.name.includes('UK English Male')));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleExport = (format: 'txt' | 'md' | 'docx') => {
    const filename = `${activeChapter.title || 'untitled-sheet'}.${format}`;
    const blob = new Blob([activeChapter.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setShowActionMenu(false);
  };

  const handleEmergencyAutoVault = () => {
    const vault = JSON.parse(localStorage.getItem('aca_sovereign_vault') || '{"sheets":[],"books":[],"ai":[],"audits":[]}');
    const newKey = generateCourierCode();
    const newSheet = { id: `auto-${Date.now()}`, timestamp: new Date().toISOString(), dispatchKey: newKey, status: 'archived', data: { ...activeChapter } };
    vault.sheets.unshift(newSheet);
    localStorage.setItem('aca_sovereign_vault', JSON.stringify(vault));
    alert(`LIMIT REACHED: Sheet archived to The Big House.`);
    const nextId = Date.now().toString();
    setChapters(prev => prev.map(c => c.id === activeChapterId ? { id: nextId, title: `${c.title} (Cont.)`, content: '', order: c.order, media: [], subChapters: [] } : c));
    setActiveChapterId(nextId);
  };

  const handlePartnerChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!partnerInput.trim()) return;
    const userMsg = partnerInput;
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
    setIsOCRLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const result = await performOCR(base64);
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content ? c.content + '\n\n' : '') + result.text } : c));
      } finally { setIsOCRLoading(false); }
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

  const isAnythingLoading = isPartnerLoading || isSoaping || isOCRLoading || isExpanding;

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden selection:bg-orange-500/30">
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0">
        <div className="flex-grow overflow-y-auto pt-32 pb-4 custom-scrollbar">
          {chapters.map(c => (
            <div key={c.id} onClick={() => setActiveChapterId(c.id)} className={`py-4 px-6 cursor-pointer border-l-2 transition-all ${activeChapterId === c.id ? 'bg-orange-500/15 border-orange-500 text-orange-500' : 'border-transparent text-gray-700 hover:bg-white/5'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{c.title || 'Untitled Sheet'}</p>
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
              {/* INDUSTRIAL UTILITY BELT */}
              <div className="flex items-center gap-4 h-10">
                <div className="relative">
                   <button onClick={() => { setShowSpeakMenu(!showSpeakMenu); setShowSoapMenu(false); setShowActionMenu(false); }} className={`text-[8px] font-black uppercase tracking-widest transition-all ${isSpeaking ? 'text-cyan-400 animate-pulse' : 'text-gray-500 hover:text-white'}`}>Speak</button>
                   {showSpeakMenu && (
                     <div className="absolute right-0 mt-4 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] p-4 space-y-4 rounded-sm">
                       <div className="space-y-1">
                         <label className="text-[7px] text-gray-600 uppercase font-bold">Gender</label>
                         <select value={speakGender} onChange={(e) => setSpeakGender(e.target.value as any)} className="w-full bg-black border border-white/10 text-[9px] text-gray-400 p-1">
                           <option value="female">Female Voice</option>
                           <option value="male">Male Voice</option>
                         </select>
                       </div>
                       <div className="space-y-1">
                         <label className="text-[7px] text-gray-600 uppercase font-bold">Accent (Slang)</label>
                         <select value={speakLang} onChange={(e) => setSpeakLang(e.target.value)} className="w-full bg-black border border-white/10 text-[9px] text-gray-400 p-1">
                           <option value="en-AU">Aussie (Grit)</option>
                           <option value="en-GB">British (Sharp)</option>
                           <option value="en-US">US (Global)</option>
                         </select>
                       </div>
                       <div className="space-y-1">
                         <label className="text-[7px] text-gray-600 uppercase font-bold">Speed: {speakSpeed}x</label>
                         <input type="range" min="0.5" max="2" step="0.1" value={speakSpeed} onChange={(e) => setSpeakSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 accent-orange-500" />
                       </div>
                       <button onClick={handleSpeak} className="w-full py-2 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest">{isSpeaking ? 'Stop' : 'Start Console'}</button>
                     </div>
                   )}
                </div>
                
                <button onClick={handleArticulate} className={`text-[8px] font-black uppercase tracking-widest transition-all ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-white'}`}>Diction</button>
                <button onClick={handleDoggMe} className={`text-[8px] font-black uppercase tracking-widest transition-all ${isSoaping ? 'text-orange-500 animate-pulse' : 'text-gray-500 hover:text-orange-500'}`}>Dogg me</button>
                
                <div className="relative">
                  <button onClick={() => { setShowSoapMenu(!showSoapMenu); setShowSpeakMenu(false); setShowActionMenu(false); }} className={`text-[8px] font-black uppercase tracking-widest transition-all ${isSoaping ? 'text-orange-500 animate-pulse' : 'text-gray-500 hover:text-white'}`}>Drop The Soap</button>
                  {showSoapMenu && (
                    <div className="absolute right-0 mt-4 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm">
                      <button onClick={() => handleSoap('rinse')} className="w-full p-4 text-left group hover:bg-white/5 transition-colors border-b border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Rinse</p>
                        <p className="text-[7px] text-gray-700 uppercase">Light Punctuation</p>
                      </button>
                      <button onClick={() => handleSoap('scrub')} className="w-full p-4 text-left group hover:bg-white/5 transition-colors border-b border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 group-hover:text-white">Scrub</p>
                        <p className="text-[7px] text-gray-700 uppercase">Industrial Tightening</p>
                      </button>
                      <button onClick={() => handleSoap('sanitize')} className="w-full p-4 text-left group hover:bg-white/5 transition-colors">
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-400">Sanitize</p>
                        <p className="text-[7px] text-gray-700 uppercase">PII Redaction Audit</p>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <button onClick={() => { setShowActionMenu(!showActionMenu); setShowSoapMenu(false); setShowSpeakMenu(false); }} className="bg-white text-black px-10 py-3 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-orange-500 hover:text-white transition-all">Actions</button>
                {showActionMenu && (
                  <div className="absolute right-0 mt-4 w-56 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm">
                    <button onClick={() => { ocrInputRef.current?.click(); setShowActionMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-white hover:bg-orange-500/10 border-b border-white/5">Paper to Pixel (OCR)</button>
                    <div className="bg-white/[0.02] p-2 text-[7px] font-black uppercase tracking-widest text-gray-700 px-4">Exports</div>
                    <button onClick={() => handleExport('docx')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5">Download .DOCX</button>
                    <button onClick={() => handleExport('md')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5">Download .MD</button>
                    <button onClick={() => { setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: '' } : c)); setShowActionMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-red-900 hover:text-red-500 hover:bg-red-500/10 border-t border-white/5">Clear Sheet</button>
                    <Link to="/sovereign-vault" className="w-full p-4 block text-left text-[9px] font-black uppercase tracking-widest text-orange-500/60 hover:text-orange-500 hover:bg-white/5 border-t border-white/5">Access Big House</Link>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="flex-grow flex flex-col px-12 py-12 overflow-y-auto custom-scrollbar">
           <div className="w-full max-w-none space-y-6 h-full flex flex-col relative">
              
              <div className="space-y-4">
                <textarea 
                  rows={1} 
                  value={activeChapter.title} 
                  onChange={(e) => { const val = e.target.value; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: val } : c)); }} 
                  className={`w-full bg-transparent border-none outline-none focus:ring-0 text-2xl md:text-3xl leading-tight tracking-tighter resize-none overflow-hidden ${currentFont.title}`} 
                  placeholder="HEADING" 
                />
                
                <div className="space-y-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-white/[0.03] py-4">
                    <button onClick={handleWrite} className={`flex flex-col items-start gap-1 group transition-all ${isWriting ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <span className={`text-xl font-serif italic transition-colors ${isWriting ? 'text-orange-500 underline decoration-orange-500/30' : 'text-white group-hover:text-orange-500'}`}>Write</span>
                        <span className="text-[7px] text-gray-700 font-bold uppercase tracking-widest">Initial Draft Mode</span>
                    </button>
                    <button onClick={() => { handleRefine(); setIsWriting(false); }} disabled={isSoaping} className={`flex flex-col items-start gap-1 group ${isSoaping ? 'animate-pulse' : 'opacity-60 hover:opacity-100'}`}>
                        <span className={`text-xl font-serif italic transition-colors ${isSoaping ? 'text-orange-500' : 'text-white group-hover:text-orange-500'}`}>Refine</span>
                        <span className="text-[7px] text-gray-700 font-bold uppercase tracking-widest">Light Rinse Protocol</span>
                    </button>
                    <button onClick={() => { handleArticulate(); setIsWriting(false); }} disabled={isRecording} className={`flex flex-col items-start gap-1 group ${isRecording ? 'animate-pulse' : 'opacity-60 hover:opacity-100'}`}>
                        <span className={`text-xl font-serif italic transition-colors ${isRecording ? 'text-cyan-400' : 'text-white group-hover:text-cyan-400'}`}>Articulate</span>
                        <span className="text-[7px] text-gray-700 font-bold uppercase tracking-widest">Diction Service</span>
                    </button>
                    <button onClick={() => { handleProduce(); setIsWriting(false); }} disabled={isExpanding} className={`flex flex-col items-start gap-1 group ${isExpanding ? 'animate-pulse' : 'opacity-60 hover:opacity-100'}`}>
                        <span className={`text-xl font-serif italic transition-colors ${isExpanding ? 'text-green-500' : 'text-white group-hover:text-green-500'}`}>Produce</span>
                        <span className="text-[7px] text-gray-700 font-bold uppercase tracking-widest">Scrub & Expansion</span>
                    </button>
                  </div>

                  <div className="pl-1 py-1">
                    <p className="text-[8px] text-gray-700 uppercase font-bold tracking-[0.5em] animate-living-amber leading-none">Sovereign Narrative Engine Protocol // v4.1</p>
                  </div>
                </div>
              </div>

              <div className="flex-grow flex flex-col relative group">
                <textarea 
                  ref={contentRef}
                  value={activeChapter.content} 
                  onFocus={() => setIsWriting(true)}
                  onBlur={() => setIsWriting(false)}
                  onChange={(e) => { if (isLimitReached) return; const val = e.target.value; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: val } : c)); }} 
                  className={`w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-400 text-xl font-serif leading-[2.2] transition-all ${currentFont.body} ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`} 
                  placeholder="The narrative begins here..." 
                />
                
                {/* SOVEREIGN WORD COUNTER - NESTED AT BOTTOM WITH AMBER GLOW */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent pointer-events-none">
                  <div className="flex items-center gap-4 bg-black/80 border border-white/10 px-6 py-3 rounded-sm w-fit pointer-events-auto shadow-[0_0_30px_rgba(230,126,34,0.05)]">
                    <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${isLimitReached ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : isWarningReached ? 'bg-orange-500 shadow-[0_0_15px_rgba(230,126,34,0.6)]' : 'bg-orange-500/40'}`} style={{ width: `${(wordCount / MAX_WORDS) * 100}%` }}></div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] animate-living-amber ${isWarningReached ? 'animate-pulse' : ''}`}>{wordCount} / {MAX_WORDS} WORDS</span>
                  </div>
                </div>
              </div>
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
