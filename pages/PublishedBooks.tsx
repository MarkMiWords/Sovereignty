
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { generateImage } from '../services/geminiService';
// Added missing 'k' import
import { syncShadowRegistry, readJson, k } from '../utils/safeStorage';

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

const MAX_FILE_SIZE = 2.5 * 1024 * 1024; // Bumped to 2.5MB for better quality masters
const INDUSTRIAL_ASPECT = 1600 / 2700; 

const VAULT_NAME = 'aca_sovereign_registry';
const VAULT_VERSION = 4;

const openVault = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VAULT_NAME, VAULT_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    // Handle database blocking
    request.onblocked = () => {
      console.warn("DB Blocked. Attempting recovery...");
      reject(new Error("DB_BLOCKED"));
    };
  });
};

const saveToVault = async (book: Book) => {
  const db = await openVault();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('books', 'readwrite');
    const store = transaction.objectStore('books');
    store.put(book);
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
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
  } catch (e) {
    console.warn("Vault retrieval failure, falling back to shadow registry.");
    return [];
  }
};

const PublishedBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [masteringSuccess, setMasteringSuccess] = useState(false);
  
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
  }, []);

  const loadRegistry = async () => {
    const userBooks = await getFromVault();
    const shadowBooks = readJson<any[]>('shadow_book_registry', []);
    
    // Merge Strategy: Primary DB -> Shadow Registry -> Samples
    let finalBooks = [...userBooks];
    
    // If DB is empty, use shadow registry to show metadata
    if (finalBooks.length === 0 && shadowBooks.length > 0) {
      finalBooks = shadowBooks.map(s => ({
        ...s,
        coverUrl: '', // Explicitly mark as needing re-sync
        status: 'sync_required'
      }));
    }

    SAMPLE_BOOKS.forEach(sample => {
      if (!finalBooks.find(b => b.slug === sample.slug)) finalBooks.push(sample);
    });
    
    setBooks(finalBooks);
    syncShadowRegistry(finalBooks);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`CRITICAL OVERSIZE: ${(file.size / 1024 / 1024).toFixed(1)}MB. Use 2.5MB for stability.`);
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

  const handleAIDesign = async () => {
    if (!newBook.description) {
      setError("DESIGN PROTOCOL: Provide a description first to guide the AI.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateImage(newBook.description);
      const img = new Image();
      img.onload = () => {
        setMasteringAsset({ url: result.imageUrl, originalSize: 0, width: img.width, height: img.height });
        setCropOffset({ x: 0, y: 0, scale: 1 });
        setUseIndustrialCrop(true);
      };
      img.src = result.imageUrl;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const commitMastering = async () => {
    if (!masteringAsset) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Scaled down slightly to ensure memory stability on mobile
      canvas.width = useIndustrialCrop ? 1200 : img.width;
      canvas.height = useIndustrialCrop ? 2025 : img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (useIndustrialCrop) {
        const imgAspect = img.width / img.height;
        let drawW, drawH;
        if (imgAspect > (1200/2025)) {
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

      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setNewBook(prev => ({ ...prev, coverUrl: finalDataUrl }));
      setMasteringAsset(null);
      setIsProcessing(false);
      setMasteringSuccess(true);
    };
    img.src = masteringAsset.url;
  };

  const saveNewBook = async () => {
    if (!newBook.title || !newBook.coverUrl) {
      setError("INTEGRITY ERROR: Title and Master Image are mandatory for Vault registry.");
      return;
    }
    
    const uniqueSlug = newBook.title.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const bookToSave: Book = {
      id: Date.now().toString(),
      title: newBook.title,
      subtitle: newBook.subtitle || '',
      author: newBook.author || 'Anonymous',
      description: newBook.description || '',
      coverUrl: newBook.coverUrl,
      buyUrl: newBook.buyUrl || 'https://www.ingramspark.com/',
      releaseYear: newBook.releaseYear || '2024',
      slug: uniqueSlug
    };
    
    try {
      await saveToVault(bookToSave);
      await loadRegistry();
      setIsAddingBook(false);
      setNewBook({ title: '', subtitle: '', author: '', description: '', releaseYear: '2024', coverUrl: '', buyUrl: 'https://www.ingramspark.com/' });
      setMasteringSuccess(false);
      setError(null);
    } catch (e) {
      setError("VAULT WRITE ERROR: The database is locked. Try refreshing or clearing memory.");
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in">
          <div>
            <span className="text-[var(--accent)] tracking-[0.6em] uppercase text-[10px] font-bold mb-6 block">Master Registry</span>
            <h1 className="text-6xl md:text-9xl font-serif font-black mb-12 italic leading-none tracking-tighter uppercase text-white">Book <span className="animate-living-amber">Registry.</span></h1>
            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl leading-relaxed italic opacity-80">"Shadow Registry Active — Meta-Persistent Workspace."</p>
          </div>
          <div className="pb-12 flex flex-col md:flex-row gap-6">
            <button onClick={() => setIsAddingBook(true)} className="animate-living-amber-bg text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all rounded-sm">Register Master</button>
            <button onClick={() => { if(window.confirm("Erase all local books?")) { localStorage.removeItem(k('shadow_book_registry')); window.location.reload(); } }} className="text-[7px] text-red-900 font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Clear Shadow Buffer</button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
          {books.map((book) => (
            <div key={book.id} className="group flex flex-col relative animate-fade-in">
              <Link to={`/book/${book.slug}`} className="relative mb-8 block shadow-2xl border-l-[10px] border-black rounded-r-sm bg-[#0a0a0a] aspect-[16/27] overflow-hidden flex items-center justify-center p-3">
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-contain grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                  />
                ) : (
                  <div className="text-gray-800 text-[10px] font-black uppercase tracking-widest text-center px-6">
                    <p className="mb-4">Shadow Sync Only</p>
                    <span className="text-[8px] border border-orange-500/30 px-3 py-1 text-orange-500">Re-Link Required</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent opacity-60"></div>
              </Link>
              <h3 className="text-3xl font-serif font-bold italic mb-1 text-white group-hover:text-[var(--accent)] transition-colors">{book.title}</h3>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">By {book.author} • {book.releaseYear}</p>
              <Link to={`/book/${book.slug}`} className="mt-8 border border-white/10 text-white text-center py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all rounded-sm">Examine Master</Link>
            </div>
          ))}
        </div>
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
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Author</label>
                    <input value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-[var(--accent)] text-white rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Full Blurb / Description</label>
                    <textarea value={newBook.description} onChange={e => setNewBook({...newBook, description: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none text-white min-h-[160px] rounded-sm resize-none" placeholder="Enter definitive text..." />
                  </div>
               </div>
               
               <div className="lg:col-span-1 space-y-8">
                  <label className="text-[9px] font-bold text-orange-500 uppercase tracking-widest underline">Visual Assets Pathway</label>
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => frontInputRef.current?.click()} className="w-full py-4 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Upload JPEG Master</button>
                    <button onClick={handleAIDesign} disabled={isGenerating} className={`w-full py-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all ${isGenerating ? 'animate-pulse' : ''}`}>
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                  
                  <div className="w-full aspect-[16/27] bg-black border border-white/10 flex items-center justify-center relative overflow-hidden rounded-sm p-4">
                    {newBook.coverUrl ? (
                      <img src={newBook.coverUrl} className="w-full h-full object-contain" alt="Master Preview" />
                    ) : (
                      <div className="text-center text-gray-800 text-[10px] font-black uppercase tracking-widest italic">Awaiting Visual Master</div>
                    )}
                    <input type="file" ref={frontInputRef} onChange={handleFileUpload} className="hidden" accept="image/png,image/jpeg" />
                  </div>
                  <button onClick={saveNewBook} disabled={!newBook.title || !newBook.coverUrl || isProcessing} className="w-full animate-living-amber-bg text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl disabled:opacity-20 transition-all hover:brightness-110 rounded-sm">Commit to Registry</button>
               </div>

               <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 p-8 rounded-sm">
                  <h4 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-6 underline">Registry Guidance</h4>
                  <div className="space-y-6 text-[9px] text-gray-500 uppercase tracking-widest leading-loose">
                    <p>Pathway A: Upload your own high-fidelity cover image.</p>
                    <p>Pathway B: Use Gemini AI to synthesize a cover based on your blurb.</p>
                    <p>Shadow Lock: Your metadata is auto-synced to local memory for hibernation safety.</p>
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
               <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Mastering Tool</h3>
               <button onClick={() => setMasteringAsset(null)} className="text-gray-500 hover:text-white text-5xl leading-none">&times;</button>
            </div>

            <div className={`flex-grow bg-[#050505] border border-white/10 relative overflow-hidden flex items-center justify-center ${useIndustrialCrop ? 'cursor-move' : ''}`}
                 onMouseDown={(e) => { if (useIndustrialCrop) { setIsDragging(true); startPos.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }; } }}
                 onMouseMove={(e) => { if (isDragging && useIndustrialCrop) setCropOffset({ ...cropOffset, x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y }); }}
                 onMouseUp={() => setIsDragging(false)}
                 onWheel={(e) => { if (useIndustrialCrop) setCropOffset(prev => ({ ...prev, scale: Math.max(0.1, Math.min(5, prev.scale - e.deltaY * 0.001)) })); }}
            >
               <img src={masteringAsset.url} 
                    style={{ transform: useIndustrialCrop ? `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropOffset.scale})` : 'none' }}
                    className={`${useIndustrialCrop ? 'max-h-[80%]' : 'max-w-full max-h-full object-contain'} pointer-events-none select-none`}
               />
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-8 bg-black/40 p-8 border border-white/5 rounded-sm">
               <div className="flex bg-white/5 p-1 border border-white/10 rounded-sm">
                 <button onClick={() => setUseIndustrialCrop(false)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${!useIndustrialCrop ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Original</button>
                 <button onClick={() => setUseIndustrialCrop(true)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${useIndustrialCrop ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>Industrial (16:27)</button>
               </div>
               <button onClick={commitMastering} className="animate-living-amber-bg text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all rounded-sm">Commit Master</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedBooks;
