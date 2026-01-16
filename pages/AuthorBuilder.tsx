
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { queryPartner, smartSoap, jiveContent, generateSpeech, analyzeVoiceAndDialect } from '../services/geminiService';
import { Message, Chapter, MediaAsset } from '../types';

// Declare mammoth for Word import
declare const mammoth: any;

const PERSONAS = ['Standard', 'Bogan', 'Hillbilly', 'Homeboy', 'Lad', 'Eshay', 'Chav', 'Bogger', 'Gopnik', 'Scouse', 'Valley', 'Posh'];
const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const SPEEDS = [
  { label: '0.8x', value: 0.8 },
  { label: '1.0x', value: 1.0 },
  { label: '1.2x', value: 1.2 },
  { label: '1.5x', value: 1.5 }
];
const VOICES = [
  { id: 'Fenrir', label: 'Male 1 (Deep)', type: 'male' },
  { id: 'Charon', label: 'Male 2 (Soft)', type: 'male' },
  { id: 'Zephyr', label: 'Female 1 (Warm)', type: 'female' },
  { id: 'Kore', label: 'Female 2 (Clear)', type: 'female' },
  { id: 'Puck', label: 'Cartoon (Rando)', type: 'cartoon' },
];

const DEFAULT_TITLE = "In the beginning was the word...";

const FONT_PAIRINGS = [
  { name: 'Classic', title: 'font-serif font-black italic', body: 'font-serif text-xl' },
  { name: 'Modern', title: 'font-serif font-bold', body: 'font-sans text-lg' },
  { name: 'Typewriter', title: 'font-mono uppercase tracking-tighter', body: 'font-mono text-base tracking-tight' },
  { name: 'Manuscript', title: 'font-serif italic font-light', body: 'font-serif italic text-2xl leading-relaxed' },
];

function pcmToWavBlob(base64: string, sampleRate: number = 24000): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, len, true);
  return new Blob([header, bytes], { type: 'audio/wav' });
}

