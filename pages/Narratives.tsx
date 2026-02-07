
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { queryInsight } from '../services/geminiService';
import { Narrative, Message } from '../types';
import { readArray, writeJson, k } from '../utils/safeStorage';

const SAMPLE_NARRATIVES: Narrative[] = [
  {
    id: 'sample-1',
    title: 'Crowing On About Life',
    author: 'Mark Mi Words',
    excerpt: 'I call it Port Phillip Paradiso, but this ain\'t no disco. It ain\'t no country club either. This is hell, hey.',
    category: 'Diary',
    imageUrl: 'https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=600&auto=format&fit=crop',
    tags: ['Substack Origin', 'Verified', 'LINK:https://markmiwords.substack.com/p/crowing-on-about-life'],
    region: 'AU',
    publishDate: '2025-01-15',
    stats: { reads: 840, kindredConnections: 32, reach: 0.9 }
  },
  {
    id: 'sample-2',
    title: 'Letter from Hakea',
    author: 'David Orne',
    excerpt: 'We are in 20 hr lockdown everyday. Sometimes 22 hrs. 3 to a cell. If I couldn\'t do my art I would of done something crazy or gone crazy its starting to take its toll on me. Something needs to change.',
    category: 'Diary',
    imageUrl: '/covers/david-orne-painting.jpg',
    tags: ['About Time', 'Western Australia', 'Art'],
    region: 'AU',
    publishDate: '2025-11-16',
    stats: { reads: 0, kindredConnections: 0, reach: 1.0 }
  }
];

