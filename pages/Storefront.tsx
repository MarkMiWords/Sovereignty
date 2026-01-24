
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { readJson } from '../utils/safeStorage';

const VAULT_NAME = 'aca_sovereign_registry';
const VAULT_VERSION = 4;

const openVault = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VAULT_NAME, VAULT_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getFromVault = async (): Promise<Book[]> => {
  try {
    const db = await openVault();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readonly');
      const store = transaction.objectStore('books');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) { return []; }
};

const Storefront: React.FC = () => {
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRegistry = async () => {
    setLoading(true);
    const registry = await getFromVault();
    const shadowRegistry = readJson<any[]>('shadow_book_registry', []);
    
    let finalRegistry = registry;
    
    // Recovery path if primary DB is empty but shadow exists
    if (finalRegistry.length === 0 && shadowRegistry.length > 0) {
      finalRegistry = shadowRegistry.map(s => ({
        ...s,
        coverUrl: '' // Cover will need re-sync
      }));
    }

    setAllBooks(finalRegistry);
    
    let found = finalRegistry.find(b => b.slug === 'the-ivo-trap');
    if (!found && finalRegistry.length > 0) found = finalRegistry[finalRegistry.length - 1];
    
    if (found) {
      setFeaturedBook(found);
    } else {
      setFeaturedBook({
        id: 'ivo-master-1',
        title: 'The IVO Trap',
        subtitle: 'Intervention Orders: From the Inside Out',
        author: 'Mark Mi Words',
        description: "There is no way of knowing how many family violence orders are enforced across Australia. What we do know is how many have wound up in court. In 2023–24, 42% of all civil cases finalised in Australian Magistrates’ Courts involved originating applications for domestic violence orders — around 131,000 cases.",
        coverUrl: 'https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=1200&auto=format&fit=crop',
        slug: 'the-ivo-trap',
        releaseYear: '2024',
        buyUrl: 'https://www.ingramspark.com/'
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRegistry();
  }, []);

  if (loading || !featuredBook) {
    return (
      <div className="bg-[#020202] min-h-screen flex items-center justify-center">
        <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Master Registry...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#020202] min-h-screen text-white overflow-hidden pb-32">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#020202] z-10"></div>
        {featuredBook.coverUrl && (
          <img 
            src={featuredBook.coverUrl} 
            className="w-full h-full object-cover opacity-20 grayscale scale-110 animate-subtle-drift blur-md"
            alt="Atmospheric Background"
          />
        )}
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-12 md:pt-32">
        <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-32">
          
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center perspective-1000">
            <div className="relative group animate-float">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 via-purple-500 to-cyan-500 rounded-lg blur-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000 animate-pulsate-aura"></div>
              <div className="absolute inset-2 bg-black blur-xl opacity-80 translate-x-8 translate-y-8"></div>

              <div className="relative z-10 w-[320px] md:w-[420px] aspect-[16/27] bg-[#0a0a0a] border-l-[12px] border-black shadow-2xl rounded-r-sm overflow-hidden transform rotate-y-[-5deg] transition-all duration-700 group-hover:rotate-y-[0deg]">
                {featuredBook.coverUrl ? (
                  <img src={featuredBook.coverUrl} className="w-full h-full object-contain block opacity-100" alt={`${featuredBook.title} Master Cover`} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-800 p-12 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-4">Shadow Registry Active</p>
                    <span className="text-[8px] border border-orange-500/30 px-3 py-1 text-orange-500">Master Sync Required</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
              </div>
              <div className="absolute -inset-[2px] rounded-r-sm border border-white/10 z-20 pointer-events-none"></div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 space-y-12">
            <div className="space-y-6">
              <span className="text-[var(--accent)] tracking-[0.8em] uppercase text-[11px] font-black block animate-pulse">Featured Masterpiece</span>
              <h1 className="text-6xl md:text-8xl font-serif font-black italic tracking-tighter leading-none text-white">
                {featuredBook.title.split(' ').slice(0, -1).join(' ')} <br/>
                <span className="text-[var(--accent)] glow-accent animate-living-accent">{featuredBook.title.split(' ').pop()}.</span>
              </h1>
              {featuredBook.subtitle && (
                <p className="text-2xl md:text-3xl text-gray-400 font-light italic leading-relaxed border-l-2 pl-8 border-[var(--accent)]/30">
                  {featuredBook.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-8 text-gray-500 font-light italic leading-loose text-lg max-h-[300px] overflow-y-auto no-scrollbar">
              <p className="whitespace-pre-wrap">{featuredBook.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 pt-8">
              <a href={featuredBook.buyUrl || "https://www.ingramspark.com/"} target="_blank" rel="noopener noreferrer" className="flex-grow bg-[#0096d6] text-white px-12 py-8 font-black tracking-[0.6em] uppercase text-[11px] text-center shadow-2xl hover:brightness-110 transition-all rounded-sm">Acquire Physical Edition</a>
              <Link to={`/book/${featuredBook.slug}`} className="px-12 py-8 border border-white/10 text-white font-black tracking-[0.6em] uppercase text-[11px] text-center hover:bg-white hover:text-black transition-all rounded-sm">Examine Metadata</Link>
            </div>

            <div className="pt-12 border-t border-white/5 flex items-center gap-8">
               <div className="text-center">
                  <p className="text-white text-xl font-serif italic">{featuredBook.coverUrl ? 'LIVE' : 'META'}</p>
                  <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">Vault Status</p>
               </div>
               <div className="h-8 w-[1px] bg-white/5"></div>
               <div className="text-center">
                  <p className="text-white text-xl font-serif italic">{featuredBook.releaseYear}</p>
                  <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">Master Release</p>
               </div>
               <div className="h-8 w-[1px] bg-white/5"></div>
               <div className="text-center">
                  <p className="text-[var(--accent)] text-xl font-serif italic truncate max-w-[120px]">{featuredBook.author.toUpperCase()}</p>
                  <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">The Architect</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 mt-48">
        <div className="flex items-end justify-between border-b border-white/5 pb-12 mb-16">
           <div>
              <span className="text-[var(--accent)] tracking-[0.5em] uppercase text-[9px] font-black block mb-4">The Archive</span>
              <h2 className="text-4xl md:text-5xl font-serif italic font-black text-white">Registered <span className="text-gray-600">Masters.</span></h2>
           </div>
           <Link to="/published-books" className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-[var(--accent)] transition-colors">Manage Registry →</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
           {allBooks.map((book) => (
             <Link key={book.id} to={`/book/${book.slug}`} className="group space-y-4">
                <div className="aspect-[16/27] bg-[#0a0a0a] border-l-4 border-black group-hover:border-[var(--accent)] transition-all overflow-hidden rounded-r-sm relative shadow-xl">
                   {book.coverUrl ? (
                     <img src={book.coverUrl} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt={book.title} />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-800 text-[7px] font-black uppercase tracking-tighter">
                       <span>Shadow Metadata Only</span>
                     </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">View Details</span>
                   </div>
                </div>
                <div className="space-y-1">
                   <h3 className="text-xs font-black uppercase tracking-widest text-white truncate">{book.title}</h3>
                   <p className="text-[8px] text-gray-600 uppercase font-black">{book.author}</p>
                </div>
             </Link>
           ))}
        </div>
      </div>

      <style>{`
        @keyframes drift { 0% { transform: scale(1.1) translate(0, 0); } 50% { transform: scale(1.15) translate(-1%, -1%); } 100% { transform: scale(1.1) translate(0, 0); } }
        .animate-subtle-drift { animation: drift 20s infinite ease-in-out; }
        @keyframes pulsate-aura { 0%, 100% { transform: scale(1); opacity: 0.3; filter: blur(30px) hue-rotate(0deg); } 50% { transform: scale(1.1); opacity: 0.6; filter: blur(50px) hue-rotate(180deg); } }
        .animate-pulsate-aura { animation: pulsate-aura 8s infinite ease-in-out; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-float { animation: float 6s infinite ease-in-out; }
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-[-5deg] { transform: rotateY(-15deg); }
        .group-hover\:rotate-y-\[0deg\]:hover { transform: rotateY(0deg); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Storefront;
