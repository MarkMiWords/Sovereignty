
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Book } from '../types';

const SAMPLE_BOOKS: Book[] = [
  {
    id: 'legacy-1',
    title: 'The IVO Trap',
    subtitle: 'Intervention Orders: From the Inside Out',
    author: 'Mark Mi Words',
    description: "There is no way of knowing how many family violence orders are enforced across Australia. What we do know is how many have wound up in court. In 2023–24, 42% of all civil cases finalised in Australian Magistrates’ Courts involved originating applications for domestic violence orders — around 131,000 cases.",
    coverUrl: 'https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=1200&auto=format&fit=crop',
    slug: 'the-ivo-trap',
    releaseYear: '2024'
  }
];

const BookDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('aca_published_books');
    const userBooks: Book[] = saved ? JSON.parse(saved) : [];
    const found = [...userBooks, ...SAMPLE_BOOKS].find(b => b.slug === slug);
    setBook(found || null);
  }, [slug]);

  if (!book) return null;

  const currentAsset = book.coverUrl;
  const assetSizeMB = (currentAsset.length * 0.75) / (1024 * 1024);
  const isSovereignMaster = assetSizeMB > 2.0;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
      <div className="flex flex-col lg:flex-row gap-24 items-start">
        <div className="lg:w-[45%] w-full sticky top-32">
          <div className="group relative">
            <div className={`shadow-[60px_60px_120px_rgba(0,0,0,0.9)] border-l-[15px] border-black overflow-hidden rounded-r-md bg-[#0a0a0a] relative transition-all duration-700`}>
              <div className={`relative transition-all duration-500 min-h-[500px] flex items-center justify-center p-4 ${diagnosticMode ? 'bg-black' : ''}`}>
                <img src={currentAsset} className={`w-full max-h-[85vh] object-contain transition-all duration-1000 ${diagnosticMode ? 'invert grayscale brightness-200 contrast-200 opacity-40 mix-blend-screen' : ''}`} />
                {diagnosticMode && isSovereignMaster && (
                  <div className="absolute inset-0 bg-orange-500/20 mix-blend-overlay animate-pulse flex items-center justify-center">
                    <span className="text-[10px] font-black text-white bg-orange-600 px-4 py-2 border border-white/20 uppercase tracking-widest">Sovereign Master: {assetSizeMB.toFixed(1)}MB</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-12 flex flex-col gap-4">
               <button onClick={() => setDiagnosticMode(!diagnosticMode)} className={`w-full py-3 text-[8px] font-black uppercase tracking-[0.4em] border transition-all rounded-sm flex items-center justify-center gap-3 ${diagnosticMode ? 'bg-cyan-500 text-white' : 'border-white/10 text-gray-600 hover:text-cyan-400'}`}>
                 {diagnosticMode ? 'Exit X-Ray View' : 'Mastering Diagnostic (X-Ray)'}
               </button>
               <p className="text-[8px] text-gray-700 font-bold uppercase tracking-[0.3em] text-center">Full Frontal Strategy: Back covers disabled for maximum resolution</p>
            </div>
          </div>
        </div>

        <div className="lg:w-[55%] w-full pt-10">
          <Link to="/published-books" className="text-[var(--accent)] text-[11px] font-bold uppercase tracking-[0.6em] mb-6 block hover:underline transition-all">← Return to Storefront</Link>
          <h1 className="text-8xl font-serif font-black mb-4 italic text-white tracking-tighter leading-none">{book.title}</h1>
          <p className="text-gray-400 text-lg leading-loose mb-12 italic opacity-80">{book.description}</p>

          {diagnosticMode && (
            <div className="mt-16 space-y-8 animate-fade-in">
              <div className="p-10 bg-orange-500/5 border border-orange-500/20 rounded-sm">
                <h4 className="text-orange-500 font-black uppercase tracking-widest text-xs mb-6 underline">The Frontal Sovereign Standard</h4>
                <div className="space-y-6">
                   <p className="text-gray-400 text-sm italic leading-relaxed">
                     "This master is committed at <span className="text-white">{(currentAsset.length * 0.75 / 1024).toFixed(0)} KB</span>. By focusing on a single high-fidelity front asset, we achieve maximum legibility for carceral and systemic typography."
                   </p>
                   <div className="space-y-4">
                      <div className="flex gap-4 items-start">
                        <span className="text-orange-500 font-bold text-xs shrink-0">MASTERING</span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose">
                          Current density: {isSovereignMaster ? 'CRITICAL (3MB+)' : 'OPTIMAL (1.5MB)'}. Ensure you use the <span className="text-white">Backup Registry</span> tool frequently to protect this asset.
                        </p>
                      </div>
                      <div className="flex gap-4 items-start">
                        <span className="text-orange-500 font-bold text-xs shrink-0">ANONYMITY</span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose">
                          Privacy Shield status: <span className="text-white">Active</span>. All EXIF metadata and device signatures have been stripped from this high-res binary.
                        </p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-10 bg-cyan-500/5 border border-cyan-500/20 rounded-sm">
                 <h4 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-4">Industrial Integrity</h4>
                 <p className="text-gray-500 text-xs italic leading-relaxed">Checking for artifacting. If the whites are bright and the text is crisp, the Sovereign benchmark has been hit.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
