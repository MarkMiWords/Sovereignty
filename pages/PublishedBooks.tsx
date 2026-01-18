
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { listVault, saveToVault, purgeVault, getVaultStatus } from '../services/vault';

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

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;
const INDUSTRIAL_ASPECT = 1600 / 2700; 

const PublishedBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [masteringSuccess, setMasteringSuccess] = useState(false);
  const [vaultStats, setVaultStats] = useState<{ healthy: boolean, version: number, count: number } | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const [masteringAsset, setMasteringAsset] = useState<{ 
    url: string, 
    originalSize: number,
    width: number,
    height: number
  } | null>(null);

  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0, scale: 1 });
  const [useIndustrialCrop, setUseIndustrialCrop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    subtitle: '',
    author: '',
    description: '',
    releaseYear: new Date().getFullYear().toString(),
    coverUrl: '',
    buyUrl: 'https://www.ingramspark.com/'
  });

  const frontInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRegistry();
    checkVaultHealth();
    
    const draft = localStorage.getItem('aca_book_registration_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setNewBook(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn("Draft restore aborted.");
      }
    }
  }, []);

  useEffect(() => {
    if (isAddingBook) {
      localStorage.setItem('aca_book_registration_draft', JSON.stringify({
        title: newBook.title,
        subtitle: newBook.subtitle,
        author: newBook.author,
        description: newBook.description,
        buyUrl: newBook.buyUrl,
        releaseYear: newBook.releaseYear
      }));
    }
  }, [newBook, isAddingBook]);

  const checkVaultHealth = async () => {
    const stats = await getVaultStatus();
    setVaultStats(stats);
  };

  const loadRegistry = async () => {
    try {
      const userBooks = await listVault();
      // Only show user books in diagnostics, but show all in gallery
      setBooks([...userBooks]);
    } catch (e) {
      console.error("Registry load fail.");
    }
  };

  // Gallery display includes samples
  const galleryBooks = [...books];
  SAMPLE_BOOKS.forEach(s => {
    if (!galleryBooks.find(b => b.slug === s.slug)) galleryBooks.push(s);
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`CRITICAL OVERSIZE: ${(file.size / 1024 / 1024).toFixed(1)}MB. Use <1.5MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setMasteringAsset({ url, originalSize: file.size, width: img.width, height: img.height });
        setCropOffset({ x: 0, y: 0, scale: 1 });
        setError(null);
        setMasteringSuccess(false);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const commitMastering = async () => {
    if (!masteringAsset) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = useIndustrialCrop ? 1600 : img.width;
      canvas.height = useIndustrialCrop ? 2700 : img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (useIndustrialCrop) {
        const imgAspect = img.width / img.height;
        let drawW, drawH;
        if (imgAspect > INDUSTRIAL_ASPECT) {
          drawH = canvas.height * cropOffset.scale;
          drawW = drawH * imgAspect;
        } else {
          drawW = canvas.width * cropOffset.scale;
          drawH = drawW / imgAspect;
        }
        const x = (canvas.width - drawW) / 2 + (cropOffset.x * (canvas.width / 400));
        const y = (canvas.height - drawH) / 2 + (cropOffset.y * (canvas.height / 600));
        ctx.drawImage(img, x, y, drawW, drawH);
      } else {
        ctx.drawImage(img, 0, 0);
      }

      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setNewBook(prev => ({ ...prev, coverUrl: finalDataUrl }));
      setMasteringAsset(null);
      setIsProcessing(false);
      setMasteringSuccess(true);
    };
    img.src = masteringAsset.url;
  };

  const handleSave = async () => {
    if (!newBook.title || !newBook.coverUrl) {
      setError("INTEGRITY: Title and Master Asset are mandatory.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const bookToSave: Omit<Book, "slug"> = {
        id: Date.now().toString(),
        title: newBook.title.trim(),
        subtitle: (newBook.subtitle || '').trim(),
        author: (newBook.author || 'Anonymous Author').trim(),
        description: (newBook.description || '').trim(),
        coverUrl: newBook.coverUrl,
        buyUrl: (newBook.buyUrl || 'https://www.ingramspark.com/').trim(),
        releaseYear: newBook.releaseYear || '2024'
      };
      
      await saveToVault(bookToSave);
      await loadRegistry();
      await checkVaultHealth();
      
      localStorage.removeItem('aca_book_registration_draft');
      setIsAddingBook(false);
      setNewBook({ title: '', subtitle: '', author: '', description: '', releaseYear: '2024', coverUrl: '', buyUrl: 'https://www.ingramspark.com/' });
      setMasteringSuccess(false);
      setError(null);
      alert("MASTER VERIFIED: Indexed in Protocol V8 Vault.");
    } catch (e: any) {
      setError(`VAULT FAIL: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("CRITICAL PURGE: This closes all vault handles and erases all data. Continue?")) {
      await purgeVault();
      window.location.reload();
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-4 mb-6">
               <span className="text-[var(--accent)] tracking-[0.6em] uppercase text-[10px] font-bold block">Master Registry</span>
               {vaultStats && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <div className={`w-1 h-1 rounded-full ${vaultStats.healthy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                    <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">Protocol V8 Linked</span>
                 </div>
               )}
            </div>
            <h1 className="text-6xl md:text-9xl font-serif font-black mb-12 italic leading-none tracking-tighter uppercase text-white">Book <span className="animate-living-amber">Registry.</span></h1>
            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl leading-relaxed italic opacity-80">"Industrial Resilience Protocol V8.0 Active. Verified Committal Enabled."</p>
          </div>
          <div className="pb-12 flex flex-col md:flex-row gap-6">
            <button onClick={() => setIsAddingBook(true)} className="bg-[var(--accent)] text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 transition-all rounded-sm border border-orange-500/20">Register Master</button>
            <button onClick={handleReset} className="text-[7px] text-red-900 font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Factory Reset</button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
          {galleryBooks.map((book) => (
            <div key={book.id} className="group flex flex-col relative animate-fade-in">
              <Link to={`/book/${book.slug}`} className="relative mb-8 block shadow-2xl border-l-[10px] border-black rounded-r-sm bg-[#0a0a0a] aspect-[16/27] overflow-hidden flex items-center justify-center p-3">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} loading="eager" className="w-full h-full object-contain grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                ) : (
                  <div className="text-gray-800 text-[10px] font-black uppercase tracking-widest text-center px-6">Empty Master</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent opacity-60"></div>
              </Link>
              <h3 className="text-3xl font-serif font-bold italic mb-1 text-white group-hover:text-[var(--accent)] transition-colors">{book.title}</h3>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">By {book.author} • {book.releaseYear}</p>
              <Link to={`/book/${book.slug}`} className="mt-8 border border-white/10 text-white text-center py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all rounded-sm">Examine Master</Link>
            </div>
          ))}
          <div onClick={() => setIsAddingBook(true)} className="border border-white/5 border-dashed p-12 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:border-[var(--accent)]/40 transition-all group aspect-[16/27] cursor-pointer rounded-sm">
             <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-[var(--accent)] text-2xl font-serif italic">+</span>
             </div>
             <h4 className="text-white font-serif italic text-xl">Register Master</h4>
          </div>
        </div>
      </div>

      {/* Protocol V8 Diagnostic Tool */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 border-t border-white/5 mt-24">
         <button onClick={() => setShowDiagnostics(!showDiagnostics)} className="text-[9px] font-black text-gray-700 uppercase tracking-widest hover:text-orange-500 transition-colors">
            {showDiagnostics ? 'Hide Vault Audit' : 'Show Vault Audit (Diagnostics)'}
         </button>
         
         {showDiagnostics && (
           <div className="mt-8 bg-black/40 border border-white/10 p-10 rounded-sm animate-fade-in overflow-x-auto">
              <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-6 underline">Registry Hardware Status</h4>
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-white/10">
                       <th className="py-4 text-[8px] font-bold text-gray-600 uppercase">ID</th>
                       <th className="py-4 text-[8px] font-bold text-gray-600 uppercase">Title</th>
                       <th className="py-4 text-[8px] font-bold text-gray-600 uppercase">Slug</th>
                       <th className="py-4 text-[8px] font-bold text-gray-600 uppercase">Master Asset</th>
                    </tr>
                 </thead>
                 <tbody className="text-[10px] font-mono text-gray-400">
                    {books.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center italic text-gray-700">Vault reported zero registered masters.</td></tr>
                    ) : (
                      books.map(b => (
                        <tr key={b.id} className="border-b border-white/5">
                           <td className="py-4 pr-6 opacity-40">{b.id}</td>
                           <td className="py-4 pr-6 text-white font-serif">{b.title}</td>
                           <td className="py-4 pr-6 text-orange-500">{b.slug}</td>
                           <td className="py-4 pr-6 text-[8px]">{b.coverUrl ? `READY (${(b.coverUrl.length / 1024).toFixed(1)}kb)` : 'MISSING'}</td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
         )}
      </div>

      {isAddingBook && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-7xl w-full bg-[#0a0a0a] border border-white/10 p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsAddingBook(false)} className="absolute top-8 right-8 text-gray-700 hover:text-white text-3xl leading-none">×</button>
            <h2 className="text-4xl font-serif italic text-white mb-6 border-b border-white/5 pb-6 uppercase tracking-tighter">Vault Registration</h2>
            
            {error && <div className="bg-red-500/10 border border-red-500/50 p-6 mb-10 rounded-sm text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</div>}

            <div className="grid lg:grid-cols-3 gap-12">
               <div className="lg:col-span-1 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Book Title</label>
                    <input value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-[var(--accent)] text-white rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">IngramSpark Storefront Link</label>
                    <input value={newBook.buyUrl} onChange={e => setNewBook({...newBook, buyUrl: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-cyan-500 text-cyan-400 rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Full Blurb</label>
                    <textarea value={newBook.description} onChange={e => setNewBook({...newBook, description: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none text-white min-h-[220px] rounded-sm resize-none" placeholder="The permanent narrative text..." />
                  </div>
               </div>
               
               <div className="lg:col-span-1 space-y-8">
                  <label className="text-[9px] font-bold text-orange-500 uppercase tracking-widest underline">High-Res Front Master (JPEG)</label>
                  <div onClick={() => frontInputRef.current?.click()} className="w-full aspect-[16/27] bg-black border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer group hover:border-[var(--accent)]/40 relative overflow-hidden rounded-sm p-4 transition-all">
                    {newBook.coverUrl ? (
                      <div className="w-full h-full relative">
                        <img src={newBook.coverUrl} className="w-full h-full object-contain" alt="Master Preview" />
                        {masteringSuccess && (
                          <div className="absolute inset-x-0 bottom-0 bg-green-500 text-white p-3 flex flex-col items-center animate-living-amber-bg">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Master Ready</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-[10px] text-gray-700 uppercase tracking-widest block mb-2">Upload JPEG Asset</span>
                        <span className="text-[8px] text-gray-800 uppercase italic">Target < 1.0MB for stability.</span>
                      </div>
                    )}
                    <input type="file" ref={frontInputRef} onChange={handleFileUpload} className="hidden" accept="image/png,image/jpeg" />
                  </div>
                  <button onClick={handleSave} disabled={!newBook.title || !newBook.coverUrl || isProcessing} className="w-full bg-orange-500 text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl disabled:opacity-20 transition-all rounded-sm">
                    {isProcessing ? "Verifying Sync..." : "Sync To Master Vault"}
                  </button>
               </div>

               <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 p-8 rounded-sm self-start">
                  <h4 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-6 underline">Sovereign Audit V8</h4>
                  <div className="space-y-6 text-[9px] text-gray-500 uppercase tracking-widest leading-loose">
                    <p>Committal: Uses <span className="text-white font-bold">Strict Durability</span> transactions with post-write read-back verification.</p>
                    <p>Asset Status: Master image is buffered in <span className="text-white font-bold">Base64 Binary</span>. Current size estimate: {(newBook.coverUrl?.length ? (newBook.coverUrl.length / 1024).toFixed(0) : 0)}kb.</p>
                    <p>Recovery: Use the <span className="text-white font-bold">Audit Log</span> at the bottom of the main registry if UI elements fail to hydrate.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {masteringAsset && (
        <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-4xl w-full flex flex-col h-full max-h-[90vh]">
            <div className="mb-8 flex justify-between items-end">
               <div><h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Precision Mastery Tool</h3></div>
               <button onClick={() => setMasteringAsset(null)} className="text-gray-500 hover:text-white text-5xl leading-none">&times;</button>
            </div>

            <div className={`flex-grow bg-[#050505] border border-white/10 relative overflow-hidden flex items-center justify-center ${useIndustrialCrop ? 'cursor-move' : ''}`}
                 onMouseDown={(e) => { if (useIndustrialCrop) { setIsDragging(true); startPos.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }; } }}
                 onMouseMove={(e) => { if (isDragging && useIndustrialCrop) setCropOffset({ ...cropOffset, x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y }); }}
                 onMouseUp={() => setIsDragging(false)}
                 onMouseLeave={() => setIsDragging(false)}
                 onWheel={(e) => { if (useIndustrialCrop) setCropOffset(prev => ({ ...prev, scale: Math.max(0.1, Math.min(5, prev.scale - e.deltaY * 0.001)) })); }}
            >
               <img src={masteringAsset.url} 
                    style={{ transform: useIndustrialCrop ? `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropOffset.scale})` : 'none' }}
                    className={`${useIndustrialCrop ? 'max-h-[80%]' : 'max-w-full max-h-full object-contain'} transition-transform duration-75 pointer-events-none select-none`}
               />
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-8 bg-black/40 p-8 border border-white/5 rounded-sm">
               <div className="flex bg-white/5 p-1 border border-white/10 rounded-sm">
                 <button onClick={() => setUseIndustrialCrop(false)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${!useIndustrialCrop ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Original Ratio</button>
                 <button onClick={() => setUseIndustrialCrop(true)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${useIndustrialCrop ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Industrial (16:27)</button>
               </div>
               <button onClick={commitMastering} className="bg-orange-500 text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 transition-all rounded-sm">Commit Master</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedBooks;