const Narratives: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [displayNarratives, setDisplayNarratives] = useState<Narrative[]>([]);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    title: '',
    url: '',
    excerpt: '',
    region: 'AU' as any,
    category: 'Systemic Memoir' as any
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadAllNarratives = useCallback(() => {
    // 1. Load "Registered" external links (Substack)
    const registeredExternal = readArray<Narrative>('external_registry', []);
    
    // 2. Load custom "Forged" sheets from local storage
    const rawSheets = localStorage.getItem(k('wrap_sheets_v4'));
    let customNarratives: Narrative[] = [];
    try {
      if (rawSheets) {
        customNarratives = JSON.parse(rawSheets).map((s: any) => ({
          id: s.id || `sheet-${Math.random()}`,
          title: s.title || "Untitled Verse",
          author: "Architect",
          excerpt: s.content ? s.content.substring(0, 120) + "..." : "Empty sheet awaiting truth.",
          category: 'Systemic Memoir',
          imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
          tags: ['Forged Local', 'Draft'],
          region: 'GLOBAL',
          publishDate: new Date().toISOString().split('T')[0]
        }));
      }
    } catch (e) {
      console.error("Failed to parse custom sheets", e);
    }

    // 3. Combine everything
    setDisplayNarratives([...registeredExternal, ...customNarratives, ...SAMPLE_NARRATIVES]);
  }, []);

  useEffect(() => {
    loadAllNarratives();
  }, [loadAllNarratives]);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages, isLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const userQuery = query;
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    try {
      const response = await queryInsight(userQuery);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Insight link failed. System offline." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: Narrative = {
      id: `ext-${Date.now()}`,
      title: newEntry.title,
      author: 'A Captive Audience',
      excerpt: newEntry.excerpt,
      category: newEntry.category,
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop',
      tags: ['Substack Origin', 'Verified'],
      region: newEntry.region,
      publishDate: new Date().toISOString().split('T')[0],
      stats: { reads: 0, kindredConnections: 0, reach: 1.0 }
    };

    if (newEntry.url) entry.tags.push(`LINK:${newEntry.url}`);

    const existing = readArray<Narrative>('external_registry', []);
    writeJson('external_registry', [entry, ...existing]);
    
    setIngestSuccess(true);
    setTimeout(() => {
      loadAllNarratives();
      setIngestSuccess(false);
      setShowIngestModal(false);
      setNewEntry({ title: '', url: '', excerpt: '', region: 'AU', category: 'Systemic Memoir' });
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-[#050505] min-h-screen">
      <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <span className="animate-living-accent tracking-[0.5em] uppercase text-[10px] font-black mb-4 block">Archive Directory</span>
          <h1 className="text-6xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none">
            Impacted <br/>
            <span className="animate-living-accent">Truth.</span>
          </h1>
        </div>
        <button 
          onClick={() => setShowIngestModal(true)}
          className="bg-white text-black px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--accent)] hover:text-white transition-all shadow-xl rounded-sm"
        >
          + Ingest Substack Story
        </button>
      </div>

      {/* AI INSIGHT SEARCH */}
      <section className="mb-32 bg-[#0d0d0d] border border-white/5 p-1 relative overflow-hidden shadow-2xl">
          <div ref={scrollRef} className="h-96 overflow-y-auto p-10 space-y-10 bg-black/40 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <p className="text-lg italic font-serif text-gray-400 max-w-md">Query the multi-continental impact registry for themes of systemic adversity.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start animate-fade-in'}`}>
                <div className={`max-w-[80%] p-8 rounded-sm ${msg.role === 'user' ? 'bg-white/5 border border-white/10 italic text-gray-500' : 'bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-gray-200'}`}>
                   <p className="text-base leading-[1.8] font-serif tracking-wide">{msg.content}</p>
                   {msg.sources && msg.sources.length > 0 && (
                     <div className="mt-6 pt-6 border-t border-white/5">
                       <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest mb-3">Sources:</p>
                       <ul className="space-y-2">
                         {msg.sources.map((s, idx) => (
                           <li key={idx}>
                             <a href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-white transition-colors underline decoration-white/10 underline-offset-4 break-all">
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
          </div>
          <form onSubmit={handleSearch} className="p-4 bg-[#111] border-t border-white/5 flex gap-4">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search the archive context..." 
              className="flex-grow bg-black border border-white/10 px-6 py-5 text-sm font-serif focus:border-[var(--accent)] outline-none text-white transition-all" 
            />
            <button type="submit" disabled={isLoading} className="bg-[var(--accent)] text-white px-10 py-5 font-black uppercase text-[10px] tracking-[0.4em] animate-living-amber-bg disabled:opacity-50">
              {isLoading ? '...' : 'Ask'}
            </button>
          </form>
      </section>

      {/* NARRATIVE GRID */}
      <div className="grid md:grid-cols-3 gap-16">
        {displayNarratives.length > 0 ? displayNarratives.map((n) => {
          const substackLink = n.tags?.find(t => t.startsWith('LINK:'))?.replace('LINK:', '');
          const isSubstack = n.tags?.includes('Substack Origin');

          return (
            <div key={n.id} className="group flex flex-col relative animate-fade-in">
              <div className={`h-80 overflow-hidden relative border rounded-sm transition-all duration-700 ${isSubstack ? 'border-orange-500/20 shadow-[0_0_40px_rgba(230,126,34,0.1)]' : 'border-white/5'}`}>
                <img 
                  src={n.imageUrl} 
                  alt={n.title} 
                  className={`w-full h-full object-cover transition-all duration-1000 ${isSubstack ? 'grayscale-[0.5] group-hover:grayscale-0' : 'grayscale group-hover:grayscale-0 group-hover:scale-105'}`} 
                />
                <div className="absolute top-4 left-4 flex gap-2">
                   <span className="text-[8px] font-black uppercase tracking-widest bg-[var(--accent)] text-white px-3 py-1 animate-living-amber-bg">{n.category}</span>
                   {isSubstack && <span className="text-[8px] font-black uppercase tracking-widest bg-white text-black px-3 py-1">Substack</span>}
                </div>
              </div>
              <div className="pt-8 flex flex-col flex-grow">
                <h3 className="text-4xl font-serif font-black mb-6 italic text-white group-hover:animate-living-accent transition-colors leading-none tracking-tighter">{n.title}</h3>
                <p className="text-gray-500 text-sm italic font-light leading-relaxed mb-8">"{n.excerpt}"</p>
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-white/5">
                   <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">By {n.author}</span>
                   {substackLink ? (
                     <a href={substackLink} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                       Read Truth →
                     </a>
                   ) : (
                     <Link to="/author-builder" className="text-[var(--accent)] text-[9px] font-black uppercase tracking-widest hover:underline animate-living-accent">Examine Sheet →</Link>
                   )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center border border-dashed border-white/10 opacity-30 italic font-serif">
            The archive link is cold. Ingest a story to begin.
          </div>
        )}
      </div>

      {/* INGEST MODAL */}
      {showIngestModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-2xl w-full bg-[#0d0d0d] border border-white/10 p-12 shadow-2xl relative rounded-sm">
            {!ingestSuccess ? (
              <>
                <button onClick={() => setShowIngestModal(false)} className="absolute top-8 right-8 text-gray-700 hover:text-white text-3xl leading-none">×</button>
                <div className="mb-10">
                  <span className="text-[var(--accent)] tracking-[0.5em] uppercase text-[10px] font-black mb-4 block">Narrative Bridge</span>
                  <h2 className="text-4xl font-serif italic text-white">Register <span className="text-[var(--accent)]">Substack.</span></h2>
                </div>
                
                <form onSubmit={handleIngest} className="space-y-8 text-left">
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Story Title</label>
                     <input 
                       required
                       value={newEntry.title}
                       onChange={e => setNewEntry({...newEntry, title: e.target.value})}
                       className="w-full bg-black border border-white/10 p-4 text-sm font-serif focus:border-[var(--accent)] outline-none text-white transition-all" 
                       placeholder="Title of your Substack post" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Substack URL</label>
                     <input 
                       required
                       type="url"
                       value={newEntry.url}
                       onChange={e => setNewEntry({...newEntry, url: e.target.value})}
                       className="w-full bg-black border border-white/10 p-4 text-sm font-serif focus:border-[var(--accent)] outline-none text-white transition-all" 
                       placeholder="https://captiveaudience.substack.com/p/..." 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Brief Hook / Excerpt</label>
                     <textarea 
                       required
                       value={newEntry.excerpt}
                       onChange={e => setNewEntry({...newEntry, excerpt: e.target.value})}
                       className="w-full bg-black border border-white/10 p-4 text-sm font-serif focus:border-[var(--accent)] outline-none text-white min-h-[120px] resize-none" 
                       placeholder="A raw excerpt to hook the reader..." 
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Region</label>
                        <select 
                          value={newEntry.region}
                          onChange={e => setNewEntry({...newEntry, region: e.target.value as any})}
                          className="w-full bg-black border border-white/10 p-4 text-[10px] font-black uppercase text-white outline-none focus:border-[var(--accent)]"
                        >
                          <option value="AU">AUSTRALIA</option>
                          <option value="US">UNITED STATES</option>
                          <option value="UK">UNITED KINGDOM</option>
                          <option value="GLOBAL">GLOBAL</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Category</label>
                        <select 
                          value={newEntry.category}
                          onChange={e => setNewEntry({...newEntry, category: e.target.value as any})}
                          className="w-full bg-black border border-white/10 p-4 text-[10px] font-black uppercase text-white outline-none focus:border-[var(--accent)]"
                        >
                          <option value="Diary">DIARY</option>
                          <option value="Short Story">SHORT STORY</option>
                          <option value="Essay">ESSAY</option>
                          <option value="Systemic Memoir">SYSTEMIC MEMOIR</option>
                        </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-[var(--accent)] text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all rounded-sm">Commit to Registry</button>
                </form>
              </>
            ) : (
              <div className="py-24 text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                   <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3 className="text-4xl font-serif italic text-white uppercase tracking-tighter">Registry Updated.</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Archive Node...</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Narratives;
