
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { queryPartner, analyzeFullManuscript } from '../services/geminiService';
import { Message, Chapter, ManuscriptReport, MasteringGoal, VaultStorage, VaultAudit } from '../types';

// Declare mammoth for Word import
declare const mammoth: any;

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

const WrapItUp: React.FC = () => {
  const navigate = useNavigate();
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
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  
  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Mastering Goal States
  const [masteringGoal, setMasteringGoal] = useState<MasteringGoal | null>(() => {
    return (localStorage.getItem('aca_last_mastering_goal') as MasteringGoal) || null;
  });
  const [showGoalSelector, setShowGoalSelector] = useState(!masteringGoal);

  // AI Context States
  const [style, setStyle] = useState(STYLES[2]); 
  const [region, setRegion] = useState(REGIONS[1]);

  // Full Audit States
  const [isAuditing, setIsAuditing] = useState(false);
  const [isArchivingAudit, setIsArchivingAudit] = useState(false);
  const [manuscriptReport, setManuscriptReport] = useState<ManuscriptReport | null>(null);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isResizing = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    localStorage.setItem('wrap_sheets_v4', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    if (masteringGoal) {
      localStorage.setItem('aca_last_mastering_goal', masteringGoal);
    }
  }, [masteringGoal]);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerLoading]);

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
    if (!masteringGoal) {
      setShowGoalSelector(true);
      return;
    }
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
      const report = await analyzeFullManuscript(fullContent, masteringGoal);
      setManuscriptReport(report);
      setMessages(prev => [...prev, { role: 'assistant', content: `Audit Complete for ${masteringGoal.toUpperCase()}. I have prepared the Sovereign Report.` }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleArchiveAudit = () => {
    if (!manuscriptReport || !masteringGoal) return;
    setIsArchivingAudit(true);
    
    const vault: VaultStorage = JSON.parse(localStorage.getItem('aca_sovereign_vault') || '{"sheets":[],"books":[],"ai":[],"audits":[]}');
    if (!vault.audits) vault.audits = [];

    const newAudit: VaultAudit = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      goal: masteringGoal,
      report: manuscriptReport
    };

    vault.audits.unshift(newAudit);
    localStorage.setItem('aca_sovereign_vault', JSON.stringify(vault));
    
    setTimeout(() => {
      setIsArchivingAudit(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sovereign Audit secured." }]);
      alert("Report Synchronized with Vault.");
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const nodes = Array.from(doc.body.childNodes);
      let newChapters: Chapter[] = [];
      let currentTopChapter: Chapter | null = null;
      let currentSubChapter: Chapter | null = null;
      nodes.forEach((node, idx) => {
        const text = node.textContent?.trim() || "";
        const nodeName = node.nodeName.toUpperCase();
        if (nodeName === 'H1') {
          currentTopChapter = { id: `h1-${idx}-${Date.now()}`, title: text, content: '', order: newChapters.length, media: [], subChapters: [] };
          newChapters.push(currentTopChapter);
          currentSubChapter = null;
        } else if (nodeName === 'H2' && currentTopChapter) {
          currentSubChapter = { id: `h2-${idx}-${Date.now()}`, title: text, content: '', order: currentTopChapter.subChapters?.length || 0, media: [], subChapters: [] };
          currentTopChapter.subChapters?.push(currentSubChapter);
        } else if (text) {
          const target = currentSubChapter || currentTopChapter;
          if (target) target.content += text + '\n\n';
          else {
            currentTopChapter = { id: `init-${idx}-${Date.now()}`, title: 'Imported Fragment', content: text + '\n\n', order: 0, media: [], subChapters: [] };
            newChapters.push(currentTopChapter);
          }
        }
      });
      if (newChapters.length > 0) {
        setChapters(newChapters);
        setActiveChapterId(newChapters[0].id);
      }
    };
    if (file.name.endsWith('.docx')) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
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
      const goalContext = `MASTERING_MODE: ${masteringGoal?.toUpperCase()}. `;
      // Fix: Pass missing 'personality' argument ('Natural' as default)
      const response = await queryPartner(goalContext + userMsg, style, region, messages, activeChapter.content, 'Natural');
      setMessages(prev => [...prev, response]);
    } finally {
      setIsPartnerLoading(false);
    }
  };

  const handleHelpAction = (action: string) => {
    setShowHelpMenu(false);
    switch(action) {
      case 'substack': handlePartnerChat(undefined, "Perform a Substack Variable Audit."); break;
      case 'paperback': handlePartnerChat(undefined, "Check structural integrity for paperback."); break;
      case 'newspaper': handlePartnerChat(undefined, "Trim for newspaper column."); break;
      case 'legal': handlePartnerChat(undefined, "Perform final legal safety check."); break;
    }
  };

  const handleDragStart = (id: string) => { setDraggedItemId(id); };
  const handleDrop = (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId) return;
    const newChapters = [...chapters];
    const findAndRemove = (list: Chapter[], id: string): Chapter | null => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === id) return list.splice(i, 1)[0];
        if (list[i].subChapters) {
          const found = findAndRemove(list[i].subChapters!, id);
          if (found) return found;
        }
      }
      return null;
    };
    const itemToMove = findAndRemove(newChapters, draggedItemId);
    if (!itemToMove) return;
    const insertAtTarget = (list: Chapter[], targetId: string, item: Chapter): boolean => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === targetId) { list.splice(i, 0, item); return true; }
        if (list[i].subChapters && insertAtTarget(list[i].subChapters!, targetId, item)) return true;
      }
      return false;
    };
    insertAtTarget(newChapters, targetId, itemToMove);
    setChapters(newChapters);
    setDraggedItemId(null);
  };

  const NavItem: React.FC<{ chapter: Chapter, depth?: number }> = ({ chapter, depth = 0 }) => (
    <div draggable onDragStart={() => handleDragStart(chapter.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(chapter.id)} className="flex flex-col">
      <div onClick={() => setActiveChapterId(chapter.id)} className={`group flex items-center gap-3 p-3 cursor-move transition-all border-l-2 relative ${activeChapterId === chapter.id ? 'bg-accent/10 border-accent text-accent' : 'hover:bg-white/5 border-transparent text-gray-500'} ${draggedItemId === chapter.id ? 'opacity-20' : ''}`} style={{ paddingLeft: `${16 + depth * 16}px` }}>
        <span className={`text-[11px] font-serif truncate flex-grow italic ${activeChapterId === chapter.id ? 'font-bold' : ''}`}>
          {chapter.title || 'Untitled Sheet'}
        </span>
      </div>
      {chapter.subChapters?.map(sub => <NavItem key={sub.id} chapter={sub} depth={depth + 1} />)}
    </div>
  );

  const GoalCard = ({ id, title, description, icon }: { id: MasteringGoal, title: string, description: string, icon: string }) => (
    <button onClick={() => { setMasteringGoal(id); setShowGoalSelector(false); }} className={`p-10 border transition-all text-left group relative overflow-hidden rounded-sm h-full ${masteringGoal === id ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_40px_rgba(230,126,34,0.1)]' : 'bg-black border-white/10 hover:border-white/30'}`}>
      <div className="text-4xl mb-6">{icon}</div>
      <h3 className={`text-2xl font-serif italic mb-3 transition-colors ${masteringGoal === id ? 'text-orange-500' : 'text-white'}`}>{title}</h3>
      <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">{description}</p>
      <div className={`text-[9px] font-black uppercase tracking-[0.3em] ${masteringGoal === id ? 'text-orange-500' : 'text-gray-700'}`}>Select Path →</div>
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#050505] overflow-hidden text-white font-sans">
      {showGoalSelector && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-6xl w-full text-center space-y-16">
            <div>
              <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black mb-6 block animate-living-amber">Mastering Calibration</span>
              <h2 className="text-6xl md:text-8xl font-serif font-black italic text-white tracking-tighter leading-none mb-6">Choose Your <br/><span className="text-orange-500 animate-living-amber">Forging Path.</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              <GoalCard id="newspaper" title="About Time Newspaper" description="Refine for physical print columns." icon="📰" />
              <GoalCard id="substack" title="Substack Newsletter" description="Refine for digital serialized reading." icon="📧" />
              <GoalCard id="paperback" title="Paperback Manuscript" description="Refine for a long-form physical book." icon="📖" />
            </div>
            {masteringGoal && <button onClick={() => setShowGoalSelector(false)} className="text-gray-600 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors underline underline-offset-8">Return to Forge</button>}
          </div>
        </div>
      )}

      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0 no-print">
        <div className="pt-48 pb-8 px-8 border-b border-white/5 flex flex-col gap-6 bg-black/40">
           <div className="flex items-center justify-between">
              <Link to="/author-builder" className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-accent">← Exit Forge</Link>
              <button onClick={() => setShowGoalSelector(true)} className="text-[8px] font-black uppercase tracking-widest text-orange-500/60 hover:text-orange-500 underline underline-offset-4">Reset Goal</button>
           </div>
           <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-sm">
              <p className="text-[10px] font-serif italic text-orange-500 uppercase tracking-widest leading-none mb-1">{masteringGoal?.toUpperCase()}</p>
              <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Mastering Mode Active</p>
           </div>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar pt-4">
          {chapters.map((chapter) => <NavItem key={chapter.id} chapter={chapter} />)}
        </div>
        <div className="p-6 border-t border-white/5 bg-black/40">
           <button onClick={handleFullManuscriptAudit} disabled={isAuditing} className={`w-full p-4 border border-accent/40 text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:bg-accent/10 flex items-center justify-center gap-3 ${isAuditing ? 'animate-pulse opacity-50' : 'glow-orange'}`}>{isAuditing ? 'Syncing...' : 'Perform Sovereign Audit'}</button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative bg-[#030303]">
        <div className="flex gap-4 p-4 border-b border-white/5 bg-black/20 items-center justify-between px-12 no-print">
           <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">Forge Desk: {activeChapter.title}</span>
           <div className="flex items-center gap-6">
              <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black uppercase tracking-widest text-orange-500/60 hover:text-orange-500 transition-colors flex items-center gap-2">Import DOCX</button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".docx,.txt,.md" />
           </div>
        </div>

        {manuscriptReport && (
          <div className="absolute inset-0 z-[100] bg-[#030303]/98 backdrop-blur-3xl overflow-y-auto custom-scrollbar p-12 lg:p-24 animate-fade-in">
             <div className="max-w-4xl mx-auto space-y-16">
                <div className="flex justify-between items-start border-b border-white/10 pb-12">
                   <div>
                      <h2 className="text-6xl font-serif font-black italic text-white glow-white leading-none">Sovereign Audit.</h2>
                      <button onClick={() => setManuscriptReport(null)} className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-4 hover:underline">← Return to Forge</button>
                   </div>
                   <button onClick={() => setManuscriptReport(null)} className="text-gray-500 hover:text-white transition-colors text-6xl leading-none">&times;</button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-12">
                   <div className="space-y-12">
                      <div className="space-y-6">
                         <h4 className="text-white font-serif italic text-2xl">Refinement Strategy</h4>
                         <p className="text-lg text-gray-300 font-serif italic leading-relaxed">{manuscriptReport.summary}</p>
                      </div>
                      <div className="p-8 bg-orange-500/10 border border-orange-500/30 rounded-sm">
                         <h4 className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">Forge-Specific Advice</h4>
                         <p className="text-sm text-gray-200 leading-relaxed italic">"{manuscriptReport.mediumSpecificAdvice}"</p>
                      </div>
                      <button onClick={handleArchiveAudit} disabled={isArchivingAudit} className={`w-full py-8 border-2 border-orange-500 text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-orange-500 hover:text-white rounded-sm ${isArchivingAudit ? 'animate-pulse opacity-50' : ''}`}>{isArchivingAudit ? 'Syncing...' : 'Secure Audit to Big House'}</button>
                   </div>
                   
                   <div className="space-y-12">
                      <div className="space-y-6">
                         <h4 className="text-white font-serif italic text-2xl">Registry Metrics</h4>
                         <div className="space-y-4">
                            <div className="space-y-2 group relative">
                               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                  <span>Marketability</span>
                                  <span className="text-orange-500">{manuscriptReport.marketabilityScore}%</span>
                               </div>
                               <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${manuscriptReport.marketabilityScore}%` }}></div></div>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-white font-serif italic text-xl">Suggested Registry Title</h4>
                         <div className="p-6 bg-white/[0.03] border border-white/10 text-white font-serif italic text-2xl tracking-tight">{manuscriptReport.suggestedTitle}</div>
                      </div>
                   </div>
                </div>
                <div className="pt-24 border-t border-white/10 text-center">
                   <button onClick={() => setManuscriptReport(null)} className="px-20 py-8 bg-white text-black text-[11px] font-black uppercase tracking-[0.6em] hover:bg-orange-500 hover:text-white transition-all rounded-sm">Close Report</button>
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

      <div onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'ew-resize'; }} className="w-1.5 hover:bg-accent/40 cursor-ew-resize transition-colors z-50 bg-white/5 no-print"></div>

      <aside className={`transition-all border-l border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl relative z-40 shrink-0 no-print ${isSidebarOpen ? '' : 'w-0 opacity-0'}`} style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0' }}>
         <div className="pt-48 px-8 pb-8 border-b border-white/5 flex flex-col gap-6 bg-black/40">
            <h3 className="text-accent text-[12px] font-black uppercase tracking-[0.5em]">WRAPPER Mastery</h3>
            <button onClick={() => setShowHelpMenu(!showHelpMenu)} className="w-full flex items-center justify-between group">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-200 group-hover:text-orange-500 transition-colors">Mastery Help...</span>
            </button>
            {showHelpMenu && (
              <div className="bg-[#0d0d0d] border border-white/10 shadow-2xl z-[100] overflow-hidden rounded-sm">
                {['substack', 'paperback', 'newspaper', 'legal'].map((opt) => (
                  <button key={opt} onClick={() => handleHelpAction(opt)} className="w-full p-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-500 border-b border-white/5">{opt.toUpperCase()}</button>
                ))}
              </div>
            )}
         </div>
         <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start animate-fade-in'}`}>
                <div className={`max-w-[90%] p-5 rounded-sm text-[13px] font-serif leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-500 italic' : 'bg-accent/5 border border-accent/20 text-gray-300'}`}>
                   {m.content}
                </div>
              </div>
            ))}
            {isPartnerLoading && <div className="text-[9px] text-accent animate-pulse uppercase tracking-widest">Forging...</div>}
            <div ref={chatEndRef} />
         </div>
         <form onSubmit={handlePartnerChat} className="p-6 bg-black/60 border-t border-white/5 flex flex-col gap-4">
            <textarea value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Final dialogue..." className="w-full bg-[#030303] border border-white/10 p-4 text-[12px] font-serif italic text-white focus:border-accent/50 outline-none h-24 rounded-sm" />
            <button type="submit" className="w-full py-3 bg-white/5 text-[9px] font-black uppercase tracking-[0.4em] border border-white/10 rounded-sm">Transcribe</button>
         </form>
      </aside>
    </div>
  );
};

export default WrapItUp;
