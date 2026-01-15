
import React, { useState, useRef, useEffect } from 'react';
// Added missing Link import from react-router-dom
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
    const savedSheets = localStorage.getItem('wrap_sheets_v3');
    const customNarratives: Narrative[] = savedSheets ? JSON.parse(savedSheets).map((s: any) => ({
      id: s.id,
      title: s.title || "Untitled Verse",
      author: "You",
      excerpt: s.content.substring(0, 120) + "...",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-24">
        <span className="text-accent tracking-[0.5em] uppercase text-[10px] font-bold mb-4 block">Archive Directory</span>
        <h1 className="text-6xl md:text-8xl font-serif font-bold italic text-white tracking-tighter">Impacted <span className="text-accent underline decoration-white/5 underline-offset-8">Truth.</span></h1>
      </div>

      <section className="mb-32 bg-[#0d0d0d] border border-white/5 p-1 relative overflow-hidden shadow-2xl">
          <div ref={scrollRef} className="h-96 overflow-y-auto p-10 space-y-10 bg-black/40 custom-scrollbar">
            {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center opacity-30"><p className="text-lg italic font-serif text-gray-400">Search the global registry for themes of systemic adversity.</p></div>}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start animate-fade-in'}`}>
                <div className={`max-w-[80%] p-8 rounded-sm ${msg.role === 'user' ? 'bg-white/5 border border-white/10 italic text-gray-500' : 'bg-accent/5 border border-accent/20 text-gray-200'}`}>
                   <p className="text-base leading-[1.8] font-serif tracking-wide">{msg.content}</p>
                   {/* Extract and list URLs from groundingChunks to comply with Google Search grounding requirements */}
                   {msg.sources && msg.sources.length > 0 && (
                     <div className="mt-6 pt-6 border-t border-white/5">
                       <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3">Sources:</p>
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
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Query the multi-continental impact registry..." className="flex-grow bg-black border border-white/10 px-6 py-5 text-sm font-serif focus:border-accent outline-none text-white" />
            <button type="submit" className="bg-accent text-white px-10 py-5 font-bold uppercase text-[10px] tracking-[0.4em]">Ask</button>
          </form>
      </section>

      <div className="grid md:grid-cols-3 gap-12">
        {displayNarratives.map((n) => (
          <div key={n.id} className="group bg-[#0d0d0d] border border-white/5 overflow-hidden transition-all duration-700 hover:border-accent/40 flex flex-col">
            <div className="h-64 overflow-hidden relative">
              <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
              <div className="absolute top-4 left-4">
                 <span className="text-[8px] font-black uppercase tracking-widest bg-accent text-white px-2 py-1">{n.category}</span>
              </div>
            </div>
            <div className="p-10 flex flex-col flex-grow">
              <h3 className="text-3xl font-serif font-bold mb-6 italic text-white group-hover:text-accent transition-colors leading-none">{n.title}</h3>
              <p className="text-gray-500 text-sm italic font-light leading-relaxed mb-10">"{n.excerpt}"</p>
              <div className="mt-auto flex justify-between items-center pt-6 border-t border-white/5">
                 <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">By {n.author}</span>
                 <Link to="/author-builder" className="text-accent text-[9px] font-bold uppercase tracking-widest hover:underline">Read More</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Narratives;
