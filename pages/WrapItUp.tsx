
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { queryPartner, analyzeFullManuscript } from '../services/geminiService';
import { Message, Chapter, ManuscriptReport } from '../types';

const SUGGESTED_PROMPTS = [
  "Optimize full archive for Substack engagement.",
  "Review the structure of my full My Sheets registry.",
  "Check for legal risks across all sheets.",
  "Suggest a compelling book title from these themes.",
  "Check for tone consistency throughout.",
  "Prepare this for Substack export.",
  "Help me write a back-cover blurb."
];

const WrapItUp: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('wrap_sheets_v4');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'Draft Sheet 1', content: '', order: 0, media: [], subChapters: [] }];
  });
  
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);

  // Full Audit States
  const [isAuditing, setIsAuditing] = useState(false);
  const [manuscriptReport, setManuscriptReport] = useState<ManuscriptReport | null>(null);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    localStorage.setItem('wrap_sheets_v4', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
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

  const updateChapterInList = (list: Chapter[], id: string, updates: Partial<Chapter>): Chapter[] => {
    return list.map(c => {
      if (c.id === id) return { ...c, ...updates };
      if (c.subChapters) return { ...c, subChapters: updateChapterInList(c.subChapters, id, updates) };
      return c;
    });
  };

  const activeChapter = findChapterById(chapters, activeChapterId) || chapters[0];

  const handleFullManuscriptAudit = async () => {
    setIsAuditing(true);
    let fullContent = "";
    const compile = (list: Chapter[]) => {
      list.forEach(c => {
        fullContent += `[CHAPTER: ${c.title}]\n${c.content}\n\n`;
        if (c.subChapters) compile(c.subChapters);
      });
    };
    compile(chapters);

    try {
      const report = await analyzeFullManuscript(fullContent);
      setManuscriptReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const NavItem: React.FC<{ chapter: Chapter, depth?: number }> = ({ chapter, depth = 0 }) => (
    <div className="flex flex-col">
      <div 
        onClick={() => setActiveChapterId(chapter.id)}
        className={`group flex items-center gap-3 p-3 cursor-pointer transition-all border-l-2 ${activeChapterId === chapter.id ? 'bg-accent/10 border-accent text-accent' : 'hover:bg-white/5 border-transparent text-gray-500'}`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <div className={`w-1 h-1 rounded-full ${depth === 0 ? 'bg-orange-500' : 'bg-gray-800'} mr-1`}></div>
        <span className={`text-[11px] font-serif truncate flex-grow italic ${activeChapterId === chapter.id ? 'font-bold' : ''} ${depth > 0 ? 'text-[10px]' : ''}`}>
          {chapter.title || 'Untitled Sheet'}
        </span>
      </div>
      {chapter.subChapters?.map(sub => <NavItem key={sub.id} chapter={sub} depth={depth + 1} />)}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-112px)] bg-[#050505] overflow-hidden text-white font-sans">
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0 no-print">
        <div className="p-4 bg-black/40 border-b border-white/5 text-center">
           <Link to="/author-builder" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-accent transition-colors">← Exit Mastering Suite</Link>
        </div>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-accent">Registry Hierarchy</h2>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar pt-12">
          {chapters.map((chapter) => <NavItem key={chapter.id} chapter={chapter} />)}
        </div>
        
        <div className="p-6 border-t border-white/5 bg-black/40">
           <button 
             onClick={handleFullManuscriptAudit}
             disabled={isAuditing}
             className={`w-full p-4 border border-accent/40 text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:bg-accent/10 flex items-center justify-center gap-3 ${isAuditing ? 'animate-pulse opacity-50' : 'glow-orange'}`}
           >
             {isAuditing ? 'Syncing Full Archive...' : 'Perform Sovereign Audit'}
           </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative bg-[#030303]">
        <div className="flex gap-4 p-4 border-b border-white/5 bg-black/20 items-center justify-between px-12 no-print">
           <div className="flex items-center gap-6">
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">Reviewing: {activeChapter.title}</span>
           </div>

           <div className="flex items-center gap-6">
             <div className="relative" ref={exportMenuRef}>
               <div className="flex">
                 <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-accent text-white px-8 py-2 text-[9px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 rounded-sm">Final Master Export</button>
               </div>
               {showExportMenu && (
                 <div className="absolute top-full right-0 mt-2 w-64 bg-[#0d0d0d] border border-white/10 shadow-2xl z-50">
                   <button className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-accent">Markdown (.md)</p></button>
                   <button className="w-full text-left p-4 hover:bg-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-white">Word (.docx)</p></button>
                 </div>
               )}
             </div>
           </div>
        </div>

        {manuscriptReport && (
          <div className="absolute inset-0 z-[100] bg-[#030303]/95 backdrop-blur-3xl overflow-y-auto custom-scrollbar p-12 lg:p-24 animate-fade-in" id="audit-report-overlay">
             <div className="max-w-4xl mx-auto space-y-16" id="audit-report-content">
                <div className="flex justify-between items-start border-b border-white/10 pb-12">
                   <div>
                      <h2 className="text-6xl font-serif font-black italic text-white glow-white">Sovereign Audit.</h2>
                   </div>
                   <button onClick={() => setManuscriptReport(null)} className="text-gray-700 hover:text-white transition-colors text-4xl no-print">×</button>
                </div>
                <div className="space-y-12">
                   <p className="text-xl text-gray-300 font-serif italic leading-relaxed">{manuscriptReport.summary}</p>
                </div>
             </div>
          </div>
        )}

        <div className="flex-grow flex justify-center p-12 lg:p-24 overflow-y-auto custom-scrollbar no-print">
          <div className="max-w-3xl w-full">
            <input value={activeChapter.title} onChange={(e) => setChapters(updateChapterInList(chapters, activeChapterId, { title: e.target.value }))} className="w-full bg-transparent text-white text-5xl font-serif italic mb-12 border-none outline-none focus:ring-0" />
            <textarea value={activeChapter.content} onChange={(e) => setChapters(updateChapterInList(chapters, activeChapterId, { content: e.target.value }))} className="w-full bg-transparent text-gray-400 text-xl font-serif leading-[2.2] border-none outline-none h-auto min-h-[60vh] resize-none" />
          </div>
        </div>
      </main>

      <div 
        onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'ew-resize'; }}
        className="w-1.5 hover:bg-accent/40 cursor-ew-resize transition-colors z-50 bg-white/5 no-print"
      ></div>

      <aside className={`transition-all border-l border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl relative z-40 shrink-0 no-print ${isSidebarOpen ? '' : 'w-0 opacity-0 overflow-hidden'}`} style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0' }}>
         <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
            <h3 className="text-accent text-[12px] font-black uppercase tracking-[0.5em]">WRAPPER Mastery</h3>
         </div>
         
         <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start animate-fade-in'}`}>
                <div className={`max-w-[90%] p-5 rounded-sm text-[13px] font-serif leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-500 italic' : 'bg-accent/5 border border-accent/20 text-gray-300'}`}>
                   {m.content}
                </div>
              </div>
            ))}
         </div>
         <form onSubmit={(e) => { e.preventDefault(); setShowExportMenu(false); }} className="p-6 bg-black/60 border-t border-white/5 flex gap-3">
            <input value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Final dialogue with WRAPPER..." className="flex-grow bg-transparent border-none text-[11px] font-serif focus:ring-0 placeholder:text-gray-800" />
            <button type="submit" className="text-accent hover:text-white transition-all transform hover:scale-110">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
         </form>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; }
      `}</style>
    </div>
  );
};

export default WrapItUp;
