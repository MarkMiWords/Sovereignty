
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { VaultStorage, VaultSheet, VaultAI, Book, VaultAudit, EfficiencyLog } from '../types';

// --- Sovereign Vault Core V4 ---
const VAULT_NAME = 'aca_sovereign_registry';
const VAULT_VERSION = 4;

const SovereignVault: React.FC = () => {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<'sheets' | 'books' | 'ai' | 'inbound' | 'stationery' | 'audits' | 'metrics'>('sheets');
  const [isMetricsAuthorized, setIsMetricsAuthorized] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState(false);
  
  const [vault, setVault] = useState<VaultStorage>(() => {
    const saved = localStorage.getItem('aca_sovereign_vault');
    return saved ? JSON.parse(saved) : { sheets: [], books: [], ai: [], audits: [], efficiencyLogs: [] };
  });

  const efficiencyLogs = vault.efficiencyLogs || [];
  const totalTokens = efficiencyLogs.reduce((acc, log) => acc + log.metrics.estimatedTokens, 0);
  const totalHoursSaved = efficiencyLogs.reduce((acc, log) => acc + log.metrics.humanHoursSaved, 0);
  const totalResourceLoad = efficiencyLogs.reduce((acc, log) => acc + (log.metrics.simulatedResourceLoad || log.metrics.wholesaleCostEstimate || 0), 0);

  const RESOURCE_CAPACITY = 100.00;
  const remainingResource = RESOURCE_CAPACITY - totalResourceLoad;
  const loadUsagePercent = (totalResourceLoad / RESOURCE_CAPACITY) * 100;

  useEffect(() => {
    loadVaultBooks();
  }, []);

  const loadVaultBooks = () => {
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
    if (window.confirm("PERMANENT ACTION: Wipe all Sovereign Registry data, IndexedDB Masters, and Local Storage? This cannot be undone.")) {
      localStorage.clear();
      const request = indexedDB.deleteDatabase(VAULT_NAME);
      request.onsuccess = () => {
        alert("System purged. Redirecting...");
        window.location.href = "/";
      };
    }
  };

  const restoreSheet = (sheet: VaultSheet) => {
    const currentSheets = JSON.parse(localStorage.getItem('wrap_sheets_v4') || '[]');
    const restoredSheet = { ...sheet.data, id: `restored-${Date.now()}` };
    localStorage.setItem('wrap_sheets_v4', JSON.stringify([...currentSheets, restoredSheet]));
    alert("Restored to active registry.");
    navigate('/author-builder');
  };

  const deleteBookFromVault = async (id: string) => {
    if (!window.confirm("PERMANENT: Erase this Master from the Sovereign Registry?")) return;
    const openVaultRequest = indexedDB.open(VAULT_NAME, VAULT_VERSION);
    openVaultRequest.onsuccess = () => {
      const db = openVaultRequest.result;
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      store.delete(id);
      tx.oncomplete = () => {
        loadVaultBooks();
      };
    };
  };

  const deleteFromVault = (folder: string, id: string) => {
    if (!window.confirm("Permanently erase this archive?")) return;
    const newVault = { ...vault };
    if (folder === 'sheets') newVault.sheets = newVault.sheets.filter(s => s.id !== id);
    if (folder === 'ai') newVault.ai = newVault.ai.filter(a => a.id !== id);
    if (folder === 'audits') newVault.audits = newVault.audits.filter(a => a.id !== id);
    setVault(newVault);
    localStorage.setItem('aca_sovereign_vault', JSON.stringify(newVault));
  };

  const StationeryItem = ({ title, type, desc, icon }: { title: string, type: string, desc: string, icon: string }) => (
    <div className="bg-[#0d0d0d] border border-white/5 p-10 rounded-sm relative group hover:border-orange-500/20 transition-all">
       <div className="text-4xl mb-6">{icon}</div>
       <div className="space-y-4">
          <div>
            <p className="text-orange-500 text-[8px] font-black uppercase tracking-widest mb-1">{type}</p>
            <h3 className="text-2xl font-serif italic text-white group-hover:text-orange-500 transition-colors">{title}</h3>
          </div>
          <p className="text-sm text-gray-500 font-light italic leading-relaxed">{desc}</p>
       </div>
    </div>
  );

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
          <p className="text-xl text-gray-500 italic font-light max-w-3xl leading-relaxed">"Unified Master Vault V4.0 — Persistent Linkage Active."</p>
        </div>
        <button onClick={fullFactoryReset} className="mb-6 bg-red-900/10 border border-red-900 text-red-900 px-6 py-3 text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all rounded-sm">System Factory Reset</button>
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
          
          <button onClick={() => setActiveFolder('metrics')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'metrics' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Audit</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">Efficiency</span></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          </button>

          <button onClick={() => setActiveFolder('audits')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'audits' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Block C</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">Audits</span></div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.audits?.length || 0}</span>
          </button>

          <button onClick={() => setActiveFolder('stationery')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'stationery' ? 'bg-white/5 border-white text-white' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Visuals</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">Stationery</span></div>
          </button>
        </aside>

        <main className="flex-grow">
          {activeFolder === 'sheets' && (
            <div className="grid gap-6 animate-fade-in">
              {vault.sheets.length === 0 && <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">No archived sheets.</div>}
              {vault.sheets.map((s) => (
                <div key={s.id} className="p-12 bg-[#0d0d0d] border border-white/5 hover:border-orange-500/20 transition-all flex items-center justify-between group rounded-sm shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/20 group-hover:bg-orange-500 transition-colors"></div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4"><span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Logged: {new Date(s.timestamp).toLocaleDateString()}</span></div>
                    <h3 className="text-4xl font-serif italic text-white group-hover:text-orange-500 transition-colors tracking-tighter">{s.data.title || "Untitled"}</h3>
                  </div>
                  <div className="flex items-center gap-8">
                    <button onClick={() => restoreSheet(s)} className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl rounded-sm">Restore</button>
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
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-8">{book.author} • {book.releaseYear}</p>
                  <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                    <button onClick={() => deleteBookFromVault(book.id)} className="text-red-900 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-all">Erase Master</button>
                    <Link to={`/book/${book.slug}`} className="text-orange-500 text-[9px] font-black uppercase tracking-widest hover:underline">View in Storefront →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'metrics' && (
            !isMetricsAuthorized ? (
              <div className="h-full flex flex-col items-center justify-center p-20 animate-fade-in">
                 <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 p-12 text-center rounded-sm shadow-2xl">
                    <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter mb-8">Efficiency Auth</h3>
                    <form onSubmit={handleMetricsAccess} className="space-y-6">
                       <input type="password" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} placeholder="ENTER SOVEREIGN KEY" className={`w-full bg-black border ${authError ? 'border-red-500 animate-shake' : 'border-white/10'} p-5 text-center text-xs font-mono tracking-[0.5em] text-white focus:border-green-500 outline-none rounded-sm`} />
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
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-[#0d0d0d] border border-white/5 p-12 rounded-sm"><p className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-4">Saved</p><h4 className="text-5xl font-serif italic text-white">{totalHoursSaved.toFixed(1)}h</h4></div>
                    <div className="bg-[#0d0d0d] border border-white/5 p-12 rounded-sm"><p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-4">Tokens</p><h4 className="text-5xl font-serif italic text-white">{(totalTokens / 1000).toFixed(2)}k</h4></div>
                    <div className="bg-[#0d0d0d] border border-white/5 p-12 rounded-sm"><p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-4">Resource</p><h4 className="text-5xl font-serif italic text-white">{totalResourceLoad.toFixed(3)}</h4></div>
                 </div>
                 <div className="bg-black/40 border border-white/5 rounded-sm p-8 overflow-x-auto">
                    <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest">
                       <thead>
                          <tr className="text-gray-600 border-b border-white/5">
                             <th className="pb-4">Timestamp</th>
                             <th className="pb-4">Action</th>
                             <th className="pb-4">Tokens</th>
                             <th className="pb-4">Load</th>
                          </tr>
                       </thead>
                       <tbody className="text-gray-400">
                          {efficiencyLogs.map((log) => (
                             <tr key={log.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                <td className="py-3">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                <td className="py-3">{log.action}</td>
                                <td className="py-3">{log.metrics.estimatedTokens}</td>
                                <td className="py-3">{(log.metrics.simulatedResourceLoad || log.metrics.wholesaleCostEstimate || 0).toFixed(4)}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )
          )}

          {activeFolder === 'audits' && (
            <div className="grid gap-6 animate-fade-in">
              {(vault.audits || []).length === 0 && <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">No archived audits.</div>}
              {(vault.audits || []).map((audit) => (
                <div key={audit.id} className="p-10 bg-[#0d0d0d] border border-white/5 hover:border-orange-500/20 transition-all flex flex-col gap-6 rounded-sm shadow-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-orange-500 text-[9px] font-black uppercase tracking-widest border border-orange-500/20 px-3 py-1 mb-3 inline-block">{audit.goal} audit</span>
                      <h3 className="text-3xl font-serif italic text-white tracking-tight">{audit.report.suggestedTitle}</h3>
                    </div>
                    <button onClick={() => deleteFromVault('audits', audit.id)} className="text-gray-800 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                     <div>
                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2">Refinement Summary</p>
                        <p className="text-sm text-gray-400 font-serif italic leading-relaxed">"{audit.report.summary.substring(0, 150)}..."</p>
                     </div>
                     <div className="flex flex-col justify-end items-end gap-2">
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Marketability: {audit.report.marketabilityScore}%</div>
                        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${audit.report.marketabilityScore}%` }}></div></div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'stationery' && (
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
              <StationeryItem title="Sovereign Slate V1" type="Hardware Prototype" desc="Low-power, zero-surveillance hardware concept." icon="📱" />
              <StationeryItem title="Courier Code Block" type="Layout" desc="Industrial footer for documentation." icon="📟" />
            </div>
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
