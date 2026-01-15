
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { transcribeImage, queryPartner } from '../services/geminiService';
import { Message, Chapter } from '../types';

const STYLES = ['Fiction', 'Non-fiction', 'Prison life', 'Crime life', 'Love story', 'Sad story', 'Tragic story', 'Life story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const DEFAULT_TITLE = "In the beginning was the word...";

const FONT_PAIRINGS = [
  { name: 'Classic', title: 'font-serif font-black italic', body: 'font-serif text-xl' },
  { name: 'Modern', title: 'font-serif font-bold', body: 'font-sans text-lg' },
  { name: 'Typewriter', title: 'font-mono uppercase tracking-tighter', body: 'font-mono text-base tracking-tight' },
  { name: 'Manuscript', title: 'font-serif italic font-light', body: 'font-serif italic text-2xl leading-relaxed' },
];

const SUGGESTED_PROMPTS = [
  "Optimize this sheet for Substack length/flow.",
  "How's my flow on this sheet?",
  "Audit this content for legal risk/PII.",
  "Suggest a stronger title for this sheet.",
  "What should happen next in this narrative?",
  "Make this passage sound more authentic to the dialect.",
  "Help me describe the atmosphere of the cell."
];

const AuthorBuilder: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('wrap_sheets_v4');
    return saved ? JSON.parse(saved) : [{ id: '1', title: DEFAULT_TITLE, content: '', order: 0, media: [], subChapters: [] }];
  });
  
  const [activeChapterId, setActiveChapterId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [style, setStyle] = useState(STYLES[2]);
  const [region, setRegion] = useState(REGIONS[1]);
  const [fontIndex, setFontIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const isResizing = useRef(false);

  // Recursive search to find the active chapter
  const findChapterById = (list: Chapter[], id: string): Chapter | undefined => {
    for (const c of list) {
      if (c.id === id) return c;
      if (c.subChapters && c.subChapters.length > 0) {
        const found = findChapterById(c.subChapters, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Recursive update function
  const updateChapterInList = (list: Chapter[], id: string, updates: Partial<Chapter>): Chapter[] => {
    return list.map(c => {
      if (c.id === id) return { ...c, ...updates };
      if (c.subChapters && c.subChapters.length > 0) {
        return { ...c, subChapters: updateChapterInList(c.subChapters, id, updates) };
      }
      return c;
    });
  };

  const activeChapter = findChapterById(chapters, activeChapterId) || chapters[0];

  // Auto-save logic
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem('wrap_sheets_v4', JSON.stringify(chapters));
      setSaveStatus('saved');
    }, 1200);
    return () => clearTimeout(timer);
  }, [chapters]);

  // Sidebar Resize Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleWrapperChat = async (msg: string) => {
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsPartnerLoading(true);
    try {
      const response = await queryPartner(msg, style, region, messages, activeChapter.content, "");
      setMessages(prev => [...prev, response]);
    } finally {
      setIsPartnerLoading(false);
    }
  };

  const handleInkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOCRLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const text = await transcribeImage(base64, file.type);
        setChapters(updateChapterInList(chapters, activeChapterId, { content: activeChapter.content + "\n\n" + text }));
      } catch (err) {
        alert("The vault could not read this ink.");
      } finally {
        setIsOCRLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const mammoth = (window as any).mammoth;
    if (!mammoth) {
      alert("Manuscript engine is still loading. Please try again in a moment.");
      return;
    }

    setIsDocLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const nodes = Array.from(doc.body.childNodes);
        
        let newChapters: Chapter[] = [];
        let currentRoot: Chapter | null = null;
        let currentSub: Chapter | null = null;

        nodes.forEach((node) => {
          if (node.nodeName === 'H1') {
            currentRoot = {
              id: `doc-${Date.now()}-${newChapters.length}`,
              title: node.textContent || 'Untitled Chapter',
              content: '',
              order: Date.now() + newChapters.length,
              subChapters: []
            };
            newChapters.push(currentRoot);
            currentSub = null;
          } else if (node.nodeName === 'H2' && currentRoot) {
            currentSub = {
              id: `doc-sub-${Date.now()}-${currentRoot.subChapters?.length}`,
              title: node.textContent || 'Untitled Verse',
              content: '',
              order: Date.now(),
              subChapters: []
            };
            currentRoot.subChapters?.push(currentSub);
          } else {
            const textContent = node.textContent || '';
            if (currentSub) {
              currentSub.content += (currentSub.content ? '\n' : '') + textContent;
            } else if (currentRoot) {
              currentRoot.content += (currentRoot.content ? '\n' : '') + textContent;
            } else if (textContent.trim()) {
              currentRoot = {
                id: `doc-root-${Date.now()}`,
                title: 'Imported Content',
                content: textContent,
                order: Date.now(),
                subChapters: []
              };
              newChapters.push(currentRoot);
            }
          }
        });

        if (newChapters.length > 0) {
          if (chapters.length === 1 && chapters[0].content === '' && chapters[0].title === DEFAULT_TITLE) {
            setChapters(newChapters);
            setActiveChapterId(newChapters[0].id);
          } else {
            setChapters([...chapters, ...newChapters]);
            setActiveChapterId(newChapters[0].id);
          }
        }
      } catch (err) {
        alert("Could not process this manuscript. Ensure it is a valid .docx file.");
      } finally {
        setIsDocLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const addSubchapter = (parentId: string) => {
    const newSub: Chapter = {
      id: Date.now().toString(),
      title: 'Untitled Verse',
      content: '',
      order: Date.now(),
      subChapters: []
    };

    const recursiveAdd = (list: Chapter[]): Chapter[] => {
      return list.map(c => {
        if (c.id === parentId) {
          return { ...c, subChapters: [...(c.subChapters || []), newSub] };
        }
        if (c.subChapters && c.subChapters.length > 0) {
          return { ...c, subChapters: recursiveAdd(c.subChapters) };
        }
        return c;
      });
    };

    setChapters(recursiveAdd(chapters));
    setActiveChapterId(newSub.id);
  };

  const currentFont = FONT_PAIRINGS[fontIndex];

  const RegistryItem: React.FC<{ item: Chapter, depth?: number }> = ({ item, depth = 0 }) => (
    <div className="flex flex-col">
      <div 
        onClick={() => setActiveChapterId(item.id)}
        className={`group relative py-3 px-4 cursor-pointer transition-all border-l-2 flex items-center justify-between ${activeChapterId === item.id ? 'bg-orange-500/15 border-orange-500 text-orange-500 shadow-[inset_12px_0_40px_-15px_rgba(230,126,34,0.2)]' : 'border-transparent text-gray-700 hover:text-gray-400'}`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <div className="truncate flex-grow">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate">{item.title === DEFAULT_TITLE ? 'Untitled Sheet' : item.title}</p>
          <p className="text-[8px] opacity-25 mt-0.5 uppercase tracking-tighter italic">Vault: {item.id.substring(0, 6)}</p>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); addSubchapter(item.id); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-orange-500 transition-opacity text-xs font-black"
          title="Add Sub-sheet"
        >
          +
        </button>

        {depth > 0 && (
          <div className="absolute top-0 bottom-0 w-[1px] bg-white/10" style={{ left: `${depth * 16}px` }}></div>
        )}
      </div>
      {item.subChapters && item.subChapters.length > 0 && item.subChapters.map(sub => (
        <RegistryItem key={sub.id} item={sub} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-[#030303] text-white overflow-hidden selection:bg-orange-500/30">
      {/* Sovereign Registry Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0">
        <div className="p-8 border-b border-white/5 shrink-0">
           <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-600">Sovereign Registry</h2>
        </div>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar pt-4 pb-4">
          {chapters.map(c => (
            <RegistryItem key={c.id} item={c} />
          ))}
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-black/40 shrink-0">
            <button 
              onClick={() => {
                const newId = Date.now().toString();
                setChapters([...chapters, { id: newId, title: DEFAULT_TITLE, content: '', order: Date.now(), media: [], subChapters: [] }]);
                setActiveChapterId(newId);
              }}
              className="w-full p-4 border border-dashed border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-orange-500 hover:border-orange-500 transition-all rounded-sm bg-black/20"
            >
              + New Sheet
            </button>
        </div>
        
        <div className="p-8 border-t border-white/5 bg-black/20 shrink-0">
           <div className="flex justify-between items-center mb-4">
              <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">Vault Sync</span>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${saveStatus === 'saving' ? 'text-orange-500 animate-pulse' : 'text-gray-500'}`}>
                {saveStatus === 'saving' ? 'Syncing...' : 'Secured'}
              </span>
           </div>
           <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full bg-orange-500 transition-all duration-1000 ${saveStatus === 'saving' ? 'w-2/3 animate-pulse' : 'w-full shadow-[0_0_10px_rgba(230,126,34,0.5)]'}`}></div>
           </div>
        </div>
      </aside>

      {/* Primary Workspace */}
      <main className="flex-grow flex flex-col relative bg-[#030303]">
        <div className="px-12 py-8 border-b border-white/[0.03] bg-[#050505] flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
           <div className="flex items-center gap-10">
              <div className="relative group">
                <button className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em] flex items-center gap-3 transition-all">
                  Font: {currentFont.name}
                  <svg className="w-3 h-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#0d0d0d] border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all rounded-sm overflow-hidden z-50">
                  {FONT_PAIRINGS.map((f, i) => (
                    <button key={f.name} onClick={() => setFontIndex(i)} className="w-full text-left p-4 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-orange-500 hover:text-white border-b border-white/5 last:border-0">{f.name}</button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => docInputRef.current?.click()}
                className={`text-[9px] font-black text-gray-500 hover:text-orange-500 uppercase tracking-[0.3em] transition-all flex items-center gap-2 ${isDocLoading ? 'animate-pulse text-orange-500' : ''}`}
              >
                {isDocLoading ? 'Converting...' : 'Import Manuscript'}
              </button>
              <input type="file" ref={docInputRef} className="hidden" accept=".docx" onChange={handleDocxUpload} />

              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`text-[9px] font-black text-gray-500 hover:text-orange-500 uppercase tracking-[0.3em] transition-all flex items-center gap-2 ${isOCRLoading ? 'animate-pulse text-orange-500' : ''}`}
              >
                {isOCRLoading ? 'Scanning...' : 'Ink-to-text 🪄'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleInkUpload} />
           </div>

           <div className="flex items-center gap-8">
              <Link 
                to="/wrap-it-up" 
                className="group relative bg-orange-500 text-white px-10 py-3 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse-orange shadow-[0_0_20px_rgba(230,126,34,0.3)] rounded-sm"
              >
                Mastering Suite
              </Link>
           </div>
        </div>

        {/* Expansive Editorial Editor */}
        <div className="flex-grow flex flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-8 overflow-y-auto custom-scrollbar">
           <div className="w-full max-w-none space-y-12 h-full flex flex-col">
              <input 
                value={activeChapter.title}
                onFocus={(e) => e.target.value === DEFAULT_TITLE && setChapters(updateChapterInList(chapters, activeChapterId, { title: '' }))}
                onChange={(e) => setChapters(updateChapterInList(chapters, activeChapterId, { title: e.target.value }))}
                className={`w-full bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-900 transition-all glow-white text-[clamp(1.5rem,7vw,4.5rem)] leading-tight tracking-tighter ${currentFont.title}`}
                placeholder={DEFAULT_TITLE}
              />
              <textarea 
                value={activeChapter.content}
                onChange={(e) => setChapters(updateChapterInList(chapters, activeChapterId, { content: e.target.value }))}
                className={`w-full flex-grow bg-transparent border-none outline-none focus:ring-0 resize-none text-gray-400 leading-[1.8] placeholder:text-gray-900 transition-all ${currentFont.body}`}
                placeholder="The narrative begins here..."
              />
           </div>
        </div>
      </main>

      {/* Resize Handle for WRAPPER Sidebar */}
      <div 
        onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'ew-resize'; }}
        className="w-1 cursor-ew-resize bg-white/5 hover:bg-orange-500/40 transition-colors z-40"
      ></div>

      {/* WRAPPER Interactive Hub */}
      <aside className="border-l border-white/5 bg-[#080808] flex flex-col shrink-0 relative shadow-[-20px_0_50px_rgba(0,0,0,0.5)]" style={{ width: `${sidebarWidth}px` }}>
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
           <Link to="/wrapper-info" className="group">
             <h3 className="text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] glow-orange group-hover:underline">WRAPPER</h3>
           </Link>
           <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isPartnerLoading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_10px_rgba(230,126,34,1)]`}></div>
              <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Active Partner</span>
           </div>
        </div>

        {/* Action Dropdown and Style Selectors */}
        <div className="p-8 border-b border-white/5 space-y-6 bg-black/20">
          <div className="space-y-2">
            <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Help Me To...</label>
            <div className="relative group">
              <select 
                onChange={(e) => handleWrapperChat(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 text-[9px] text-orange-500 p-3 pr-10 focus:border-orange-500 outline-none appearance-none font-bold tracking-widest rounded-none cursor-pointer"
              >
                <option value="">Select a refinement goal...</option>
                {SUGGESTED_PROMPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500/40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-black border border-white/10 text-[9px] text-gray-400 p-2 focus:border-orange-500 outline-none appearance-none font-bold tracking-widest">
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Context</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-black border border-white/10 text-[9px] text-gray-400 p-2 focus:border-orange-500 outline-none appearance-none font-bold tracking-widest">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar bg-gradient-to-b from-[#080808] to-[#030303]">
           {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10 space-y-6">
                <p className="text-lg italic font-serif">"I am listening to your sheets in {region}. Whisper your truth or use the 'Help Me To' menu."</p>
             </div>
           )}
           {messages.map((m, i) => (
             <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start animate-fade-in'}`}>
                <div className={`max-w-[90%] p-6 rounded-sm text-sm font-serif leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-500 italic' : 'bg-orange-500/5 border border-orange-500/20 text-gray-300 shadow-[0_0_40px_-10px_rgba(230,126,34,0.1)]'}`}>
                   {m.content}
                </div>
             </div>
           ))}
           {isPartnerLoading && <div className="text-[9px] text-orange-500 animate-pulse uppercase tracking-[0.4em] font-black px-4">Consulting Vault Archives...</div>}
        </div>

        {/* Input Area with Microphone */}
        <div className="p-10 bg-[#0a0a0a] border-t border-white/5">
           <div className="relative">
             <textarea 
               value={partnerInput}
               onChange={(e) => setPartnerInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleWrapperChat(partnerInput), setPartnerInput(''))}
               className="w-full bg-[#030303] border border-white/10 p-6 pr-32 text-base font-serif italic text-white focus:border-orange-500/50 outline-none resize-none h-32 rounded-sm shadow-inner placeholder:text-gray-800"
               placeholder="Whisper to WRAPPER..."
             />
             <div className="absolute bottom-6 right-6 flex items-center gap-6">
                <button 
                  onClick={() => setIsListening(!isListening)}
                  className={`transition-all transform hover:scale-110 ${isListening ? 'text-red-500 animate-pulse glow-red' : 'text-gray-700 hover:text-white'}`}
                  title="Voice Partnership"
                >
                  <svg className="w-5 h-5 filter drop-shadow-[0_0_5px_currentColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </button>
                <button 
                  onClick={() => (handleWrapperChat(partnerInput), setPartnerInput(''))}
                  className="text-orange-500 hover:text-white transition-all transform hover:scale-110 glow-orange"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
             </div>
           </div>
        </div>
      </aside>
    </div>
  );
};

export default AuthorBuilder;
