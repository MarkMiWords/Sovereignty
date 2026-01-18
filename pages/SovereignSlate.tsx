
import React, { useState, useRef, useEffect } from 'react';
import { queryPartner } from '../services/geminiService';
import { Message } from '../types';

const STYLES = ['Fiction', 'Non-Fiction', 'Prison Life', 'Crime Life', 'Love Story', 'Sad Story', 'Tragic Story', 'Life Story'];
const REGIONS = ['Asia', 'Australia', 'North America', 'South America', 'United Kingdom', 'Europe'];

interface Sheet {
  id: string;
  title: string;
  content: string;
}

const SovereignSlate: React.FC = () => {
  const [sheets, setSheets] = useState<Sheet[]>([
    { id: '1', title: 'New Sheet Start', content: '' }
  ]);
  const [activeSheetId, setActiveSheetId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [style, setStyle] = useState(STYLES[2]); 
  const [region, setRegion] = useState(REGIONS[1]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const updateContent = (val: string) => {
    setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, content: val } : s));
  };

  const addSheet = () => {
    const newId = Date.now().toString();
    setSheets(prev => [...prev, { id: newId, title: `Sheet ${prev.length + 1}`, content: '' }]);
    setActiveSheetId(newId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = userInput;
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const partnerResponse = await queryPartner(userMsg, style, region, messages, activeSheet.content);
    setMessages(prev => [...prev, partnerResponse]);
    setIsLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#050505] overflow-hidden">
      <aside className={`transition-all duration-500 border-r border-white/5 bg-[#0a0a0a] flex flex-col ${isSidebarOpen ? 'w-96' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-accent text-[10px] font-bold uppercase tracking-[0.4em]">Sovereign Partner</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-600 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Dialect Tone</label>
              <select 
                value={style} 
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-black border border-white/10 text-[10px] text-gray-400 p-2 focus:border-accent outline-none appearance-none"
              >
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Archive Context</label>
              <select 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-black border border-white/10 text-[10px] text-gray-400 p-2 focus:border-accent outline-none appearance-none"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-4">
              <p className="text-xs italic font-serif">"I am listening to your sheets in {region}. Ready to find your flow on the Slate."</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-sm text-sm font-serif leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 italic text-gray-500' : 'bg-accent/5 border border-accent/20 text-gray-300'}`}>
                {m.content}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[9px] font-bold text-accent uppercase tracking-widest mb-2">Sources:</p>
                    <ul className="space-y-1">
                      {m.sources.map((s, idx) => (
                        <li key={idx}>
                          <a href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-gray-400 hover:text-white transition-colors underline break-all">
                            {s.web?.title || s.web?.uri}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-[9px] text-accent animate-pulse uppercase tracking-widest ml-2">Consulting Archives...</div>}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
          <input 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
            placeholder="Talk to WRAPPER..." 
            className="flex-grow bg-transparent border-none text-[11px] font-serif focus:ring-0 placeholder:text-gray-800"
          />
          <button type="submit" className="text-accent hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </form>
      </aside>

      <main className="flex-grow flex flex-col relative bg-[#050505]">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-6 top-6 z-40 text-gray-600 hover:text-accent transition-all animate-fade-in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}

        <div className="flex bg-[#080808] border-b border-white/5 overflow-x-auto no-scrollbar">
          {sheets.map(s => (
            <div 
              key={s.id} 
              className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-r border-white/5 ${activeSheetId === s.id ? 'bg-[#0a0a0a] text-accent' : 'text-gray-600 hover:text-gray-400'}`}
              onClick={() => setActiveSheetId(s.id)}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">{s.title === 'New Sheet Start' ? 'Draft Sheet' : s.title}</span>
              {sheets.length > 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setSheets(prev => prev.filter(p => p.id !== s.id)); }}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={addSheet}
            className="px-6 py-4 text-gray-600 hover:text-accent transition-colors border-r border-white/5"
          >
            + New Sheet
          </button>
        </div>

        <div className="flex-grow flex justify-center p-12 lg:p-24 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl w-full">
            <input 
              value={activeSheet.title}
              onChange={(e) => setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, title: e.target.value } : s))}
              className="w-full bg-transparent text-white text-5xl font-serif italic mb-12 border-none outline-none focus:ring-0 placeholder:text-gray-900"
              placeholder="Slate Title..."
            />
            <textarea 
              value={activeSheet.content}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full bg-transparent text-gray-400 text-xl font-serif leading-[2.2] border-none outline-none focus:ring-0 resize-none h-auto min-h-[60vh] placeholder:text-gray-900"
              placeholder="Your truth starts on the Slate..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#080808]">
          <div className="flex gap-6 text-[8px] font-bold text-gray-700 uppercase tracking-widest">
            <span>Words: {activeSheet.content.split(/\s+/).filter(x => x).length}</span>
            <span>Vault Status: Secured</span>
          </div>
          <div className="text-[8px] font-bold text-accent uppercase tracking-widest italic">
            "Sovereign Slate Mode"
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SovereignSlate;
