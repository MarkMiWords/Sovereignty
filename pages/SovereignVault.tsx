
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { VaultStorage, VaultSheet, Chapter } from '../types';
import { readObject, readArray, writeJson, k } from '../utils/safeStorage';
import { checkSystemHeartbeat } from '../services/geminiService';

const VAULT_NAME = 'aca_sovereign_registry';
const VAULT_VERSION = 4;

const SovereignVault: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFolder, setActiveFolder] = useState<'sheets' | 'books' | 'courier' | 'heartbeat'>('sheets');
  const [heartbeat, setHeartbeat] = useState<{ status: 'loading' | 'online' | 'offline' | 'error', message: string }>({ status: 'loading', message: 'Checking Status...' });
  const [isExporting, setIsExporting] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  
  const [vault, setVault] = useState<VaultStorage>(() => {
    const data = readObject<any>('sovereign_vault', {});
    return {
      sheets: Array.isArray(data?.sheets) ? data.sheets : [],
      books: Array.isArray(data?.books) ? data.books : [],
      ai: Array.isArray(data?.ai) ? data.ai : [],
      audits: Array.isArray(data?.audits) ? data.audits : []
    };
  });

  useEffect(() => {
    loadVaultBooks();
    refreshHeartbeat();
  }, []);

  const refreshHeartbeat = async () => {
    setHeartbeat({ status: 'loading', message: 'Checking Status...' });
    try {
      const result = await checkSystemHeartbeat();
      setHeartbeat(result);
    } catch (e: any) {
      setHeartbeat({ status: 'error', message: e.message || 'System offline.' });
    }
  };

  const loadVaultBooks = () => {
    try {
      const openVaultRequest = indexedDB.open(VAULT_NAME, VAULT_VERSION);
      openVaultRequest.onsuccess = () => {
        const db = openVaultRequest.result;
        if (db.objectStoreNames.contains('books')) {
          const tx = db.transaction('books', 'readonly');
          const store = tx.objectStore('books');
          const request = store.getAll();
          request.onsuccess = () => {
            setVault(prev => ({ 
              ...prev, 
              books: Array.isArray(request.result) ? request.result : [] 
            }));
          };
        }
      };
    } catch (e) {
      console.warn("Vault DB Failure:", e);
    }
  };

  const restoreSheet = (sheet: any) => {
    if (!sheet || !sheet.data) return;
    try {
      const currentSheets = readArray<any>('wrap_sheets_v4', []);
      const updatedRegistry = [{ ...sheet.data, id: `restored-${Date.now()}` }, ...currentSheets];
      writeJson('wrap_sheets_v4', updatedRegistry);
      alert("Sheet successfully restored to Studio.");
      navigate('/author-builder');
    } catch (e) {
      alert("Restoration Failure: Block Corrupted.");
    }
  };

  const handleExportCourierPackage = () => {
    setIsExporting(true);
    try {
      // PACKAGE EVERYTHING: Vault + Sheets + Profile
      const packageData = {
        meta: { 
          timestamp: new Date().toISOString(), 
          protocol: "COURIER_V5",
          author: localStorage.getItem(k('aca_author_profile')) ? JSON.parse(localStorage.getItem(k('aca_author_profile'))!).name : 'Unknown'
        },
        payload: {
          vault: readObject('sovereign_vault', {}),
          sheets: readArray('wrap_sheets_v4', []),
          profile: readObject('aca_author_profile', {})
        }
      };
      
      const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ACA-Courier-Package-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Handover Protocol Failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleIngestCourierPackage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsIngesting(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const packageData = JSON.parse(event.target?.result as string);
        if (packageData.protocol !== "COURIER_V5") {
          throw new Error("INVALID_PROTOCOL: This package is incompatible with the Forge v5.");
        }

        if (window.confirm(`INGESTION WARNING: This will merge/overwrite your current studio with data from "${packageData.meta.author}". Proceed?`)) {
          const { vault: vData, sheets: sData, profile: pData } = packageData.payload;
          
          if (vData) writeJson('sovereign_vault', vData);
          if (sData) writeJson('wrap_sheets_v4', sData);
          if (pData) writeJson('aca_author_profile', pData);

          alert("Courier Ingestion Complete. Reloading Studio...");
          window.location.reload();
        }
      } catch (err: any) {
        alert("INGESTION_FAILURE: " + err.message);
      } finally {
        setIsIngesting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 pt-24 font-sans relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <section className="max-w-7xl mx-auto px-6 py-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-end relative z-10">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_10px_var(--accent)]"></div>
             <span className="text-[var(--accent)] tracking-[0.5em] uppercase text-[10px] font-black">Archive Center</span>
          </div>
          <h1 className="text-7xl font-serif font-black italic text-white tracking-tighter uppercase">THE BIG <span className="text-[var(--accent)]">HOUSE.</span></h1>
        </div>
        <div className="pb-4 flex items-center gap-4">
           <div className={`w-3 h-3 rounded-full ${heartbeat.status === 'online' ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : heartbeat.status === 'loading' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Forge Status: {(heartbeat.status || 'OFFLINE').toUpperCase()}</span>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 relative z-10">
        <aside className="w-full md:w-80 space-y-2 shrink-0">
          <button onClick={() => setActiveFolder('sheets')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'sheets' ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">The Sheets</span>
          </button>
          <button onClick={() => setActiveFolder('books')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'books' ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">The Bookshelf</span>
          </button>
          <button onClick={() => setActiveFolder('courier')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'courier' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Courier Protocol</span>
          </button>
          <button onClick={() => setActiveFolder('heartbeat')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'heartbeat' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">System Heartbeat</span>
          </button>
          
          <div className="pt-10">
            <button onClick={handleExportCourierPackage} disabled={isExporting} className={`w-full text-left p-8 bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-sm group ${isExporting ? 'animate-pulse opacity-50' : ''}`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-white">Handover Protocol</p>
              <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Package full studio for transport</p>
            </button>
          </div>
        </aside>

        <main className="flex-grow">
          {activeFolder === 'sheets' && (
            <div className="grid gap-4 animate-fade-in">
              {vault.sheets.length === 0 ? (
                <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif">Registry Empty.</div>
              ) : (
                vault.sheets.map((s: any) => (
                  <div key={s.id} className="p-10 bg-[#0d0d0d] border border-white/5 flex items-center justify-between group rounded-sm hover:border-[var(--accent)]/30 transition-all">
                    <div className="space-y-1">
                       <h3 className="text-3xl font-serif italic text-white tracking-tighter">{s.data?.title || "Untitled Fragment"}</h3>
                       <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{new Date(s.timestamp).toLocaleDateString()} • {s.status.toUpperCase()}</p>
                    </div>
                    <button onClick={() => restoreSheet(s)} className="px-10 py-4 border border-[var(--accent)] text-[var(--accent)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all rounded-sm">Restore</button>
                  </div>
                ))
              )}
            </div>
          )}
          {activeFolder === 'books' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              {vault.books.length === 0 ? (
                <div className="col-span-full p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif">No registered masters.</div>
              ) : (
                vault.books.map((book: any) => (
                  <Link key={book.id} to={`/book/${book.slug}`} className="bg-[#0d0d0d] border border-white/5 p-8 rounded-sm hover:border-[var(--accent)]/30 transition-all group">
                    <div className="aspect-[16/27] overflow-hidden mb-6 border border-white/5 bg-black">
                       <img src={book.coverUrl} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700" alt={book.title} />
                    </div>
                    <h3 className="text-2xl font-serif italic text-white mb-2 group-hover:text-[var(--accent)]">{book.title}</h3>
                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Master Edition • {book.releaseYear}</p>
                  </Link>
                ))
              )}
            </div>
          )}
          {activeFolder === 'courier' && (
            <div className="space-y-10 animate-fade-in">
              <div className="bg-[#0a0a0a] border border-cyan-500/20 p-12 rounded-sm shadow-2xl">
                 <h3 className="text-4xl font-serif italic text-white mb-8">Courier & Invitation Hub</h3>
                 
                 <div className="grid md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div>
                        <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">Step 1: The Invitation</h4>
                        <p className="text-gray-400 text-sm font-light leading-relaxed mb-6">Send this link and access cipher to a trusted friend. They must use the cipher to enter the gate.</p>
                        <div className="p-6 bg-black border border-white/5 rounded-sm space-y-4">
                           <div>
                              <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Cipher Phrase</p>
                              <p className="text-xl font-serif italic text-white underline decoration-cyan-500/40 underline-offset-4">captivate me</p>
                           </div>
                           <div>
                              <p className="text-[8px] text-gray-600 uppercase font-black mb-1">Studio Link</p>
                              <p className="text-[10px] font-mono text-cyan-500 truncate">{window.location.origin}</p>
                           </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">Step 2: Package for Transport</h4>
                        <p className="text-gray-400 text-sm font-light leading-relaxed mb-4">Generate a secure package containing your sheets, profile, and registry. You can then send this file to your friend.</p>
                        <button onClick={handleExportCourierPackage} disabled={isExporting} className="w-full py-5 bg-cyan-500 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-cyan-600 transition-all rounded-sm">
                           {isExporting ? 'Packaging...' : 'Generate Courier Package'}
                        </button>
                      </div>
                   </div>

                   <div className="space-y-8 border-l border-white/5 pl-12">
                      <div>
                        <h4 className="text-white text-[10px] font-black uppercase tracking-widest mb-4">Ingest Received Package</h4>
                        <p className="text-gray-400 text-sm font-light leading-relaxed mb-6">If a trusted author sent you a Courier Package, upload it here to view their sheets and profile in your local studio.</p>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-12 border-2 border-dashed border-white/10 hover:border-cyan-500/40 text-gray-700 hover:text-cyan-400 transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-4 group">
                           <svg className="w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                           {isIngesting ? 'Syncing...' : 'Upload .JSON Package'}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleIngestCourierPackage} className="hidden" accept=".json" />
                      </div>
                      
                      <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-sm">
                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-2">⚠ Security Warning</p>
                        <p className="text-[10px] text-gray-500 italic leading-relaxed">Ingesting a package will overwrite your current WRAP profile and Wrap Sheets. Ensure you have backed up your own work first.</p>
                      </div>
                   </div>
                 </div>

                 <div className="mt-12 p-8 bg-cyan-900/10 border border-cyan-500/20 italic text-cyan-100 text-sm leading-relaxed">
                   "The Courier Protocol bypasses the internet cloud entirely. Your data moves as a physical file, author-to-author."
                 </div>
              </div>
            </div>
          )}
          {activeFolder === 'heartbeat' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-[#0a0a0a] border border-green-500/20 p-12 rounded-sm shadow-2xl">
                 <h3 className="text-4xl font-serif italic text-white mb-12">Forge Heartbeat</h3>
                 <div className="p-10 bg-black border border-white/5 rounded-sm flex items-center justify-between">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logic Stream</p>
                       <p className={`text-4xl font-serif italic ${heartbeat.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>{(heartbeat.status).toUpperCase()}</p>
                    </div>
                    <button onClick={refreshHeartbeat} className="text-[10px] font-black text-green-500 border border-green-500/30 px-6 py-2">Refresh</button>
                 </div>
                 <div className="p-10 mt-6 bg-black border border-white/10 rounded-sm italic text-gray-400">"{heartbeat.message}"</div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SovereignVault;
