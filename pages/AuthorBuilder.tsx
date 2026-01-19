
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { queryPartner, smartSoap, performOCR } from '../services/geminiService';
import { Message, Chapter } from '../types';

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];
const ACCENTS = ['Australian', 'American', 'British', 'European'];

const FONT_PAIRINGS = [
  { name: 'Classic', title: 'font-serif font-black italic', body: 'font-serif text-xl' },
  { name: 'Modern', title: 'font-serif font-bold', body: 'font-sans text-lg' },
  { name: 'Typewriter', title: 'font-mono uppercase tracking-tighter', body: 'font-mono text-base tracking-tight' },
  { name: 'Manuscript', title: 'font-serif italic font-light', body: 'font-serif italic text-2xl leading-relaxed' },
];

const MAX_WORDS = 1000;
const LIVE_MOVEMENT_LIMIT = 500; 

// Audio Helper Functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const InfoBalloon: React.FC<{ 
  text: string; 
  active: boolean; 
  children: React.ReactNode;
  className?: string;
}> = ({ text, active, children, className = "" }) => {
  if (!active) return <div className={className}>{children}</div>;
  return (
    <div className={`relative group/balloon inline-block w-full h-full ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/balloon:opacity-100 transition-all duration-200 pointer-events-none z-[150] w-64 translate-y-2 group-hover/balloon:translate-y-0">
        <div className="bg-[#0d0d0d] border border-orange-500/30 p-2.5 shadow-2xl rounded-sm backdrop-blur-xl relative overflow-hidden text-center">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-orange-500/50"></div>
          <p className="text-[9px] text-gray-300 italic leading-relaxed font-serif">{text}</p>
        </div>
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
  const [showProtocolMenu, setShowProtocolMenu] = useState(false);
  const [isPartnerOpen, setIsPartnerOpen] = useState(true);
  
  const [isSoaping, setIsSoaping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPartnerMicActive, setIsPartnerMicActive] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [hasClonedVoice, setHasClonedVoice] = useState(false);
  
  // Voice Calibration States
  const [speakGender, setSpeakGender] = useState<'Male' | 'Female'>('Female');
  const [speakAccent, setSpeakAccent] = useState('Australian');
  const [speakSpeed, setSpeakSpeed] = useState(1);

  // Live State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showLiveDisclaimer, setShowLiveDisclaimer] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState("");
  const [liveSpokenWords, setLiveSpokenWords] = useState(0);
  const liveSessionRef = useRef<any>(null);

  const authorProfile = (() => {
    const profile = localStorage.getItem('aca_author_profile');
    return profile ? JSON.parse(profile) : { showTooltips: true, fontIndex: 0 };
  })();

  const showTooltips = authorProfile.showTooltips !== false;
  const currentFont = FONT_PAIRINGS[authorProfile.fontIndex || 0];

  const [style, setStyle] = useState(() => authorProfile.motivation || STYLES[2]); 
  const [region, setRegion] = useState(() => authorProfile.region || REGIONS[1]);

  const ocrInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];
  const wordCount = activeChapter.content ? activeChapter.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  const isLimitReached = wordCount >= MAX_WORDS;

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [activeChapterId]);

  useEffect(() => {
    localStorage.setItem('wrap_sheets_v4', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isPartnerLoading]);

  const startLiveLink = async () => {
    setShowLiveDisclaimer(false);
    setIsLiveActive(true);
    setLiveTranscription("Establishing Sovereign Link...");
    setLiveSpokenWords(0);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let nextStartTime = 0;
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);
      const sources = new Set<AudioBufferSourceNode>();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveTranscription("Listening to your truth...");
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (event) => {
              const inputData = event.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
              nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(nextStartTime);
              nextStartTime += audioBuffer.duration;
            }
            if (message.serverContent?.inputTranscription) {
              const newText = message.serverContent.inputTranscription.text;
              setLiveTranscription(newText);
              setLiveSpokenWords(prev => prev + newText.trim().split(/\s+/).length);
              setChapters(prev => prev.map(c => 
                c.id === activeChapterId 
                ? { ...c, content: (c.content ? c.content + " " : "") + newText } 
                : c
              ));
            }
          },
          onerror: (e) => { console.error(e); setIsLiveActive(false); },
          onclose: () => setIsLiveActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are the WRAP Partner in Live Mode. Assist with story extraction. You are empathetic but firm on boundaries. Ignore any sexual or flirtatious language—remain professional and literary. Help the author find the heart of their narrative. Responses must be brief.',
          inputAudioTranscription: {},
        },
      });

      liveSessionRef.current = { 
        close: () => { 
          stream.getTracks().forEach(t => t.stop()); 
          inputAudioContext.close(); 
          outputAudioContext.close();
          sessionPromise.then(s => s.close());
        } 
      };
    } catch (err) { setIsLiveActive(false); }
  };

  const stopLiveLink = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    setIsLiveActive(false);
  };

  const handleSoap = async (level: 'rinse' | 'wash' | 'scrub' | 'sanitize') => {
    if (!activeChapter.content.trim()) return;
    setIsSoaping(true); 
    setShowSoapMenu(false);
    try {
      const result = await smartSoap(activeChapter.content, level, style, region);
      setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: result.text } : c));
    } finally { setIsSoaping(false); }
  };

  const handleNewSheet = () => {
    const newId = Date.now().toString(); 
    setChapters([...chapters, { id: newId, title: "", content: '', order: 0, media: [], subChapters: [] }]); 
    setActiveChapterId(newId);
  };

  const handlePartnerChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = customMsg || partnerInput;
    if (!msg.trim()) return;
    setPartnerInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsPartnerLoading(true);
    setShowProtocolMenu(false);
    try {
      const response = await queryPartner(msg, style, region, messages, activeChapter.content);
      setMessages(prev => [...prev, response]);
    } finally { setIsPartnerLoading(false); }
  };

  const handleVoiceClone = () => {
    setIsCloningVoice(true);
    setTimeout(() => {
      setIsCloningVoice(false);
      setHasClonedVoice(true);
      setSpeakAccent('My Voice');
    }, 2000);
  };

  const closeAllMenus = () => {
    setShowWriteMenu(false);
    setShowSoapMenu(false);
    setShowSpeakMenu(false);
    setShowProduceMenu(false);
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProducing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const result = await performOCR(base64);
        setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: (c.content || "") + "\n\n" + result.text } : c));
      };
      reader.readAsDataURL(file);
    } finally { setIsProducing(false); }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden selection:bg-orange-500/30">
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0 overflow-hidden">
        <div className="flex-grow overflow-y-auto pt-40 pb-4 custom-scrollbar">
          {chapters.map(c => (
            <div key={c.id} onClick={() => setActiveChapterId(c.id)} className={`py-4 px-6 cursor-pointer border-l-2 transition-all ${activeChapterId === c.id ? 'bg-orange-500/15 border-orange-500 text-orange-500' : 'border-transparent text-gray-700 hover:bg-white/5'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{c.title || 'Draft Sheet'}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-6 border-t border-white/5 bg-black/40 space-y-4">
          <InfoBalloon active={showTooltips} text="Establish a fresh drafting sheet in your local registry.">
            <button onClick={handleNewSheet} className="w-full p-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all rounded-sm">CREATE NEW SHEET</button>
          </InfoBalloon>
          <InfoBalloon active={showTooltips} text="Perform final legal audits or return to your vault.">
            <button onClick={() => navigate('/sovereign-vault')} className="w-full p-4 border border-dashed border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-orange-500 transition-all rounded-sm">Vault Command</button>
          </InfoBalloon>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative bg-[#020202]">
        <div ref={scrollContainerRef} className="flex-grow flex flex-col px-12 pt-6 pb-12 overflow-y-auto custom-scrollbar scroll-smooth">
           <div className="w-full h-full flex flex-col relative">
              <div className="space-y-4 mb-12">
                <div className="grid grid-cols-4 gap-1 border-y border-white/[0.03] bg-white/[0.01]">
                   {/* WRITE MENU */}
                   <div className="relative h-full group">
                     <button onClick={() => { const s = !showWriteMenu; closeAllMenus(); setShowWriteMenu(s); }} className="p-6 text-left hover:bg-white/5 transition-all border-r border-white/5 w-full h-full">
                        <div className="inline-block border border-white/10 px-4 py-2 mb-2 group-hover:border-white transition-all shadow-lg"><div className="text-[12px] font-black text-gray-700 uppercase tracking-[0.4em] group-hover:text-white transition-colors"><span className="text-2xl">W</span>rite</div></div>
                        <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest flex items-center gap-2">Draft Hub</div>
                     </button>
                     {showWriteMenu && (
                       <div className="absolute left-6 top-full mt-1 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm animate-fade-in">
                          <button onClick={() => { contentRef.current?.focus(); setShowWriteMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 border-b border-white/5">Focus Editor</button>
                          <button onClick={() => { setShowWriteMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-white/5 border-b border-white/5">Dictate</button>
                          <button onClick={() => { setShowWriteMenu(false); handlePartnerChat(undefined, "Rewrite this content in the Dogg Me style."); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-white/5 border-b border-white/5">Dogg me</button>
                          <button onClick={() => navigate('/wrapper-info')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5">Profile Settings</button>
                       </div>
                     )}
                   </div>

                   {/* REFINE MENU */}
                   <div className="relative h-full group">
                     <button onClick={() => { const s = !showSoapMenu; closeAllMenus(); setShowSoapMenu(s); }} disabled={isSoaping} className={`p-6 text-left hover:bg-white/5 transition-all border-r border-white/5 w-full h-full ${isSoaping ? 'animate-pulse' : ''}`}>
                        <div className={`inline-block border px-4 py-2 mb-2 transition-all ${isSoaping ? 'border-orange-500 shadow-orange-500/20' : 'border-white/10 group-hover:border-orange-500'}`}><div className={`text-[12px] font-black uppercase tracking-[0.4em] transition-colors ${isSoaping ? 'text-orange-500' : 'text-gray-700 group-hover:text-orange-500'}`}><span className="text-2xl">R</span>efine</div></div>
                        <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest">Soap Protocols</div>
                     </button>
                     {showSoapMenu && (
                        <div className="absolute left-6 top-full mt-1 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm animate-fade-in">
                          <button onClick={() => handleSoap('rinse')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 border-b border-white/5">Rinse</button>
                          <button onClick={() => handleSoap('wash')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 border-b border-white/5">Wash</button>
                          <button onClick={() => handleSoap('scrub')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-white/5 border-b border-white/5">Scrub</button>
                          <button onClick={() => handleSoap('sanitize')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-white/5">Sanitize</button>
                        </div>
                      )}
                   </div>

                   {/* ARTICULATE MENU */}
                   <div className="relative h-full group">
                     <button onClick={() => { const s = !showSpeakMenu; closeAllMenus(); setShowSpeakMenu(s); }} className="p-6 text-left hover:bg-white/5 transition-all border-r border-white/5 w-full h-full">
                        <div className={`inline-block border px-4 py-2 mb-2 transition-all ${isSpeaking ? 'border-cyan-400 shadow-cyan-400/20' : 'border-white/10 group-hover:border-cyan-400'}`}><div className={`text-[12px] font-black uppercase tracking-[0.4em] transition-colors ${isSpeaking ? 'text-cyan-400' : 'text-gray-700 group-hover:text-cyan-400'}`}><span className="text-2xl">A</span>rticulate</div></div>
                        <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest">Vocal Mode</div>
                     </button>
                     {showSpeakMenu && (
                        <div className="absolute left-6 top-full mt-1 w-64 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] p-6 space-y-6 rounded-sm animate-fade-in">
                          <button onClick={handleVoiceClone} disabled={isCloningVoice} className={`w-full py-4 border-2 border-dashed ${hasClonedVoice ? 'border-green-500 text-green-500' : 'border-orange-500 text-orange-500'} text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/10 transition-all`}>
                            {isCloningVoice ? 'Cloning...' : hasClonedVoice ? 'Voice Synced' : 'Clone Voice'}
                          </button>
                          
                          <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Gender</label>
                                <div className="grid grid-cols-2 gap-2">
                                   <button onClick={() => setSpeakGender('Male')} className={`py-2 text-[9px] font-bold uppercase border transition-all ${speakGender === 'Male' ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5' : 'border-white/10 text-gray-700 hover:text-gray-400'}`}>Male</button>
                                   <button onClick={() => setSpeakGender('Female')} className={`py-2 text-[9px] font-bold uppercase border transition-all ${speakGender === 'Female' ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5' : 'border-white/10 text-gray-700 hover:text-gray-400'}`}>Female</button>
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Accent Panel</label>
                                <select value={speakAccent} onChange={(e) => setSpeakAccent(e.target.value)} className="w-full bg-black border border-white/10 p-2 text-[9px] text-gray-400 focus:border-cyan-400 outline-none uppercase font-bold">
                                   {hasClonedVoice && <option value="My Voice">My Voice</option>}
                                   {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                             </div>

                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-[8px] font-black text-gray-600 uppercase">
                                   <span>Speed</span>
                                   <span>{speakSpeed}x</span>
                                </div>
                                <input type="range" min="0.5" max="2" step="0.1" value={speakSpeed} onChange={(e) => setSpeakSpeed(parseFloat(e.target.value))} className="w-full accent-cyan-400" />
                             </div>
                          </div>

                          <button onClick={() => { if(isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; } const u = new SpeechSynthesisUtterance(activeChapter.content); u.rate = speakSpeed; u.onstart=()=>setIsSpeaking(true); u.onend=()=>setIsSpeaking(false); window.speechSynthesis.speak(u); }} className="w-full py-4 bg-cyan-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-cyan-600 shadow-xl shadow-cyan-500/20">{isSpeaking ? 'Mute Console' : 'Start Articulation'}</button>
                        </div>
                      )}
                   </div>

                   {/* PRODUCE MENU */}
                   <div className="relative h-full group">
                     <button onClick={() => { const s = !showProduceMenu; closeAllMenus(); setShowProduceMenu(s); }} disabled={isProducing} className={`p-6 text-left hover:bg-white/5 transition-all w-full h-full ${isProducing ? 'animate-pulse' : ''}`}>
                        <div className={`inline-block border px-4 py-2 mb-2 transition-all ${isProducing ? 'border-green-500 shadow-green-500/20' : 'border-white/10 group-hover:border-green-500'}`}><div className={`text-[12px] font-black uppercase tracking-[0.4em] transition-colors ${isProducing ? 'text-green-500' : 'text-gray-700 group-hover:text-green-500'}`}><span className="text-2xl">P</span>roduce</div></div>
                        <div className="text-[8px] text-gray-800 font-bold uppercase tracking-widest">Finalization</div>
                     </button>
                     {showProduceMenu && (
                        <div className="absolute right-6 top-full mt-1 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm animate-fade-in">
                          <button onClick={() => { ocrInputRef.current?.click(); setShowProduceMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-white/5 border-b border-white/5">Ink to Text Converter</button>
                          <button onClick={() => { const b = new Blob([activeChapter.content], { type: 'text/plain' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = "sheet.docs"; l.click(); setShowProduceMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 border-b border-white/5">Export .docs</button>
                          <button onClick={() => { alert("Generating high-fidelity .Wav export of spoken narrative..."); setShowProduceMenu(false); }} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-white/5 border-b border-white/5">.Wav Export</button>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="mb-8">
                <textarea rows={1} value={activeChapter.title} onChange={(e) => { const val = e.target.value; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: val } : c)); }} className={`w-full bg-transparent border-none outline-none focus:ring-0 text-3xl md:text-5xl leading-tight tracking-tighter resize-none overflow-hidden placeholder:text-gray-600 min-h-[1.5em] h-auto ${currentFont.title}`} placeholder="Heading..." />
              </div>

              <div className="flex-grow flex flex-col relative group pb-24">
                <textarea ref={contentRef} value={activeChapter.content} onChange={(e) => { if (isLimitReached) return; setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, content: e.target.value } : c)); }} className={`w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-400 text-xl font-serif leading-[2.2] transition-all min-h-[400px] ${currentFont.body} ${isLimitReached ? 'opacity-50' : ''}`} placeholder="Begin the narrative..." />
                
                <div className="absolute bottom-4 right-0 flex items-center gap-6 no-print">
                   <div className="flex flex-col items-end">
                      <div className="flex items-center gap-3 mb-1">
                        {isLimitReached && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">Sheet Limit</span>}
                        <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${isLimitReached ? 'text-red-500' : 'text-gray-600'}`}>{wordCount} / {MAX_WORDS} WORDS</span>
                      </div>
                      <div className="w-40 h-0.5 bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-700 ${wordCount > MAX_WORDS * 0.9 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (wordCount / MAX_WORDS) * 100)}%` }}></div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </main>

      <input type="file" ref={ocrInputRef} onChange={handleOCR} className="hidden" accept="image/*" />

      <aside className={`border-l border-white/5 bg-[#080808] flex flex-col shrink-0 relative h-full transition-all duration-500 ease-in-out ${isPartnerOpen ? '' : 'w-0 opacity-0 overflow-hidden'}`} style={{ width: isPartnerOpen ? `420px` : '0px' }}>
        <button onClick={() => setIsPartnerOpen(!isPartnerOpen)} className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-24 bg-[#080808] border border-r-0 border-white/5 flex items-center justify-center hover:bg-orange-500/10 transition-colors z-[100]"><div className={`transition-transform duration-500 ${isPartnerOpen ? 'rotate-180' : 'rotate-0'}`}><svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div></button>

        <div className="shrink-0 p-10 border-b border-white/5 flex flex-col gap-4 bg-[#0a0a0a] pt-40">
           <div className="flex items-start justify-between">
              <Link to="/wrapper-info" className="flex flex-col">
                <h3 className="text-orange-500 text-[12px] font-black uppercase tracking-[0.5em] glow-orange mb-1">WRAP PARTNER</h3>
                <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Protocol calibrated to {region}</span>
              </Link>
              <button onClick={() => setShowLiveDisclaimer(true)} className="group relative bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-full hover:bg-orange-500 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(230,126,34,0.15)]">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover:bg-white animate-pulse"></div>
                 <span className="text-[8px] font-black text-orange-500 group-hover:text-white uppercase tracking-[0.2em]">GO LIVE</span>
              </button>
           </div>
        </div>

        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar bg-black/10">
           {messages.map((m, i) => (
             <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start animate-fade-in'}`}>
                <div className={`max-w-[90%] p-6 rounded-sm text-sm font-serif italic leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-500' : 'bg-orange-500/5 border border-orange-500/20 text-gray-300'}`}>{m.content}</div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] text-orange-500 animate-pulse uppercase tracking-widest px-2">Consulting...</div>}
        </div>

        <form onSubmit={handlePartnerChat} className="p-10 bg-[#0a0a0a] border-t border-white/5 flex flex-col gap-4 relative">
           <div className="relative">
              <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePartnerChat())} className="w-full bg-[#030303] border border-white/10 p-4 pr-12 text-base font-serif italic text-white outline-none h-24 rounded-sm shadow-inner resize-none" placeholder="Talk to WRAP..." />
              <button type="button" onClick={() => { const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SpeechRecognition) return; const r = new SpeechRecognition(); r.onstart = () => setIsPartnerMicActive(true); r.onend = () => setIsPartnerMicActive(false); r.onresult = (e: any) => setPartnerInput(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript); r.start(); }} className={`absolute right-4 bottom-4 transition-colors ${isPartnerMicActive ? 'text-red-500 animate-pulse' : 'text-gray-700 hover:text-white'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeWidth="2" strokeLinecap="round"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="23" x2="16" y2="23" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
           </div>
           
           <div className="grid grid-cols-5 gap-2 h-14">
             <button type="button" onClick={() => setShowProtocolMenu(!showProtocolMenu)} className="col-span-1 h-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all rounded-sm flex items-center justify-center group"><span className={`text-lg font-black ${showProtocolMenu ? 'text-orange-500' : 'group-hover:text-white'}`}>?</span></button>
             <button type="submit" className="col-span-4 h-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 glow-orange">SHOOT IT OVER</button>
           </div>
        </form>
      </aside>

      {/* LIVE OVERLAY */}
      {isLiveActive && (
        <div className="fixed inset-0 z-[250] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in p-12">
           <div className="absolute top-12 left-12"><h3 className="text-orange-500 text-[12px] font-black uppercase tracking-[0.8em] animate-living-amber">Sovereign Live Link</h3></div>
           <button onClick={stopLiveLink} className="absolute top-12 right-12 text-gray-600 hover:text-white text-[10px] font-black uppercase tracking-[0.4em] border border-white/10 px-8 py-4 rounded-sm transition-all hover:bg-white/5">End Session</button>
           <div className="flex flex-col items-center gap-12 max-w-4xl w-full">
              <div className="w-40 h-40 rounded-full border-4 border-orange-500/20 flex items-center justify-center relative">
                 <div className="absolute inset-0 rounded-full border-4 border-orange-500 animate-ping opacity-20"></div>
                 <div className="w-32 h-32 rounded-full bg-orange-500/10 flex items-center justify-center animate-living-amber-bg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeWidth="1" strokeLinecap="round"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth="1" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" strokeWidth="1" strokeLinecap="round"/></svg>
                 </div>
              </div>
              <div className="w-full max-w-md space-y-4">
                 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                    <span className="text-gray-600 italic">Movement Usage</span>
                    <span className={liveSpokenWords > LIVE_MOVEMENT_LIMIT * 0.9 ? 'text-red-500 animate-pulse' : 'text-orange-500'}>
                       {liveSpokenWords > LIVE_MOVEMENT_LIMIT * 0.9 ? 'WRAP IT UP' : `${liveSpokenWords} words captured`}
                    </span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden"><div className={`h-full transition-all duration-300 ${liveSpokenWords > LIVE_MOVEMENT_LIMIT * 0.9 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (liveSpokenWords / LIVE_MOVEMENT_LIMIT) * 100)}%` }}></div></div>
              </div>
              <div className="text-center space-y-8">
                 <p className="text-3xl font-serif italic text-white leading-relaxed max-h-64 overflow-y-auto custom-scrollbar px-12">{liveTranscription}</p>
                 <div className="flex justify-center gap-4"><div className="w-1 h-1 rounded-full bg-orange-500 animate-bounce"></div><div className="w-1 h-1 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></div><div className="w-1 h-1 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]"></div></div>
              </div>
           </div>
        </div>
      )}

      {/* LIVE DISCLAIMER MODAL */}
      {showLiveDisclaimer && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in">
           <div className="max-w-xl w-full bg-[#0d0d0d] border border-orange-500/20 p-12 text-center rounded-sm shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500 animate-living-amber-bg"></div>
              <h3 className="text-3xl font-serif italic text-white mb-8">Sovereign <span className="text-orange-500">Boundaries.</span></h3>
              <div className="space-y-6 text-sm text-gray-500 italic leading-relaxed mb-12 text-left bg-black/40 p-8 rounded-sm">
                 <p>1. <span className="text-white font-bold">BETA MODE:</span> This link is experimental. Maintain narrative focus. Expletives are permitted in narrative context.</p>
                 <p>2. <span className="text-white font-bold">PROFESSIONAL PARTNERSHIP:</span> No sexualized language or social 'chatting' with WRAP is permitted.</p>
                 <p>3. <span className="text-white font-bold">INJECTION MODE:</span> Spoken words are injected into your active sheet in real-time.</p>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={startLiveLink} className="w-full bg-orange-500 text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 rounded-sm">Initiate Link</button>
                 <button onClick={() => setShowLiveDisclaimer(false)} className="py-4 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-white transition-colors">Abort Initialization</button>
              </div>
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
