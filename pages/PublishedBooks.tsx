
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

// Absolute Ceiling: 3.5MB (Support for a 3MB JPEG Master + registry overhead)
const MAX_FILE_SIZE = 3.5 * 1024 * 1024;
const INDUSTRIAL_ASPECT = 1600 / 2700; 

const PublishedBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  
  const [masteringAsset, setMasteringAsset] = useState<{ 
    url: string, 
    originalSize: number,
    width: number,
    height: number
  } | null>(null);

  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0, scale: 1 });
  const [useIndustrialCrop, setUseIndustrialCrop] = useState(false);
  const [masteringGrade, setMasteringGrade] = useState<'sovereign' | 'legacy'>('sovereign');
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    subtitle: '',
    author: '',
    description: '',
    releaseYear: new Date().getFullYear().toString(),
    coverUrl: ''
  });

  const frontInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRegistry();
  }, []);

  const loadRegistry = () => {
    const saved = localStorage.getItem('aca_published_books');
    const userBooks: Book[] = saved ? JSON.parse(saved) : [];
    const combined = [...userBooks];
    SAMPLE_BOOKS.forEach(sample => {
      if (!combined.find(b => b.slug === sample.slug)) combined.push(sample);
    });
    setBooks(combined);
    
    // Storage check (2 bytes per character)
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) totalChars += localStorage.getItem(key)?.length || 0;
    }
    setStorageUsed((totalChars * 2) / (1024 * 1024)); 
  };

  const exportRegistry = () => {
    const saved = localStorage.getItem('aca_published_books');
    if (!saved) return;
    const blob = new Blob([saved], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACA-Registry-Backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importRegistry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        JSON.parse(data);
        localStorage.setItem('aca_published_books', data);
        loadRegistry();
        alert("Sovereign Registry Restored.");
      } catch (err) {
        alert("Invalid vault file.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`OVERSIZE DETECTED: ${(file.size / 1024 / 1024).toFixed(1)}MB is too large. Target 3.0MB for best stability.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setMasteringAsset({ 
          url, 
          originalSize: file.size,
          width: img.width,
          height: img.height
        });
        setCropOffset({ x: 0, y: 0, scale: 1 });
        setError(null);
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
      
      if (useIndustrialCrop) {
        canvas.width = 1600;
        canvas.height = 2700;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

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

      // Mastering Fidelity Logic
      // 1.0 = Absolute Fidelity (Targets ~3MB)
      // 0.85 = Optimized (Targets ~1.5MB)
      const quality = masteringGrade === 'sovereign' ? 1.0 : 0.85;
      const finalDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      setNewBook(prev => ({ ...prev, coverUrl: finalDataUrl }));
      setMasteringAsset(null);
      setIsProcessing(false);
    };
    img.src = masteringAsset.url;
  };

  const saveNewBook = () => {
    if (!newBook.title || !newBook.coverUrl) return;
    const bookToSave: Book = {
      id: Date.now().toString(),
      title: newBook.title,
      subtitle: newBook.subtitle || '',
      author: newBook.author || 'Anonymous',
      description: newBook.description || '',
      coverUrl: newBook.coverUrl,
      releaseYear: newBook.releaseYear || '2024',
      slug: newBook.title.toLowerCase().replace(/\s+/g, '-')
    };
    
    try {
      const current = localStorage.getItem('aca_published_books');
      const existing = current ? JSON.parse(current) : [];
      localStorage.setItem('aca_published_books', JSON.stringify([bookToSave, ...existing]));
      loadRegistry();
      setIsAddingBook(false);
      setNewBook({ title: '', subtitle: '', author: '', description: '', releaseYear: '2024', coverUrl: '' });
    } catch (e) {
      setError("REGISTRY SATURATED: Browser cannot hold more high-res assets. Please 'Backup Registry' and clear the vault.");
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in">
          <div>
            <span className="text-[var(--accent)] tracking-[0.6em] uppercase text-[10px] font-bold mb-6 block">The Storefront</span>
            <h1 className="text-6xl md:text-9xl font-serif font-black mb-12 italic leading-none tracking-tighter uppercase">Frontal <span className="animate-living-amber">Masters.</span></h1>
            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl leading-relaxed italic opacity-80">"Optimized for 3MB JPEG clarity. Colors and Whites locked at 100% fidelity."</p>
          </div>
          <div className="pb-12 flex flex-col md:flex-row gap-6">
            <div className="flex flex-col gap-2">
              <button onClick={() => setIsAddingBook(true)} className="bg-[var(--accent)] text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 transition-all rounded-sm">Register Master</button>
              <div className="flex items-center gap-2 px-1">
                <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${storageUsed > 4 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(230,126,34,0.5)]'}`} style={{ width: `${(storageUsed / 5) * 100}%` }}></div>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${storageUsed > 4 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>{storageUsed.toFixed(1)}MB / 5.0MB</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={exportRegistry} className="border border-white/10 text-white px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all rounded-sm">Backup Registry</button>
              <button onClick={() => importInputRef.current?.click()} className="text-[7px] text-gray-700 font-bold uppercase tracking-widest hover:text-orange-500 transition-colors text-center underline underline-offset-4">Restore Registry</button>
              <input type="file" ref={importInputRef} onChange={importRegistry} className="hidden" accept=".json" />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
          {books.map((book) => (
            <div key={book.id} className="group flex flex-col relative animate-fade-in">
              <Link to={`/book/${book.slug}`} className="relative mb-8 block shadow-2xl border-l-[10px] border-black rounded-r-sm bg-[#0a0a0a] aspect-[16/27] overflow-hidden flex items-center justify-center p-3">
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-contain grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent opacity-60"></div>
              </Link>
              <h3 className="text-3xl font-serif font-bold italic mb-1 text-white group-hover:text-[var(--accent)] transition-colors">{book.title}</h3>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">By {book.author} • {book.releaseYear}</p>
              <Link to={`/book/${book.slug}`} className="mt-8 border border-white/10 text-white text-center py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all rounded-sm">Examine Master</Link>
            </div>
          ))}
          <div onClick={() => setIsAddingBook(true)} className="border border-white/5 border-dashed p-12 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:border-[var(--accent)]/40 transition-all group aspect-[16/27] cursor-pointer rounded-sm">
             <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6"><span className="text-[var(--accent)] text-2xl">+</span></div>
             <h4 className="text-white font-serif italic text-xl">Register Master</h4>
          </div>
        </div>
      </div>

      {isAddingBook && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-7xl w-full bg-[#0a0a0a] border border-white/10 p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsAddingBook(false)} className="absolute top-8 right-8 text-gray-700 hover:text-white text-3xl leading-none">×</button>
            <h2 className="text-4xl font-serif italic text-white mb-6 border-b border-white/5 pb-6">Frontal Mastery Registry</h2>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-6 mb-10 rounded-sm">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-loose">{error}</p>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-12">
               <div className="lg:col-span-1 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Book Title</label>
                    <input value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-[var(--accent)] text-white rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Author</label>
                    <input value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-[var(--accent)] text-white rounded-sm" />
                  </div>
                  <textarea value={newBook.description} onChange={e => setNewBook({...newBook, description: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none text-white min-h-[120px] rounded-sm" placeholder="Description..." />
               </div>
               
               <div className="lg:col-span-1 space-y-8">
                  <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest text-orange-500 underline">High-Res Front Master</label>
                  <div onClick={() => frontInputRef.current?.click()} className="w-full aspect-[16/27] bg-black border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer group hover:border-[var(--accent)]/40 relative overflow-hidden rounded-sm p-4 transition-all">
                    {newBook.coverUrl ? <img src={newBook.coverUrl} className="w-full h-full object-contain" /> : <span className="text-[10px] text-gray-700 uppercase tracking-widest">Upload High-Fidelity Asset</span>}
                    <input type="file" ref={frontInputRef} onChange={handleFileUpload} className="hidden" accept="image/png,image/jpeg" />
                  </div>
                  <button onClick={saveNewBook} disabled={!newBook.title || !newBook.coverUrl || !!error || isProcessing} className="w-full bg-orange-500 text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl disabled:opacity-20 transition-all rounded-sm">Sync Registry</button>
               </div>

               <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 p-8 rounded-sm self-start">
                  <h4 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-6 underline">Industrial Standards</h4>
                  <div className="space-y-6 text-[9px] text-gray-500 uppercase tracking-widest leading-loose">
                    <p>Focus: <span className="text-white">Full Frontal Resolution</span>. All eggs are in this basket for maximum fidelity.</p>
                    <p>Resolution: Target <span className="text-white">3.0MB JPEG</span>. Use the Sovereign Grade (100% Quality) to ensure bright whites and crisp typography.</p>
                    <p>Registry Health: UI Backgrounds are external and do not take up vault space. Only your books eat into the 5MB limit.</p>
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
               <div>
                  <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Precision Frontal Mastery</h3>
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                    {useIndustrialCrop ? `Recalibrating to 1600 x 2700` : `Preserving Original: ${masteringAsset.width} x ${masteringAsset.height} px`}
                  </p>
               </div>
               <button onClick={() => setMasteringAsset(null)} className="text-gray-600 hover:text-white text-3xl">&times;</button>
            </div>

            <div className={`flex-grow bg-[#050505] border border-white/10 relative overflow-hidden flex items-center justify-center ${useIndustrialCrop ? 'cursor-move' : ''}`}
                 onMouseDown={(e) => { if (useIndustrialCrop) { setIsDragging(true); startPos.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }; } }}
                 onMouseMove={(e) => { if (isDragging && useIndustrialCrop) setCropOffset({ ...cropOffset, x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y }); }}
                 onMouseUp={() => setIsDragging(false)}
                 onMouseLeave={() => setIsDragging(false)}
                 onWheel={(e) => { if (useIndustrialCrop) setCropOffset(prev => ({ ...prev, scale: Math.max(0.1, Math.min(5, prev.scale - e.deltaY * 0.001)) })); }}
            >
               {useIndustrialCrop && (
                 <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <div className="h-[80%] aspect-[16/27] border-2 border-orange-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] relative">
                       <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-orange-500 -mt-0.5 -ml-0.5"></div>
                       <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-orange-500 -mt-0.5 -mr-0.5"></div>
                       <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-orange-500 -mb-0.5 -ml-0.5"></div>
                       <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-orange-500 -mb-0.5 -mr-0.5"></div>
                    </div>
                 </div>
               )}

               <img src={masteringAsset.url} 
                    style={{ transform: useIndustrialCrop ? `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropOffset.scale})` : 'none' }}
                    className={`${useIndustrialCrop ? 'max-h-[80%]' : 'max-w-full max-h-full object-contain'} transition-transform duration-75 pointer-events-none select-none`}
               />
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-8 bg-black/40 p-8 border border-white/5 rounded-sm">
               <div className="flex flex-wrap items-center gap-8">
                  <div className="flex bg-white/5 p-1 border border-white/10 rounded-sm">
                    <button onClick={() => setUseIndustrialCrop(false)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${!useIndustrialCrop ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Original Ratio</button>
                    <button onClick={() => setUseIndustrialCrop(true)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${useIndustrialCrop ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Industrial (16:27)</button>
                  </div>
                  
                  <div className="flex bg-white/5 p-1 border border-white/10 rounded-sm">
                    <button onClick={() => setMasteringGrade('legacy')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${masteringGrade === 'legacy' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Legacy (1.5MB)</button>
                    <button onClick={() => setMasteringGrade('sovereign')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${masteringGrade === 'sovereign' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Sovereign (3MB+)</button>
                  </div>
               </div>
               <button onClick={commitMastering} className="bg-orange-500 text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 transition-all rounded-sm">Commit Frontal Master</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedBooks;
