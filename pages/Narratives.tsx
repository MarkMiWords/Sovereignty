
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { queryInsight } from '../services/geminiService';
import { Narrative, Message } from '../types';

const SAMPLE_NARRATIVES: Narrative[] = [
  { id: 'sample-1', title: 'The Steel Echo', author: 'Mark M.', excerpt: 'The sound of the gate closing isn’t just metal on metal. It’s the sound of a chapter slamming shut on a life you thought was yours.', category: 'Diary', imageUrl: 'https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=600&auto=format&fit=crop', tags: ['Australian Justice', 'Solitude'], region: 'AU', publishDate: '2024-03-01', stats: { reads: 1200, kindredConnections: 45, reach: 0.8 } }
];

const Narratives: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [displayNarratives, setDisplayNarratives] = useState<Narrative[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load custom sheets from AuthorBuilder
    const savedSheets = localStorage.getItem('wrap_sheets_v4');
    const customNarratives: Narrative[] = savedSheets ? JSON.parse(savedSheets).map((s: any) => ({
      id: s.id,
      title: s.title || "Untitled Verse",
      author: "You",
      excerpt: s.content ? s.content.substring(0, 120) + "..." : "Empty sheet awaiting truth.",
      category: 'Systemic Memoir',
      imageUrl: s.media && s.media.length > 0 ? s.media[0].data : 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
      tags: ['New Release', 'User Submission'],
      region: 'GLOBAL',
      publishDate: new Date().toISOString().split('T')[0],
      stats: { reads: 0, kindredConnections: 0, reach: 0.1 }
    })) : [];

    setDisplayNarratives([...customNarratives, ...SAMPLE_NARRATIVES]);
  }, []);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const userQuery = query;
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    const response = await queryInsight(userQuery);
    setMessages(prev => [...prev, response]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-[#050505] min-h-screen">
      <div className="mb-24">
        <span className="animate-living-amber tracking-[0.5em] uppercase text-[10px] font-black mb-4 block">Archive Directory</span>
        <h1 className="text-6xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none">
          Impacted <br/>
          <span className="animate-living-amber">Truth.</span>
        </h1>
      </div>

      <section className="mb-32 bg-[#0d0d0d] border border-white/5 p-1 relative overflow-hidden shadow-2xl">
          <div ref={scrollRef} className="h-96 overflow-y-auto p-10 space-y-10 bg-black/40 custom-scrollbar">
            {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center opacity-30"><p className="text-lg italic font-serif text-gray-400">Query the multi-continental impact registry for themes of systemic adversity.</p></div>}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start animate-fade-in'}`}>
                <div className={`max-w-[80%] p-8 rounded-sm ${msg.role === 'user' ? 'bg-white/5 border border-white/10 italic text-gray-500' : 'bg-orange-500/5 border border-orange-500/20 text-gray-200'}`}>
                   <p className="text-base leading-[1.8] font-serif tracking-wide">{msg.content}</p>
                   {msg.sources && msg.sources.length > 0 && (
                     <div className="mt-6 pt-6 border-t border-white/5">
                       <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3 animate-living-amber">Sources:</p>
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
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the archive context..." className="flex-grow bg-black border border-white/10 px-6 py-5 text-sm font-serif focus:border-orange-500 outline-none text-white transition-all" />
            <button type="submit" className="bg-orange-500 text-white px-10 py-5 font-black uppercase text-[10px] tracking-[0.4em] animate-living-amber-bg">Ask</button>
          </form>
      </section>

      <div className="grid md:grid-cols-3 gap-16">
        {displayNarratives.map((n) => (
          <div key={n.id} className="group flex flex-col relative">
            <div className="h-80 overflow-hidden relative border border-white/5 rounded-sm">
              <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
              <div className="absolute top-4 left-4">
                 <span className="text-[8px] font-black uppercase tracking-widest bg-orange-500 text-white px-3 py-1 animate-living-amber-bg">{n.category}</span>
              </div>
            </div>
            <div className="pt-8 flex flex-col flex-grow">
              <h3 className="text-4xl font-serif font-black mb-6 italic text-white group-hover:animate-living-amber transition-colors leading-none tracking-tighter">{n.title}</h3>
              <p className="text-gray-500 text-sm italic font-light leading-relaxed mb-8">"{n.excerpt}"</p>
              <div className="mt-auto flex justify-between items-center pt-6 border-t border-white/5">
                 <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">By {n.author}</span>
                 <Link to="/author-builder" className="text-orange-500 text-[9px] font-black uppercase tracking-widest hover:underline animate-living-amber">Examine Sheet →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Narratives;
