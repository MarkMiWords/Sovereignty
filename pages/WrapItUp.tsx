
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
      alert("The Sovereign Audit failed to finalize. Check network connection.");
    } finally {
      setIsAuditing(false);
    }
  };

  const downloadAuditReport = () => {
    if (!manuscriptReport) return;
    const text = `
SOVEREIGN AUDIT REPORT
======================
Suggested Master Title: ${manuscriptReport.suggestedTitle}
Marketability Potential: ${manuscriptReport.marketabilityScore}%
Resource Intensity: ${manuscriptReport.resourceIntensity} Credits

EXECUTIVE SUMMARY
-----------------
${manuscriptReport.summary}

TONE ASSESSMENT
---------------
${manuscriptReport.toneAssessment}

STRUCTURAL CHECK
----------------
${manuscriptReport.structuralCheck}

LEGAL SAFETY & PII AUDIT
------------------------
${manuscriptReport.legalSafetyAudit}

Generated via A Captive Audience Mastering Suite.
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sovereign_Audit_${Date.now()}.txt`;
    link.click();
  };

  const handleWrapperChat = async (msg: string) => {
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsPartnerLoading(true);
    try {
      const response = await queryPartner(msg, 'Manuscript Editing', 'Global', messages, activeChapter.content, "Full narrative polishing.");
      setMessages(prev => [...prev, response]);
    } finally {
      setIsPartnerLoading(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    if (!prompt) return;
    setPartnerInput(prompt);
    handleWrapperChat(prompt);
    setPartnerInput('');
  };

  const exportManuscript = (format: 'md' | 'docx') => {
    let content = "";
    if (format === 'md') {
      content = `---
title: ${chapters[0].title || 'Sovereign Narrative'}
author: Sovereign Author
status: Mastered
export_date: ${new Date().toLocaleDateString()}
---

`;
    }
    const compile = (list: Chapter[], level: number) => {
      list.forEach(c => {
        content += `${'#'.repeat(level)} ${c.title}\n\n${c.content}\n\n`;
        if (c.subChapters && c.subChapters.length > 0) compile(c.subChapters, level + 1);
      });
    };
    compile(chapters, 1);

    if (format === 'docx') {
      const html = `<html><body>${content.replace(/\n/g, '<br>')}</body></html>`;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sovereign_Sheet_Master_${Date.now()}.docx`;
      link.click();
    } else {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sovereign_Sheet_Master_${Date.now()}.md`;
      link.click();
    }
    setShowExportMenu(false);
  };

  const NavItem: React.FC<{ chapter: Chapter, depth?: number }> = ({ chapter, depth = 0 }) => (
    <div className="flex flex-col">
      <div 
        onClick={() => setActiveChapterId(chapter.id)}
        className={`group flex items-center gap-3 p-3 cursor-pointer transition-all border-l-2 ${activeChapterId === chapter.id ? 'bg-accent/10 border-accent text-accent' : 'hover:bg-white/5 border-transparent text-gray-500'}`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <div className="w-1 h-1 rounded-full bg-gray-800 mr-1"></div>
        <span className={`text-[11px] font-serif truncate flex-grow italic ${activeChapterId === chapter.id ? 'font-bold' : ''}`}>
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
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-accent">Sheet Mastering</h2>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {chapters.map((chapter) => <NavItem key={chapter.id} chapter={chapter} />)}
        </div>
        
        {/* Full Audit Trigger */}
        <div className="p-6 border-t border-white/5 bg-black/40">
           <button 
             onClick={handleFullManuscriptAudit}
             disabled={isAuditing}
             className={`w-full p-4 border border-accent/40 text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:bg-accent/10 flex items-center justify-center gap-3 ${isAuditing ? 'animate-pulse opacity-50' : 'glow-orange'}`}
           >
             {isAuditing ? 'Syncing Full Archive...' : 'Perform Sovereign Audit'}
           </button>
           <p className="text-[8px] text-gray-700 uppercase tracking-widest text-center mt-3 italic">
             "Full manuscript cross-sheet analysis."
           </p>
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
                 <button onClick={() => exportManuscript('md')} className="bg-accent text-white px-8 py-2 text-[9px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 rounded-l-sm">Final Export</button>
                 <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-accent text-white border-l border-white/20 px-3 py-2 rounded-r-sm transition-all">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                 </button>
               </div>
               {showExportMenu && (
                 <div className="absolute top-full right-0 mt-2 w-64 bg-[#0d0d0d] border border-white/10 shadow-2xl z-50">
                   <button onClick={() => exportManuscript('md')} className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Markdown (.md)</p></button>
                   <button onClick={() => exportManuscript('docx')} className="w-full text-left p-4 hover:bg-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Word (.docx)</p></button>
                 </div>
               )}
             </div>
           </div>
        </div>

        {/* Auditor Dashboard Overlay */}
        {manuscriptReport && (
          <div className="absolute inset-0 z-[100] bg-[#030303]/95 backdrop-blur-3xl overflow-y-auto custom-scrollbar p-12 lg:p-24 animate-fade-in" id="audit-report-overlay">
             <div className="max-w-4xl mx-auto space-y-16" id="audit-report-content">
                <div className="flex justify-between items-start border-b border-white/10 pb-12">
                   <div>
                      <span className="text-accent text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Archive Finalization</span>
                      <h2 className="text-6xl font-serif font-black italic text-white glow-white">Sovereign <span className="text-accent">Audit Report.</span></h2>
                   </div>
                   <button onClick={() => setManuscriptReport(null)} className="text-gray-700 hover:text-white transition-colors text-4xl no-print">×</button>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                   <div className="p-8 bg-white/[0.02] border border-white/5 space-y-4">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Resource Intensity</p>
                      <div className="flex items-end gap-3">
                         <span className="text-4xl font-serif italic text-accent">{manuscriptReport.resourceIntensity}</span>
                         <span className="text-[9px] text-gray-700 mb-2 uppercase tracking-widest">Sovereign Credits</span>
                      </div>
                      <div className="w-full h-[1px] bg-white/5"></div>
                      <p className="text-[8px] text-gray-700 uppercase tracking-widest leading-relaxed italic">"Equivalent to processing ~{(manuscriptReport.resourceIntensity * 1.5).toFixed(0)}k high-fidelity tokens."</p>
                   </div>
                   <div className="p-8 bg-white/[0.02] border border-white/5 space-y-4">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Marketability Potential</p>
                      <div className="flex items-end gap-3">
                         <span className="text-4xl font-serif italic text-white">{manuscriptReport.marketabilityScore}%</span>
                      </div>
                      <div className="w-full h-[1px] bg-white/5"></div>
                      <p className="text-[8px] text-gray-700 uppercase tracking-widest leading-relaxed italic">"Archive potency based on thematic grit and narrative clarity."</p>
                   </div>
                   <div className="p-8 bg-white/[0.02] border border-white/5 space-y-4">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Suggested Master Title</p>
                      <p className="text-xl font-serif italic text-white leading-tight">"{manuscriptReport.suggestedTitle}"</p>
                      <div className="w-full h-[1px] bg-white/5"></div>
                      <p className="text-[8px] text-gray-700 uppercase tracking-widest leading-relaxed italic">"Derived from cross-archive semantic analysis."</p>
                   </div>
                </div>

                <div className="space-y-12 bg-black/40 p-12 border border-white/5">
                   <div className="space-y-4">
                      <h4 className="text-accent text-[10px] font-black uppercase tracking-[0.4em]">Executive Summary</h4>
                      <p className="text-xl text-gray-300 font-serif italic leading-relaxed">{manuscriptReport.summary}</p>
                   </div>
                   <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                         <h4 className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em]">Tone Assessment</h4>
                         <p className="text-sm text-gray-500 italic leading-loose">{manuscriptReport.toneAssessment}</p>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em]">Structural Check</h4>
                         <p className="text-sm text-gray-500 italic leading-loose">{manuscriptReport.structuralCheck}</p>
                      </div>
                   </div>
                   <div className="p-8 bg-red-950/20 border border-red-500/30 space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                      <h4 className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Legal Safety & PII Audit</h4>
                      <p className="text-sm text-red-100 italic leading-loose">{manuscriptReport.legalSafetyAudit}</p>
                   </div>
                </div>

                <div className="flex flex-col md:flex-row justify-center items-center gap-6 pb-24 no-print">
                   <button 
                     onClick={() => window.print()}
                     className="bg-white text-black px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-accent hover:text-white transition-all shadow-2xl"
                   >
                     Print Protocol
                   </button>
                   <button 
                     onClick={downloadAuditReport}
                     className="border border-white/20 text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white/5 transition-all"
                   >
                     Download Report (.txt)
                   </button>
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
         
         <div className="p-8 border-b border-white/5 space-y-2">
            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Mastering Goals</label>
            <select 
              onChange={(e) => handlePromptSelect(e.target.value)} 
              className="w-full bg-black border border-white/10 text-[10px] text-gray-400 p-3 outline-none uppercase font-bold tracking-widest cursor-pointer hover:border-accent/40 transition-all"
            >
              <option value="">Select a refinement goal...</option>
              {SUGGESTED_PROMPTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
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
         <form onSubmit={(e) => { e.preventDefault(); handleWrapperChat(partnerInput); setPartnerInput(''); }} className="p-6 bg-black/60 border-t border-white/5 flex gap-3">
            <input value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Final dialogue with WRAPPER..." className="flex-grow bg-transparent border-none text-[11px] font-serif focus:ring-0 placeholder:text-gray-800" />
            <button type="submit" className="text-accent hover:text-white transition-all transform hover:scale-110">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
         </form>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; }
        @media print {
          body * { visibility: hidden; background: white !important; color: black !important; }
          #audit-report-overlay { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; }
          #audit-report-content, #audit-report-content * { visibility: visible; }
          .no-print { display: none !important; }
          #audit-report-content { margin: 0; padding: 2rem; }
          .glow-white, .glow-orange { text-shadow: none !important; }
          .bg-white\/\[0\.02\], .bg-black\/40 { background: transparent !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default WrapItUp;