const AuthorBuilder: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('wrap_sheets_v4');
    return saved ? JSON.parse(saved) : [{ id: '1', title: DEFAULT_TITLE, content: '', order: 0, media: [], subChapters: [] }];
  });
  
  const [activeChapterId, setActiveChapterId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);
  const [fontIndex, setFontIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isPartnerListening, setIsPartnerListening] = useState(false);
  const [showSoapMenu, setShowSoapMenu] = useState(false);
  const [showSpeakMenu, setShowSpeakMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isSoaping, setIsSoaping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // WRAPPER Settings
  const [style, setStyle] = useState(STYLES[2]); 
  const [region, setRegion] = useState(REGIONS[1]);

  // Custom Dialect / Virty Engine States
  const [uiStrings, setUiStrings] = useState<Record<string, string>>({
    registry: "Registry",
    sheets: "My Sheets",
    actions: "Actions",
    speak: "Speak",
    dictate: "Dictate",
    soap: "Drop the Soap",
    mastering: "Mastering Suite",
    newSheet: "New Sheet"
  });
  const [customPersona, setCustomPersona] = useState<string>("");
  const [detectedLocale, setDetectedLocale] = useState<string>("Standard");
  const [isVoiceLabOpen, setIsVoiceLabOpen] = useState(false);
  const [isRecordingLab, setIsRecordingLab] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  // Speak Settings
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const partnerRecognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Helper to find nested chapters
  const findChapterById = (list: Chapter[], id: string): Chapter | undefined => {
    for (const c of list) {
      if (c.id === id) return c;
      if (c.subChapters) {
        const found = findChapterById(c.subChapters, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeChapter = findChapterById(chapters, activeChapterId) || chapters[0];

  useEffect(() => {
    localStorage.setItem('wrap_sheets_v4', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          const updateChapterInList = (list: Chapter[]): Chapter[] => {
            return list.map(c => {
              if (c.id === activeChapterId) return { ...c, content: (c.content ? c.content + ' ' : '') + transcript };
              if (c.subChapters) return { ...c, subChapters: updateChapterInList(c.subChapters) };
              return c;
            });
          };
          setChapters(prev => updateChapterInList(prev));
        }
      };

      partnerRecognitionRef.current = new SpeechRecognition();
      partnerRecognitionRef.current.continuous = false;
      partnerRecognitionRef.current.interimResults = true;
      partnerRecognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
        }
        if (transcript) setPartnerInput(prev => prev + transcript);
      };
      partnerRecognitionRef.current.onend = () => setIsPartnerListening(false);
    }
  }, [activeChapterId]);

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPartnerLoading]);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { setIsListening(true); recognitionRef.current?.start(); }
  };

  const togglePartnerListening = () => {
    if (isPartnerListening) { partnerRecognitionRef.current?.stop(); setIsPartnerListening(false); }
    else { setIsPartnerListening(true); partnerRecognitionRef.current?.start(); }
  };

  const startVoiceLabRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];
    
    recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setIsPartnerLoading(true);
        try {
          const results = await analyzeVoiceAndDialect(base64);
          if (results) {
            setUiStrings(prev => ({ ...prev, ...results.uiTranslations }));
            setCustomPersona(results.personaInstruction);
            setDetectedLocale(results.detectedLocale);
            setSelectedPersona('MyVoice');
          }
        } finally {
          setIsPartnerLoading(false);
          setIsVoiceLabOpen(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    recorder.start();
    setIsRecordingLab(true);
    setRecordingProgress(0);
    
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setRecordingProgress((count / 30) * 100);
      if (count >= 30) {
        clearInterval(interval);
        stopVoiceLabRecording();
      }
    }, 1000);
  };

  const stopVoiceLabRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingLab(false);
  };

  const handleSoap = async (level: 'rinse' | 'scrub' | 'sanitize') => {
    if (!activeChapter.content.trim()) return;
    setIsSoaping(true);
    setShowSoapMenu(false);
    try {
      const result = await smartSoap(activeChapter.content, level);
      const updateChapterInList = (list: Chapter[]): Chapter[] => {
        return list.map(c => {
          if (c.id === activeChapterId) return { ...c, content: result };
          if (c.subChapters) return { ...c, subChapters: updateChapterInList(c.subChapters) };
          return c;
        });
      };
      setChapters(prev => updateChapterInList(prev));
    } finally {
      setIsSoaping(false);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }
    if (!activeChapter.content.trim()) return;
    setIsSpeaking(true);
    setShowSpeakMenu(false);
    try {
      const finalPersonaInstruction = (selectedPersona === 'MyVoice' && customPersona) ? customPersona : "";
      const base64Audio = await generateSpeech(activeChapter.content, selectedVoice, selectedPersona, finalPersonaInstruction);
      if (base64Audio) {
        const blob = pcmToWavBlob(base64Audio, 24000);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preservesPitch = true;
        audio.playbackRate = selectedSpeed;
        audio.onended = () => setIsSpeaking(false);
        audioRef.current = audio;
        audio.play();
      } else { setIsSpeaking(false); }
    } catch (err) { setIsSpeaking(false); }
  };

  const handlePartnerChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!partnerInput.trim()) return;

    const userMsg = partnerInput;
    setPartnerInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsPartnerLoading(true);

    try {
      const response = await queryPartner(userMsg, style, region, messages, activeChapter.content);
      setMessages(prev => [...prev, response]);
    } finally {
      setIsPartnerLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    
    if (file.name.endsWith('.docx')) {
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        
        // Basic parser to split by H1/H2
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const nodes = Array.from(doc.body.childNodes);
        
        let newChapters: Chapter[] = [];
        let currentChapter: Chapter | null = null;
        
        nodes.forEach((node, idx) => {
          const text = node.textContent?.trim() || "";
          if (node.nodeName === 'H1') {
            currentChapter = { id: `h1-${idx}`, title: text, content: '', order: newChapters.length, media: [], subChapters: [] };
            newChapters.push(currentChapter);
          } else if (node.nodeName === 'H2' && currentChapter) {
            currentChapter.subChapters?.push({ id: `h2-${idx}`, title: text, content: '', order: currentChapter.subChapters.length, media: [], subChapters: [] });
          } else if (text) {
             const target = currentChapter?.subChapters && currentChapter.subChapters.length > 0 
               ? currentChapter.subChapters[currentChapter.subChapters.length - 1] 
               : currentChapter;
             
             if (target) target.content += text + '\n\n';
             else {
               // Fallback if no header yet
               currentChapter = { id: `h1-init-${idx}`, title: 'Imported Fragment', content: text + '\n\n', order: 0, media: [], subChapters: [] };
               newChapters.push(currentChapter);
             }
          }
        });

        if (newChapters.length > 0) {
          setChapters(newChapters);
          setActiveChapterId(newChapters[0].id);
        } else {
          // Simple text fallback
          setChapters([{ id: '1', title: file.name.replace('.docx', ''), content: html.replace(/<[^>]*>/g, '\n'), order: 0, media: [], subChapters: [] }]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        setChapters([{ id: '1', title: file.name.split('.')[0], content: event.target?.result as string, order: 0, media: [], subChapters: [] }]);
      };
      reader.readAsText(file);
    }
    setShowActionMenu(false);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newMedia: MediaAsset = {
        id: Date.now().toString(),
        data: event.target?.result as string,
        name: file.name,
        type: file.type
      };
      const updateChapterInList = (list: Chapter[]): Chapter[] => {
        return list.map(c => {
          if (c.id === activeChapterId) return { ...c, media: [...(c.media || []), newMedia] };
          if (c.subChapters) return { ...c, subChapters: updateChapterInList(c.subChapters) };
          return c;
        });
      };
      setChapters(prev => updateChapterInList(prev));
    };
    reader.readAsDataURL(file);
    setShowActionMenu(false);
  };

  const exportContent = (type: 'txt' | 'docx' | 'md') => {
    let fullText = "";
    const compile = (list: Chapter[]) => {
      list.forEach(c => {
        fullText += `${c.title}\n\n${c.content}\n\n`;
        if (c.subChapters) compile(c.subChapters);
      });
    };
    compile(chapters);
    
    const mimeType = type === 'txt' ? 'text/plain' : type === 'md' ? 'text/markdown' : 'application/msword';
    const blob = new Blob([fullText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chapters[0].title || 'Sheet'}.${type}`;
    link.click();
    setShowActionMenu(false);
  };

  const currentFont = FONT_PAIRINGS[fontIndex];

  // Sidebar Recursive Component
  const SidebarItem: React.FC<{ chapter: Chapter, depth?: number }> = ({ chapter, depth = 0 }) => (
    <div className="flex flex-col">
      <div 
        onClick={() => setActiveChapterId(chapter.id)} 
        className={`py-3 px-4 cursor-pointer border-l-2 transition-all flex items-center gap-2 ${activeChapterId === chapter.id ? 'bg-orange-500/15 border-orange-500 text-orange-500' : 'border-transparent text-gray-700 hover:text-gray-400'}`}
        style={{ paddingLeft: `${(depth + 1) * 16}px` }}
      >
        {depth > 0 && <span className="text-orange-500/30 font-serif">›</span>}
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] truncate ${depth > 0 ? 'text-[9px] lowercase' : ''}`}>
          {chapter.title === DEFAULT_TITLE ? 'Untitled Sheet' : chapter.title}
        </p>
      </div>
      {chapter.subChapters?.map(sub => (
        <SidebarItem key={sub.id} chapter={sub} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#020202] text-white overflow-hidden selection:bg-orange-500/30">
      
      {/* Voice Lab Modal */}
      {isVoiceLabOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-xl w-full bg-[#0d0d0d] border border-white/10 p-12 text-center shadow-2xl relative">
            <button onClick={() => setIsVoiceLabOpen(false)} className="absolute top-8 right-8 text-gray-700 hover:text-white text-2xl">×</button>
            <h2 className="text-4xl font-serif italic text-white mb-6">Virty <span className="text-orange-500">Voice Lab.</span></h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-10 italic">"Speak naturally for 30 seconds. Calibration will begin."</p>
            <div className="relative h-2 bg-white/5 rounded-full mb-12 overflow-hidden">
               <div className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-1000" style={{ width: `${recordingProgress}%` }}></div>
            </div>
            {!isRecordingLab ? (
              <button onClick={startVoiceLabRecording} className="bg-orange-500 text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 transition-all rounded-sm">Initiate Calibration</button>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-8 bg-orange-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>)}
                </div>
                <button onClick={stopVoiceLabRecording} className="text-red-500 text-[9px] font-bold uppercase tracking-widest animate-pulse">Recording Interface Live...</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar: Registry (Now with Hierarchy) */}
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0">
        <div className="flex-grow overflow-y-auto pt-24 pb-4 custom-scrollbar">
          {chapters.map(c => <SidebarItem key={c.id} chapter={c} />)}
        </div>
        <div className="px-6 py-4 border-t border-white/5 bg-black/40">
            <button onClick={() => {
              const newId = Date.now().toString();
              setChapters([...chapters, { id: newId, title: DEFAULT_TITLE, content: '', order: 0, media: [], subChapters: [] }]);
              setActiveChapterId(newId);
            }} className="w-full p-4 border border-dashed border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-orange-500 transition-all rounded-sm">
              + {uiStrings.newSheet}
            </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col relative bg-[#020202]">
        <div className="absolute top-4 right-12 z-[40]">
           <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse"></div>
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Dialect: {detectedLocale}</span>
           </div>
        </div>

        {/* Toolbar */}
        <div className="px-12 py-8 border-b border-white/[0.03] bg-[#050505] flex items-center justify-between sticky top-0 z-[60] backdrop-blur-xl">
           <div className="flex items-center gap-10">
              <button onClick={() => setFontIndex((fontIndex + 1) % FONT_PAIRINGS.length)} className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em] transition-colors">Font: {currentFont.name}</button>
              <button onClick={() => setIsVoiceLabOpen(true)} className="text-[9px] font-black text-orange-500/60 hover:text-orange-500 uppercase tracking-[0.3em] transition-colors flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-orange-500"></div>Voice Lab
              </button>
           </div>

           <div className="flex items-center gap-6">
              {(isSoaping || isPartnerLoading) && <span className="text-[8px] font-black text-orange-500 animate-pulse uppercase tracking-widest">Processing...</span>}
              
              <div className="relative">
                <button onClick={() => setShowSoapMenu(!showSoapMenu)} className={`flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 transition-all bg-white/5 font-black uppercase tracking-widest text-[9px] ${isSoaping ? 'text-orange-500 animate-pulse' : 'text-gray-500 hover:text-white'}`}>
                  {uiStrings.soap}
                </button>
                {showSoapMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-sm z-[100] overflow-hidden">
                    <button onClick={() => handleSoap('rinse')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 border-b border-white/5">Rinse (Punctuation)</button>
                    <button onClick={() => handleSoap('scrub')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 border-b border-white/5">Scrub (Flow)</button>
                    <button onClick={() => handleSoap('sanitize')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-white/5">Sanitize (Legal)</button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => isSpeaking ? handleSpeak() : setShowSpeakMenu(!showSpeakMenu)} className={`flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 transition-all font-black uppercase tracking-widest text-[9px] ${isSpeaking ? 'text-orange-500 border-orange-500 animate-pulse bg-orange-500/5 shadow-[0_0_20px_rgba(230,126,34,0.3)]' : 'text-gray-500 hover:text-white bg-white/5'}`}>
                  {isSpeaking ? 'Stop' : uiStrings.speak}
                </button>
                {showSpeakMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-sm z-[100] p-6 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Voice</label>
                       <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full bg-black border border-white/10 text-[10px] text-white p-2 outline-none uppercase font-bold tracking-widest">
                         {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Persona</label>
                       <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                          {PERSONAS.map(p => (
                            <button key={p} onClick={() => setSelectedPersona(p)} className={`text-[8px] p-2 text-left uppercase tracking-widest border transition-all ${selectedPersona === p ? 'bg-orange-500 border-orange-500 text-white' : 'bg-black border-white/10 text-gray-500 hover:text-white'}`}>{p}</button>
                          ))}
                       </div>
                    </div>
                    <button onClick={handleSpeak} className="w-full bg-orange-500 text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all rounded-sm">Listen Now</button>
                  </div>
                )}
              </div>

              <button onClick={toggleListening} className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]' : 'bg-gray-700'}`}></div>
                <span className="text-[9px] font-black uppercase tracking-widest">{uiStrings.dictate}</span>
              </button>
              
              <div className="relative">
                <button onClick={() => setShowActionMenu(!showActionMenu)} className="bg-orange-500 text-white px-10 py-3 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-orange-600 transition-all">{uiStrings.actions}</button>
                {showActionMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-sm z-[100] overflow-hidden">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 border-b border-white/5">Import (Word/MD)</button>
                    <button onClick={() => mediaInputRef.current?.click()} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 border-b border-white/5">Load Media / Cover</button>
                    <button onClick={() => exportContent('docx')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 border-b border-white/5">Export Word (.docx)</button>
                    <button onClick={() => exportContent('md')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 border-b border-white/5">Export Markdown (.md)</button>
                    <button onClick={() => exportContent('txt')} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5">Export Text (.txt)</button>
                  </div>
                )}
              </div>
              
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".docx,.txt,.md" />
              <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" accept="image/*" />
           </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-grow flex flex-col px-4 sm:px-6 lg:px-12 py-12 overflow-y-auto custom-scrollbar">
           <div className="w-full max-w-none space-y-12 h-full flex flex-col">
              {activeChapter.media && activeChapter.media.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {activeChapter.media.map(m => (
                    <div key={m.id} className="relative group shrink-0">
                       <img src={m.data} className="h-40 w-auto rounded-sm border border-white/10 shadow-2xl" alt={m.name} />
                       <button onClick={() => {
                         const updateList = (list: Chapter[]): Chapter[] => list.map(c => ({
                           ...c,
                           media: c.id === activeChapterId ? c.media?.filter(asset => asset.id !== m.id) : c.media,
                           subChapters: c.subChapters ? updateList(c.subChapters) : []
                         }));
                         setChapters(prev => updateList(prev));
                       }} className="absolute top-2 right-2 bg-black/60 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                </div>
              )}
              <textarea 
                rows={2}
                value={activeChapter.title}
                onChange={(e) => {
                  const val = e.target.value;
                  const updateList = (list: Chapter[]): Chapter[] => list.map(c => ({
                    ...c,
                    title: c.id === activeChapterId ? val : c.title,
                    subChapters: c.subChapters ? updateList(c.subChapters) : []
                  }));
                  setChapters(prev => updateList(prev));
                }}
                className={`w-full bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-900 transition-all glow-white text-5xl md:text-7xl leading-tight tracking-tighter resize-none overflow-hidden ${currentFont.title}`}
                placeholder={DEFAULT_TITLE}
              />
              <textarea 
                value={activeChapter.content}
                onChange={(e) => {
                  const val = e.target.value;
                  const updateList = (list: Chapter[]): Chapter[] => list.map(c => ({
                    ...c,
                    content: c.id === activeChapterId ? val : c.content,
                    subChapters: c.subChapters ? updateList(c.subChapters) : []
                  }));
                  setChapters(prev => updateList(prev));
                }}
                className={`w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-400 leading-[1.8] placeholder:text-gray-800 transition-all ${currentFont.body}`}
                placeholder="The narrative begins here..."
              />
           </div>
        </div>
      </main>

      {/* WRAPPER Sidebar */}
      <aside className="border-l border-white/5 bg-[#080808] flex flex-col shrink-0 w-96 relative no-print h-full">
        <div className="shrink-0 p-10 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
           <Link to="/wrapper-info" className="group"><h3 className="text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] glow-orange">WRAPPER</h3></Link>
           <div className={`w-2 h-2 rounded-full ${isPartnerLoading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
        </div>

        <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar bg-black/10">
           {messages.map((m, i) => (
             <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start animate-fade-in'}`}>
                <div className={`max-w-[90%] p-6 rounded-sm text-sm font-serif leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-500 italic' : 'bg-orange-500/5 border border-orange-500/20 text-gray-300'}`}>
                   {m.content}
                </div>
             </div>
           ))}
           <div ref={chatEndRef} />
        </div>

        <div className="shrink-0 p-10 bg-[#0a0a0a] border-t border-white/5 flex flex-col gap-4">
           <div className="relative group">
             <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePartnerChat())} className="w-full bg-[#030303] border border-white/10 p-6 text-base font-serif italic text-white focus:border-orange-500/50 outline-none resize-none h-32 rounded-sm pr-16" placeholder="Whisper to WRAPPER..." />
             <button onClick={togglePartnerListening} className={`absolute bottom-6 right-6 p-3 rounded-full border z-[50] transition-all duration-500 ${isPartnerListening ? 'border-red-500 text-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-white/20 text-gray-500 hover:text-white hover:border-white/40 bg-black'}`}>
                <svg className={`w-5 h-5 ${isPartnerListening ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
             </button>
           </div>
           <div className="flex gap-2">
             <button onClick={() => handlePartnerChat()} className="flex-grow bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white py-3 text-[10px] font-black uppercase tracking-[0.4em] transition-all border border-white/10 rounded-sm">Send Inquiry</button>
             
             {/* RESTORED HELP BUTTON */}
             <Link to="/support" className="px-4 py-3 border border-white/10 rounded-sm hover:border-orange-500/50 text-gray-600 hover:text-orange-500 transition-all flex items-center justify-center bg-black" title="Get help too...">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             </Link>
           </div>
        </div>
      </aside>

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
