
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Book } from '../types';
import { getFromVaultBySlug, openVault } from '../services/vault';

const SAMPLE_BOOKS: Book[] = [
  {
    id: 'ivo-master-1',
    title: 'The IVO Trap',
    subtitle: 'Intervention Orders: From the Inside Out',
    author: 'Mark Mi Words',
    description: "There is no way of knowing how many family violence orders are enforced across Australia. What we do know is how many have wound up in court. In 2023–24, 42% of all civil cases finalised in Australian Magistrates’ Courts involved originating applications for domestic violence orders — around 131,000 cases.",
    coverUrl: 'https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=1200&auto=format&fit=crop',
    slug: 'the-ivo-trap',
    releaseYear: '2024',
    buyUrl: 'https://www.ingramspark.com/'
  }
];

const BookDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        await openVault(); 
        const found = await getFromVaultBySlug(slug || '');
        if (found) {
          setBook(found);
        } else {
          const sample = SAMPLE_BOOKS.find(b => b.slug === slug);
          setBook(sample || null);
        }
      } catch (e) {
        console.error("Vault retrieval error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Master Asset...</span>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-6 text-center">
        <h2 className="text-4xl font-serif italic text-white mb-6 uppercase tracking-tighter">Registry Entry Missing</h2>
        <p className="text-gray-500 text-sm mb-12 italic">"Entry not found in Sovereign Vault V8. Check Registry Diagnostics."</p>
        <Link to="/published-books" className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] underline underline-offset-8">Return to Registry</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
      <div className="flex flex-col lg:flex-row gap-24 items-start">
        <div className="lg:w-[45%] w-full sticky top-32">
          <div className="group relative">
            <div className="shadow-[60px_60px_120px_rgba(0,0,0,0.9)] border-l-[15px] border-black overflow-hidden rounded-r-md bg-[#0a0a0a] relative transition-all duration-700">
              <div className={`relative transition-all duration-500 min-h-[500px] flex items-center justify-center p-4 ${diagnosticMode ? 'bg-black' : ''}`}>
                {book.coverUrl && !imageError ? (
                  <img 
                    src={book.coverUrl} 
                    decoding="sync"
                    loading="eager"
                    className={`w-full max-h-[85vh] object-contain transition-all duration-1000 ${diagnosticMode ? 'invert grayscale brightness-200 contrast-200 opacity-40 mix-blend-screen' : ''}`}
                    onError={() => setImageError("VAULT MASTER CORRUPTION: PLEASE RE-UPLOAD JPEG")}
                  />
                ) : (
                  <div className="text-center p-12 space-y-4">
                     <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{imageError || "MASTER LINK DISCONNECTED"}</p>
                     <p className="text-gray-700 text-[8px] uppercase italic">Use Registry Audit to verify asset integrity.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-12 flex flex-col gap-4">
               <a href={book.buyUrl || 'https://www.ingramspark.com/'} target="_blank" rel="noopener noreferrer" className="w-full bg-[#0096d6] text-white py-6 text-[10px] font-black uppercase tracking-[0.5em] text-center shadow-xl hover:bg-cyan-600 transition-all rounded-sm flex flex-col items-center justify-center gap-1">
                 <span>Acquire Physical Edition</span>
                 <span className="text-[7px] opacity-70 tracking-[0.2em]">Sovereign IngramSpark Link</span>
               </a>
               <button onClick={() => setDiagnosticMode(!diagnosticMode)} className={`w-full py-4 text-[8px] font-black uppercase tracking-[0.4em] border transition-all rounded-sm flex items-center justify-center gap-3 ${diagnosticMode ? 'bg-cyan-500 text-white' : 'border-white/10 text-gray-600 hover:text-cyan-400'}`}>
                 {diagnosticMode ? 'Exit X-Ray View' : 'Mastering Audit (X-Ray)'}
               </button>
            </div>
          </div>
        </div>

        <div className="lg:w-[55%] w-full pt-10">
          <Link to="/published-books" className="text-[var(--accent)] text-[11px] font-bold uppercase tracking-[0.6em] mb-6 block hover:underline transition-all">← Return to Master Registry</Link>
          <h1 className="text-6xl md:text-8xl font-serif font-black mb-4 italic text-white tracking-tighter leading-none">{book.title}</h1>
          <p className="text-gray-400 text-lg leading-loose mb-12 italic opacity-80 whitespace-pre-wrap">{book.description}</p>

          <div className="grid grid-cols-2 gap-8 mb-16 border-y border-white/5 py-10">
             <div>
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1 block">Edition Author</span>
                <p className="text-xl font-serif italic text-white">{book.author}</p>
             </div>
             <div>
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1 block">Release Year</span>
                <p className="text-xl font-serif italic text-white">{book.releaseYear}</p>
             </div>
          </div>

          {diagnosticMode && (
            <div className="mt-16 p-10 bg-orange-500/5 border border-orange-500/20 rounded-sm animate-fade-in">
              <h4 className="text-orange-500 font-black uppercase tracking-widest text-xs mb-6 underline">The Sovereign Audit V8</h4>
              <p className="text-gray-400 text-sm italic leading-relaxed">Vault Status: <span className="text-white font-bold">Protocol V8 Linked</span>. Committal Verified.</p>
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-[8px] uppercase tracking-widest text-gray-700 font-mono">
                <p>Registry Slug Index: {book.slug}</p>
                <p>Atomic Sync ID: {book.id}</p>
                <p>Asset Payload: {(book.coverUrl?.length / 1024).toFixed(0)}kb Base64</p>
                <p>Last Modified: {book.updatedAt ? new Date(book.updatedAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
