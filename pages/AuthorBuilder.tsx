
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

const MAX_WORDS = 1000;

const PARTNER_PROTOCOLS = [
  { label: 'Tell Wrap more about myself', prompt: 'I want to tell you more about who I am to calibrate our partnership. Please ask me 3 specific questions about my journey and writing goals.' },
  { label: 'Understand how to use Wrap', prompt: 'Walk me through the core capabilities of the WRAP Protocol. How can you help me refine my narrative?' },
  { label: 'Summarise my sheet', prompt: 'Provide a concise, powerful summary of this active sheet. Highlight the core emotional themes.' },
  { label: 'Suggest a title', prompt: 'Based on this content, suggest 5 high-impact titles that fit the style and region we are working in.' },
  { label: 'Get through a writers block', prompt: 'I am stuck. Based on what I have written so far, give me 3 possible directions to take the next paragraph.' },
  { label: 'Brainstorm ideas', prompt: 'Let’s expand the world of this story. What are some background elements or character details we could explore?' },
  { label: 'Research a subject', prompt: 'Search for systemic or historical context related to the themes in this sheet to help ground the narrative in reality.' },
  { label: 'Access Support', prompt: 'I need to see the Support Hub or discuss resources for navigation through systemic pressure.' }
];

// Reusable Tooltip Component - Tightened for Horizon Alignment
const InfoBalloon: React.FC<{ 
  text: string; 
  active: boolean; 
  children: React.ReactNode;
  position?: 'top' | 'bottom' 
}> = ({ text, active, children, position = 'top' }) => {
  if (!active) return <>{children}</>;
  
  const isBottom = position === 'bottom';
  
  return (
    <div className="relative group/balloon inline-block w-full h-full">
      {children}
      <div className={`absolute left-1/2 -translate-x-1/2 opacity-0 group-hover/balloon:opacity-100 transition-all duration-200 pointer-events-none z-[150] w-64 
        ${isBottom 
          ? 'top-full mt-0.5 translate-y-[-2px] group-hover/balloon:translate-y-0' 
          : 'bottom-full mb-0.5 translate-y-[2px] group-hover/balloon:translate-y-0'
        }`}>
        <div className="bg-[#0d0d0d] border border-orange-500/30 p-2.5 shadow-2xl rounded-sm backdrop-blur-xl relative overflow-hidden text-center">
          <div className={`absolute left-0 w-full h-[1px] bg-orange-500/50 ${isBottom ? 'top-0' : 'bottom-0'}`}></div>
          <p className="text-[9px] text-gray-300 italic leading-relaxed font-serif">
            {text}
          </p>
        </div>
        <div className={`w-2 h-2 bg-[#0d0d0d] rotate-45 absolute left-1/2 -translate-x-1/2 
          ${isBottom 
            ? '-top-1 border-l border-t border-orange-500/30' 
            : '-bottom-1 border-r border-b border-orange-500/30'
          }`}></div>
      </div>
    </div>
  );
};

const AuthorBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('wrap_sheets_v4');
    return saved ? JSON.parse(saved) : [{ id: '1', title: "", content: '', order: 0, media: [], subChapters: [] }];
  });
  
  const [activeChapterId, setActiveChapterId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);
  
  const [showWriteMenu, setShowWriteMenu] = useState(false);
  const [showSoapMenu, setShowSoapMenu] = useState(false);
  const [showSpeakMenu, setShowSpeakMenu] = useState(false);
  const [showProduceMenu, setShowProduceMenu] = useState(false);
  const [showVoiceTraining, setShowVoiceTraining] = useState(false);
  const [showProtocolMenu, setShowProtocolMenu] = useState(false);
  const [isPartnerOpen, setIsPartnerOpen] = useState(true);
  
  const [isSoaping, setIsSoaping] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPartnerMicActive, setIsPartnerMicActive] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [isCalibratingVoice, setIsCalibratingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  
  const [wrapperWidth, setWrapperWidth] = useState(420); 

  const authorProfile = (() => {
    const profile = localStorage.getItem('aca_author_profile');
    return profile ? JSON.parse(profile) : { showTooltips: true, fontIndex: 0 };
  })();

  const showTooltips = authorProfile.showTooltips !== false;
  const currentFont = FONT_PAIRINGS[authorProfile.fontIndex || 0];

  const [style, setStyle] = useState(() => authorProfile.motivation || STYLES[2]); 
  const [region, setRegion] = useState(() => authorProfile.region || REGIONS[1]);

  const [speakGender, setSpeakGender] = useState<'male' | 'female'>('female');
  const [speakSpeed, setSpeakSpeed] = useState(1);
  const [speakLang, setSpeakLang] = useState('en-AU');
  const [useClonedVoice, setUseClonedVoice] = useState(false);

  const ocrInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];
  const wordCount = activeChapter.content ? activeChapter.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  const isLimitReached = wordCount >= MAX_WORDS;

  // CRITICAL: Force Scroll to Top on entry and chapter switch
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeChapterId]);

  useEffect(() => {
    localStorage.setItem('wrap_sheets_v4', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    if (messages.length === 0 && authorProfile.name) {
      setMessages([{ 
        role: 'assistant', 
        content: `Sovereign Link Established. The WRAP Protocol is online. Ready to calibrate your truth.` 
      }]);
    }
  }, [style, region]);

  // CRITICAL: Manual Scroll Logic to prevent browser-level focus jumping
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isPartnerLoading]);

  const handleSoap = async (level: 'rinse' | 'scrub' | 'sanitize') => {
    if (!activeChapter.content.trim()) return;
    setIsSoaping(true); 
    setShowSoapMenu(false);
    try {
      const result = await smartSoap(activeChapter.content, level, style, region);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
    } finally { setIsSoaping(false); }
  };

  const handleDoggMe = async () => {
    if (!activeChapter.content.trim() || isSoaping) return;
    setIsSoaping(true);
    setShowWriteMenu(false);
    try {
      const prompt = `TRANSFORM THE FOLLOWING TEXT INTO DOGGEREL. Use the grit of ${region}. Format as stanzas.\n\nTEXT:\n${activeChapter.content}`;
      const response = await queryPartner(prompt, style, region, [], activeChapter.content);
      if (response.content) {
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: response.content } : c));
      }
    } finally { setIsSoaping(false); }
  };

  const handleProduce = async () => {
    if (!activeChapter.content.trim() || isProducing) return;
    setIsProducing(true);
    setShowProduceMenu(false);
    try {
      const prompt = `EXPAND THE NARRATIVE BY 50%. ADD VIVID SENSORY DETAILS APPROPRIATE FOR ${style.toUpperCase()}. RETAIN THE RAW EMOTIONAL TEXTURE. OUTPUT ONLY THE EXPANDED STORY.\n\nTEXT:\n${activeChapter.content}`;
      const response = await queryPartner(prompt, style, region, [], activeChapter.content);
      if (response.content) {
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: response.content } : c));
      }
    } finally { setIsProducing(false); }
  };

  const handleDictate = (target: 'sheet' | 'partner') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Browser unavailable for dictation."); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speakLang;

    if (target === 'sheet') {
      setShowWriteMenu(false);
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content ? c.content + ' ' : '') + transcript } : c));
      };
    } else {
      recognition.onstart = () => setIsPartnerMicActive(true);
      recognition.onend = () => setIsPartnerMicActive(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPartnerInput(prev => (prev ? prev + ' ' : '') + transcript);
      };
    }
    recognition.start();
  };

  const handleSpeak = () => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    if (!activeChapter.content.trim()) return;
    const utterance = new SpeechSynthesisUtterance(activeChapter.content);
    utterance.lang = speakLang;
    utterance.rate = speakSpeed;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === speakLang && (speakGender === 'female' ? v.name.includes('Female') : v.name.includes('Male')));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceCalibration = () => {
    setIsCalibratingVoice(true);
    setVoiceProgress(0);
    const interval = setInterval(() => {
      setVoiceProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCalibratingVoice(false);
          setShowVoiceTraining(false);
          setUseClonedVoice(true);
          return 100;
        }
        return prev + 3.33;
      });
    }, 1000);
  };

  const handleExport = (format: 'txt' | 'md' | 'docx') => {
    const blob = new Blob([activeChapter.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeChapter.title || 'sheet'}.${format}`;
    link.click();
    setShowProduceMenu(false);
  };

  const handlePartnerChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = customMsg || partnerInput;
    if (!msg.trim()) return;
    const userMsg = msg;
    setPartnerInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsPartnerLoading(true);
    setShowProtocolMenu(false);
    try {
      const response = await queryPartner(userMsg, style, region, messages, activeChapter.content);
      setMessages(prev => [...prev, response]);
    } finally { setIsPartnerLoading(false); }
  };

  const closeAllMenus = () => {
    setShowWriteMenu(false);
    setShowSoapMenu(false);
    setShowSpeakMenu(false);
    setShowProduceMenu(false);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden selection:bg-orange-500/30">
      {/* SIDEBAR - Lifted for Logo Clearance */}
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0 overflow-hidden">
        <div className="flex-grow overflow-y-auto pt-40 pb-4 custom-scrollbar">
          {chapters.map(c => (
            <div key={c.id} onClick={() => setActiveChapterId(c.id)} className={`py-4 px-6 cursor-pointer border-l-2 transition-all ${activeChapterId === c.id ? 'bg-orange-500/15 border-orange-500 text-orange-500' : 'border-transparent text-gray-700 hover:bg-white/5'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{c.title || 'Change this Heading'}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-6 border-t border-white/5 bg-black/40 space-y-4">
          <InfoBalloon active={showTooltips} position="top" text="Finalize your work. Perform legal audits and format for print or Substack.">
            <Link to="/wrap-it-up" className="w-full p-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all rounded-sm flex items-center justify-center">Mastering Suite</Link>
          </InfoBalloon>
          <InfoBalloon active={showTooltips} position="top" text="Create a new drafting sheet in your registry.">
            <button onClick={() => { const newId = Date.now().toString(); setChapters([...chapters, { id: newId, title: "", content: '', order: 0, media: [], subChapters: [] }]); setActiveChapterId(newId); }} className="w-full p-4 border border-dashed border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-orange-500 transition-all rounded-sm">+ New Sheet</button>
          </InfoBalloon>
        </div>
      </aside>

      {/* ENGINE */}
      <main className="flex-grow flex flex-col relative bg-[#020202]">
        {/* Adjusted pt-6 lifts the horizon bar underneath the Logo */}
        <div ref={scrollContainerRef} className="flex-grow flex flex-col px-12 pt-6 pb-12 overflow-y-auto custom-scrollbar scroll-smooth">
           <div className="w-full max-w-none h-full flex flex-col relative">
              <div className="space-y-4 mb-12">
                <div className="grid grid-cols-4 gap-1 border-y border-white/[0.03] bg-white/[0.01]">
                   {/* WRITE HUB - Inverted Tooltip to 'bottom' to clear Navbar */}
                   <InfoBalloon active={showTooltips} position="bottom" text="Writing Hub: Input methods, Dictation, Dogg Me, and WRAP Profile Settings.">
                     <div className="relative h-full group">
                       <button onClick={() => { closeAllMenus(); setShowWriteMenu(!showWriteMenu); }} className="p-6 text-left hover:bg-white/5 transition-all border-r border-white/5 w-full h-full">
                          <div className="inline-block border border-white/10 px-4 py-2 mb-2 group-hover:border-white transition-all shadow-lg group-hover:shadow-white/5">
                            <div className="text-[12px] font-black text-gray-700 uppercase tracking-[0.4em] group-hover:text-white transition-colors">
                              <span className="text-2xl">W</span>rite
                            </div>
                          </div>
                          <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest flex items-center gap-2">Draft Hub <svg className={`w-2 h-2 transition-transform ${showWriteMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                       </button>
                       {showWriteMenu && (
                         <div className="absolute left-6 top-full mt-1 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm animate-fade-in">
                            <button onClick={() => { contentRef.current?.focus(); setShowWriteMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 border-b border-white/5">Focus Editor</button>
                            <button onClick={() => handleDictate('sheet')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-white/5 border-b border-white/5 flex items-center justify-between">Dictate {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}</button>
                            <button onClick={handleDoggMe} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-white/5 border-b border-white/5">Dogg Me</button>
                            <button onClick={() => navigate('/wrapper-info')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5">Profile Settings</button>
                         </div>
                       )}
                     </div>
                   </InfoBalloon>

                   {/* REFINE HUB - Inverted Tooltip */}
                   <InfoBalloon active={showTooltips} position="bottom" text="Refine Hub: Industrial soap protocols to tighten your prose while protecting dialect.">
                     <div className="relative h-full group">
                       <button onClick={() => { closeAllMenus(); setShowSoapMenu(!showSoapMenu); }} disabled={isSoaping} className={`p-6 text-left hover:bg-white/5 transition-all border-r border-white/5 w-full h-full ${isSoaping ? 'animate-pulse' : ''}`}>
                          <div className={`inline-block border px-4 py-2 mb-2 transition-all ${isSoaping ? 'border-orange-500 shadow-orange-500/20 shadow-lg' : 'border-white/10 group-hover:border-orange-500 group-hover:shadow-orange-500/10 shadow-lg'}`}>
                            <div className={`text-[12px] font-black uppercase tracking-[0.4em] transition-colors ${isSoaping ? 'text-orange-500' : 'text-gray-700 group-hover:text-orange-500'}`}>
                              <span className="text-2xl">R</span>efine
                            </div>
                          </div>
                          <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest flex items-center gap-2">Soap Protocols <svg className={`w-2 h-2 transition-transform ${showSoapMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                       </button>
                       {showSoapMenu && (
                          <div className="absolute left-6 top-full mt-1 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm animate-fade-in">
                            <button onClick={(e) => { e.stopPropagation(); handleSoap('rinse'); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 border-b border-white/5">Rinse</button>
                            <button onClick={(e) => { e.stopPropagation(); handleSoap('scrub'); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-white/5 border-b border-white/5">Scrub</button>
                            <button onClick={(e) => { e.stopPropagation(); handleSoap('sanitize'); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-white/5">Sanitize</button>
                          </div>
                        )}
                     </div>
                   </InfoBalloon>

                   {/* ARTICULATE HUB - Inverted Tooltip */}
                   <InfoBalloon active={showTooltips} position="bottom" text="Vocal Hub: Configure speak console, clone your voice, and set speed or gender.">
                     <div className="relative h-full group">
                       <button onClick={() => { closeAllMenus(); setShowSpeakMenu(!showSpeakMenu); }} className="p-6 text-left hover:bg-white/5 transition-all border-r border-white/5 w-full h-full">
                          <div className={`inline-block border px-4 py-2 mb-2 transition-all ${isSpeaking ? 'border-cyan-400 shadow-cyan-400/20 shadow-lg' : 'border-white/10 group-hover:border-cyan-400 group-hover:shadow-cyan-400/10 shadow-lg'}`}>
                            <div className={`text-[12px] font-black uppercase tracking-[0.4em] transition-colors ${isSpeaking ? 'text-cyan-400' : 'text-gray-700 group-hover:text-cyan-400'}`}>
                              <span className="text-2xl">A</span>rticulate
                            </div>
                          </div>
                          <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest flex items-center gap-2">Vocal Mode <svg className={`w-2 h-2 transition-transform ${showSpeakMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                       </button>
                       {showSpeakMenu && (
                          <div className="absolute left-6 top-full mt-1 w-56 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] p-6 space-y-4 rounded-sm animate-fade-in">
                            <div className="space-y-1">
                              <label className="text-[7px] text-gray-600 uppercase font-bold">Identity</label>
                              <button onClick={() => !useClonedVoice && setShowVoiceTraining(true)} className={`w-full py-2 border border-white/10 text-[9px] font-bold tracking-widest uppercase transition-all ${useClonedVoice ? 'border-orange-500 text-orange-500' : 'text-gray-500 hover:text-white'}`}>
                                {useClonedVoice ? 'My Voice: Active' : 'Clone Voice Profile'}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[7px] text-gray-600 uppercase font-bold">Gender</label>
                                <select value={speakGender} onChange={(e) => setSpeakGender(e.target.value as any)} className="w-full bg-black border border-white/10 text-[9px] text-gray-400 p-1">
                                  <option value="female">Female</option>
                                  <option value="male">Male</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[7px] text-gray-600 uppercase font-bold">Speed</label>
                                <select value={speakSpeed} onChange={(e) => setSpeakSpeed(parseFloat(e.target.value))} className="w-full bg-black border border-white/10 text-[9px] text-gray-400 p-1">
                                  <option value="0.8">0.8x</option>
                                  <option value="1">1.0x</option>
                                  <option value="1.2">1.2x</option>
                                </select>
                              </div>
                            </div>
                            <button onClick={handleSpeak} className="w-full py-3 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600">{isSpeaking ? 'Stop Speak' : 'Start Console'}</button>
                          </div>
                        )}
                     </div>
                   </InfoBalloon>

                   {/* PRODUCE HUB - Inverted Tooltip */}
                   <InfoBalloon active={showTooltips} position="bottom" text="Produce Hub: AI Mastering, OCR Scanning, DOCX Export, and Sheet Reset.">
                     <div className="relative h-full group">
                       <button onClick={() => { closeAllMenus(); setShowProduceMenu(!showProduceMenu); }} disabled={isProducing} className={`p-6 text-left hover:bg-white/5 transition-all w-full h-full ${isProducing ? 'animate-pulse' : ''}`}>
                          <div className={`inline-block border px-4 py-2 mb-2 transition-all ${isProducing ? 'border-green-500 shadow-green-500/20 shadow-lg' : 'border-white/10 group-hover:border-green-500 group-hover:shadow-green-500/10 shadow-lg'}`}>
                            <div className={`text-[12px] font-black uppercase tracking-[0.4em] transition-colors ${isProducing ? 'text-green-500' : 'text-gray-700 group-hover:text-green-500'}`}>
                              <span className="text-2xl">P</span>roduce
                            </div>
                          </div>
                          <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest flex items-center gap-2">Finalization <svg className={`w-2 h-2 transition-transform ${showProduceMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                       </button>
                       {showProduceMenu && (
                          <div className="absolute right-6 top-full mt-1 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm animate-fade-in">
                            <button onClick={handleProduce} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-white/5 border-b border-white/5">Expand (Mastering)</button>
                            <button onClick={() => { ocrInputRef.current?.click(); setShowProduceMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-white/5 border-b border-white/5">OCR Scanner</button>
                            <button onClick={() => handleExport('docx')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 border-b border-white/5">Export .DOCX</button>
                            <button onClick={() => { setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: '' } : c)); setShowProduceMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-red-900 hover:text-red-500 border-t border-white/5">Clear Sheet</button>
                          </div>
                        )}
                     </div>
                   </InfoBalloon>
                </div>
              </div>

              {/* PRIMARY HEADING */}
              <div className="mb-8">
                <textarea 
                  rows={1} 
                  value={activeChapter.title} 
                  onChange={(e) => { const val = e.target.value; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: val } : c)); }} 
                  className={`w-full bg-transparent border-none outline-none focus:ring-0 text-3xl md:text-5xl leading-tight tracking-tighter resize-none overflow-hidden placeholder:text-gray-600 min-h-[1.5em] h-auto ${currentFont.title}`} 
                  placeholder="Change this Heading" 
                />
              </div>

              {/* STORY CONTENT AREA */}
              <div className="flex-grow flex flex-col relative group">
                <textarea ref={contentRef} value={activeChapter.content} onChange={(e) => { if (isLimitReached) return; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: e.target.value } : c)); }} className={`w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-400 text-xl font-serif leading-[2.2] transition-all min-h-[400px] ${currentFont.body} ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`} placeholder="Begin the narrative..." />
              </div>
           </div>
        </div>
        <input type="file" ref={ocrInputRef} onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return; setIsOCRLoading(true);
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            const result = await performOCR(base64);
            setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content ? c.content + '\n\n' : '') + result.text } : c));
            setIsOCRLoading(false);
          };
          reader.readAsDataURL(file);
        }} className="hidden" accept="image/*" />
      </main>

      {/* PARTNER ASIDE */}
      <aside 
        className={`border-l border-white/5 bg-[#080808] flex flex-col shrink-0 relative no-print h-full transition-all duration-500 ease-in-out ${isPartnerOpen ? '' : 'w-0 opacity-0 overflow-hidden'}`} 
        style={{ width: isPartnerOpen ? `${wrapperWidth}px` : '0px' }}
      >
        <button 
          onClick={() => setIsPartnerOpen(!isPartnerOpen)} 
          className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-24 bg-[#080808] border border-r-0 border-white/5 flex items-center justify-center hover:bg-orange-500/10 transition-colors z-[100]"
        >
          <div className={`transition-transform duration-500 ${isPartnerOpen ? 'rotate-180' : 'rotate-0'}`}>
             <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </button>

        <div className="shrink-0 p-10 border-b border-white/5 flex flex-col gap-4 bg-[#0a0a0a] pt-40">
           <Link to="/wrapper-info" className="flex flex-col">
             <h3 className="text-orange-500 text-[12px] font-black uppercase tracking-[0.5em] glow-orange mb-1">WRAP PARTNER</h3>
             <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Protocol calibrated to {region} / {style}</span>
           </Link>
           <div className="grid grid-cols-2 gap-3 mt-4">
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="bg-black border border-white/10 text-[9px] text-gray-400 p-2 focus:border-orange-500 outline-none">
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="bg-black border border-white/10 text-[9px] text-gray-400 p-2 focus:border-orange-500 outline-none">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
           </div>
        </div>

        {/* CHAT CONTAINER - Uses ref for internal scroll only */}
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar bg-black/10">
           {messages.map((m, i) => (
             <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start animate-fade-in'}`}>
                <div className={`max-w-[90%] p-6 rounded-sm text-sm font-serif italic leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-500 italic' : 'bg-orange-500/5 border border-orange-500/20 text-gray-300 shadow-lg shadow-orange-500/5'}`}>{m.content}</div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] text-orange-500 animate-pulse uppercase tracking-widest">Consulting...</div>}
        </div>

        <form onSubmit={handlePartnerChat} className="p-10 bg-[#0a0a0a] border-t border-white/5 flex flex-col gap-4 relative">
           {showProtocolMenu && (
             <div className="absolute bottom-full left-10 right-10 mb-2 bg-[#0d0d0d] border border-orange-500/20 shadow-2xl z-[150] overflow-hidden rounded-sm animate-fade-in">
               <div className="p-3 bg-orange-500/5 border-b border-orange-500/10 flex justify-between items-center">
                 <span className="text-[7px] font-black uppercase tracking-widest text-orange-500">Query Protocols</span>
                 <button onClick={() => setShowProtocolMenu(false)} className="text-gray-600 hover:text-white text-xl leading-none">×</button>
               </div>
               <div className="max-h-60 overflow-y-auto custom-scrollbar">
                 {PARTNER_PROTOCOLS.map((protocol, i) => (
                   <button 
                     key={i} 
                     type="button"
                     onClick={() => handlePartnerChat(undefined, protocol.prompt)}
                     className="w-full p-4 text-left text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:bg-orange-500/10 hover:text-orange-500 border-b border-white/5 transition-all last:border-none"
                   >
                     {protocol.label}
                   </button>
                 ))}
               </div>
             </div>
           )}

           <div className="relative">
              <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePartnerChat())} className="w-full bg-[#030303] border border-white/10 p-4 pr-12 text-base font-serif italic text-white outline-none h-24 rounded-sm shadow-inner resize-none" placeholder="Talk to WRAP..." />
              <button type="button" onClick={() => handleDictate('partner')} className={`absolute right-4 bottom-4 transition-colors ${isPartnerMicActive ? 'text-red-500 animate-pulse' : 'text-gray-700 hover:text-white'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z"/><path d="M11 13a3 3 0 11-6 0V4a3 3 0 116 0v4z"/></svg>
              </button>
           </div>
           
           <div className="grid grid-cols-5 gap-2">
             <button 
               type="button" 
               onClick={() => setShowProtocolMenu(!showProtocolMenu)}
               className="col-span-1 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-sm flex items-center justify-center group"
             >
               <svg className={`w-4 h-4 transition-transform ${showProtocolMenu ? 'rotate-180 text-orange-500' : 'group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </button>
             <button type="submit" className="col-span-4 bg-orange-500 text-white py-4 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 glow-orange animate-living-amber-bg">Sync Pulse</button>
           </div>
        </form>
      </aside>

      {/* Floating Toggle if collapsed */}
      {!isPartnerOpen && (
        <button 
          onClick={() => setIsPartnerOpen(true)} 
          className="fixed right-6 bottom-12 w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-[150] animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}

      {/* VOICE TRAINING MODAL */}
      {showVoiceTraining && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 p-12 text-center shadow-2xl rounded-sm">
             <h3 className="text-3xl font-serif italic text-white mb-6">Voice <span className="text-orange-500">Calibration.</span></h3>
             <p className="text-gray-500 text-sm italic leading-relaxed mb-10">Read naturally for 30 seconds to synchronize the engine with your frequency.</p>
             {isCalibratingVoice ? (
               <div className="space-y-8">
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${voiceProgress}%` }}></div>
                 </div>
                 <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">Syncing Frequency...</p>
               </div>
             ) : (
               <button onClick={startVoiceCalibration} className="w-full bg-orange-500 text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 rounded-sm">Begin 30s Session</button>
             )}
             <button onClick={() => setShowVoiceTraining(false)} className="mt-8 text-gray-700 hover:text-white text-[9px] font-bold uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AuthorBuilder;
