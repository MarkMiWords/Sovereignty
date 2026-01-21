
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { VaultStorage, VaultSheet, Book } from '../types';

// --- Sovereign Vault Core V4 ---
const VAULT_NAME = 'aca_sovereign_registry';
const VAULT_VERSION = 4;

const SovereignVault: React.FC = () => {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<'sheets' | 'books' | 'technical' | 'metrics'>('sheets');
  const [isMetricsAuthorized, setIsMetricsAuthorized] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState(false);
  
  const [vault, setVault] = useState<VaultStorage>(() => {
    try {
      const saved = localStorage.getItem('aca_sovereign_vault');
      if (!saved || saved === "undefined" || saved === "null") return { sheets: [], books: [], ai: [], audits: [], efficiencyLogs: [] };
      return JSON.parse(saved);
    } catch (e) {
      return { sheets: [], books: [], ai: [], audits: [], efficiencyLogs: [] };
    }
  });

  const efficiencyLogs = vault.efficiencyLogs || [];
  const totalResourceLoad = efficiencyLogs.reduce((acc, log) => acc + (log.metrics.simulatedResourceLoad || 0), 0);
  const RESOURCE_CAPACITY = 100.00;
  const remainingResource = RESOURCE_CAPACITY - totalResourceLoad;

  useEffect(() => {
    loadVaultBooks();
  }, []);

  const loadVaultBooks = () => {
    try {
      const openVaultRequest = indexedDB.open(VAULT_NAME, VAULT_VERSION);
      openVaultRequest.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
      };
      openVaultRequest.onsuccess = () => {
        const db = openVaultRequest.result;
        if (db.objectStoreNames.contains('books')) {
          const tx = db.transaction('books', 'readonly');
          const store = tx.objectStore('books');
          const request = store.getAll();
          request.onsuccess = () => {
            setVault(prev => ({ ...prev, books: request.result }));
          };
        }
      };
    } catch (e) {
      console.warn("IndexedDB Access Denied.");
    }
  };

  const handleMetricsAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.toUpperCase() === 'WHITLAM-75') {
      setIsMetricsAuthorized(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasscodeInput('');
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const fullFactoryReset = () => {
    if (window.confirm("PERMANENT ACTION: Wipe all Sovereign Registry data? This cannot be undone.")) {
      localStorage.clear();
      try {
        indexedDB.deleteDatabase(VAULT_NAME);
      } catch (e) {}
      alert("System purged. Redirecting...");
      window.location.href = "/";
    }
  };

  const restoreSheet = (sheet: VaultSheet) => {
    try {
      let currentSheets = [];
      const saved = localStorage.getItem('aca:v5:wrap_sheets_v4');
      if (saved) currentSheets = JSON.parse(saved);
      
      const restoredSheet = { 
        ...sheet.data, 
        id: `restored-${Date.now()}`,
        title: (sheet.data.title || 'Restored Sheet')
      };
      
      const updatedRegistry = [restoredSheet, ...currentSheets];
      localStorage.setItem('aca:v5:wrap_sheets_v4', JSON.stringify(updatedRegistry));
      
      alert("Sheet Synchronized with Studio Registry.");
      navigate('/author-builder');
    } catch (e) {
      alert("Sovereign Link Error: Data block corrupted during restore.");
    }
  };

  const deleteBookFromVault = async (id: string) => {
    if (!window.confirm("ERASE MASTER FROM REGISTRY?")) return;
    const openVaultRequest = indexedDB.open(VAULT_NAME, VAULT_VERSION);
    openVaultRequest.onsuccess = () => {
      const db = openVaultRequest.result;
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      store.delete(id);
      tx.oncomplete = () => loadVaultBooks();
    };
  };

  const deleteFromVault = (folder: string, id: string) => {
    if (!window.confirm("PERMANENTLY ERASE ARCHIVE?")) return;
    const newVault = { ...vault };
    if (folder === 'sheets') newVault.sheets = newVault.sheets.filter(s => s.id !== id);
    if (folder === 'ai') newVault.ai = newVault.ai.filter(a => a.id !== id);
    if (folder === 'audits') newVault.audits = newVault.audits.filter(a => a.id !== id);
    setVault(newVault);
    localStorage.setItem('aca_sovereign_vault', JSON.stringify(newVault));
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 pt-24 font-sans selection:bg-orange-500/30 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>

      <section className="max-w-7xl mx-auto px-6 py-12 border-b border-white/5 relative z-10 flex flex-col md:flex-row justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-6">
             <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
             <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black block animate-living-amber glow-orange">Sovereign Vault Protocol</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none mb-6 uppercase">THE BIG <span className="text-orange-500 animate-living-amber">HOUSE.</span></h1>
        </div>
        <button onClick={fullFactoryReset} className="mb-6 bg-red-900/10 border border-red-900 text-red-900 px-6 py-3 text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all rounded-sm">Purge All Registry Data</button>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 relative z-10">
        <aside className="w-full md:w-80 space-y-3 shrink-0">
          <button onClick={() => setActiveFolder('sheets')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'sheets' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Block A</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">The Sheets</span></div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.sheets.length}</span>
          </button>
          <button onClick={() => setActiveFolder('books')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'books' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Block B</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">The Bookshelf</span></div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.books?.length || 0}</span>
          </button>
          <button onClick={() => setActiveFolder('technical')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'technical' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Block C</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">Technical Brief</span></div>
          </button>
          <button onClick={() => setActiveFolder('metrics')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'metrics' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Audit</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">Efficiency</span></div>
          </button>
        </aside>

        <main className="flex-grow">
          {activeFolder === 'sheets' && (
            <div className="grid gap-6 animate-fade-in">
              {vault.sheets.length === 0 && <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">Registry Empty.</div>}
              {vault.sheets.map((s) => (
                <div key={s.id} className="p-12 bg-[#0d0d0d] border border-white/5 hover:border-orange-500/20 transition-all flex items-center justify-between group rounded-sm shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/20 group-hover:bg-orange-500 transition-colors"></div>
                  <div className="space-y-4">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Archive ID: {s.id}</p>
                    <h3 className="text-4xl font-serif italic text-white group-hover:text-orange-500 transition-colors tracking-tighter">{s.data.title || "Untitled Fragment"}</h3>
                  </div>
                  <div className="flex items-center gap-8">
                    <button onClick={() => restoreSheet(s)} className="px-10 py-5 animate-living-amber-bg text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl rounded-sm">Restore to Studio</button>
                    <button onClick={() => deleteFromVault('sheets', s.id)} className="text-gray-800 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'books' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              {(vault.books || []).length === 0 && <div className="col-span-full p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">No registered masters.</div>}
              {(vault.books || []).map((book) => (
                <div key={book.id} className="bg-[#0d0d0d] border border-white/5 p-8 flex flex-col group relative rounded-sm hover:border-orange-500/30 transition-all duration-500 shadow-2xl">
                  <div className="aspect-[16/27] bg-black border border-white/10 mb-6 overflow-hidden rounded-sm p-2 flex items-center justify-center">
                    <img src={book.coverUrl} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700" alt={book.title} />
                  </div>
                  <h3 className="text-2xl font-serif italic mb-2 text-white group-hover:text-orange-500 transition-colors">{book.title}</h3>
                  <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                    <button onClick={() => deleteBookFromVault(book.id)} className="text-red-900 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-all">Erase Master</button>
                    <Link to={`/book/${book.slug}`} className="text-orange-500 text-[9px] font-black uppercase tracking-widest hover:underline">View →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'technical' && (
            <div className="animate-fade-in space-y-12">
               <div className="bg-[#0a0a0a] border border-blue-500/20 p-12 rounded-sm shadow-2xl">
                  <h3 className="text-3xl font-serif italic text-white mb-6 underline decoration-blue-500/30 underline-offset-8">Server Briefing.</h3>
                  <div className="grid md:grid-cols-2 gap-8 text-[11px] font-mono leading-relaxed text-gray-400">
                     <div className="space-y-4">
                        <p><span className="text-blue-500 font-black">SMTP:</span> server387.web-hosting.com</p>
                        <p><span className="text-blue-500 font-black">PORT:</span> 465 (SSL/TLS)</p>
                        <p><span className="text-blue-500 font-black">USER:</span> mark@acaptiveaudience.net</p>
                     </div>
                     <div className="space-y-4">
                        <p><span className="text-blue-500 font-black">IMAP:</span> server387.web-hosting.com</p>
                        <p><span className="text-blue-500 font-black">PORT:</span> 993 (SSL/TLS)</p>
                        <p><span className="text-blue-500 font-black">AUTH:</span> Required (Password-based)</p>
                     </div>
                  </div>
               </div>

               <div className="bg-red-900/5 border border-red-900/20 p-12 rounded-sm space-y-6">
                  <h4 className="text-red-500 text-[10px] font-black uppercase tracking-widest">Acoustic Link: Google Bounce Fix</h4>
                  <p className="text-gray-500 text-sm italic font-light leading-relaxed">
                    If your mail bounces from Gmail, you MUST add these records in your hosting cPanel (Zone Editor):
                  </p>
                  <ul className="space-y-4 text-[10px] font-mono text-gray-400">
                    <li className="flex items-start gap-4"><span className="text-white">SPF:</span> v=spf1 +a +mx +ip4:198.54.115.158 ~all</li>
                    <li className="flex items-start gap-4"><span className="text-white">DKIM:</span> (Generated via cPanel > Email Deliverability)</li>
                    <li className="flex items-start gap-4"><span className="text-white">DMARC:</span> v=DMARC1; p=none;</li>
                  </ul>
                  <p className="text-[8px] text-gray-700 uppercase font-black tracking-widest mt-6">Reference ID: RFC-7208 / SPF-REGISTRY</p>
               </div>
            </div>
          )}

          {activeFolder === 'metrics' && (
            !isMetricsAuthorized ? (
              <div className="h-full flex flex-col items-center justify-center p-20 animate-fade-in">
                 <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 p-12 text-center rounded-sm shadow-2xl">
                    <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter mb-8">System Auth</h3>
                    <form onSubmit={handleMetricsAccess} className="space-y-6">
                       <input type="password" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} placeholder="ENTER KEY" className={`w-full bg-black border ${authError ? 'border-red-500 animate-shake' : 'border-white/10'} p-5 text-center text-xs font-mono tracking-[0.5em] text-white focus:border-green-500 outline-none rounded-sm`} />
                       <button type="submit" className="w-full bg-white text-black py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-green-500 hover:text-white transition-all rounded-sm">Validate</button>
                    </form>
                 </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-12">
                 <div className="bg-[#0d0d0d] border border-green-500/20 p-12 rounded-sm shadow-2xl">
                    <p className="text-green-500 text-[9px] font-black uppercase tracking-[0.5em] mb-3">Resource Runway</p>
                    <h3 className="text-6xl font-serif italic text-white tracking-tighter">{remainingResource.toFixed(2)} LOAD UNITS</h3>
                 </div>
              </div>
            )
          )}
        </main>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SovereignVault;
