
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VaultStorage, VaultSheet, Book } from '../types';
import { listVault, purgeVault } from '../services/vault';

const SovereignVault: React.FC = () => {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<'sheets' | 'books' | 'metrics' | 'audits' | 'stationery'>('sheets');
  const [isMetricsAuthorized, setIsMetricsAuthorized] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState(false);
  
  const [vault, setVault] = useState<VaultStorage>(() => {
    const saved = localStorage.getItem('aca_sovereign_vault');
    return saved ? JSON.parse(saved) : { sheets: [], books: [], ai: [], audits: [], efficiencyLogs: [] };
  });

  useEffect(() => {
    const loadVaultBooks = async () => {
      try {
        const books = await listVault();
        setVault(prev => ({ ...prev, books }));
      } catch (e) {
        console.error("Vault book list fail:", e);
      }
    };
    loadVaultBooks();
  }, []);

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

  const handlePurge = async () => {
    if (window.confirm("PERMANENT ACTION: Wipe all Sovereign data including IndexedDB Masters?")) {
      await purgeVault();
      alert("Purge complete. Reloading...");
      window.location.href = "/";
    }
  };

  const restoreSheet = (sheet: VaultSheet) => {
    const currentSheets = JSON.parse(localStorage.getItem('wrap_sheets_v4') || '[]');
    const restoredSheet = { ...sheet.data, id: `restored-${Date.now()}` };
    localStorage.setItem('wrap_sheets_v4', JSON.stringify([...currentSheets, restoredSheet]));
    alert("Restored to active registry.");
    navigate('/author-builder');
  };

  const deleteLocalVaultItem = (folder: string, id: string) => {
    if (!window.confirm("Permanently erase this archive?")) return;
    const newVault = { ...vault };
    if (folder === 'sheets') newVault.sheets = newVault.sheets.filter(s => s.id !== id);
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
          <p className="text-xl text-gray-500 italic font-light max-w-3xl leading-relaxed">"Industrial Master Vault V5.0 — High-Capacity Atomic Storage."</p>
        </div>
        <button onClick={handlePurge} className="mb-6 bg-red-900/10 border border-red-900 text-red-900 px-6 py-3 text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all rounded-sm">Factory Purge</button>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 relative z-10">
        <aside className="w-full md:w-80 space-y-3 shrink-0">
          <button onClick={() => setActiveFolder('sheets')} className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'sheets' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <div className="text-left"><p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Block A</p><span className="text-[11px] font-black uppercase tracking-[0.2em]">The Sheets</span></div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.sheets.length}</span>
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
                    <button onClick={() => deleteLocalVaultItem('sheets', s.id)} className="text-gray-800 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'metrics' && (
            <div className="animate-fade-in space-y-12">
               {!isMetricsAuthorized ? (
                 <div className="h-full flex flex-col items-center justify-center p-20">
                    <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 p-12 text-center rounded-sm">
                       <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter mb-8">Efficiency Auth</h3>
                       <form onSubmit={handleMetricsAccess} className="space-y-6">
                          <input type="password" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} placeholder="ENTER SOVEREIGN KEY" className={`w-full bg-black border ${authError ? 'border-red-500 animate-shake' : 'border-white/10'} p-5 text-center text-xs font-mono tracking-[0.5em] text-white focus:border-green-500 outline-none rounded-sm`} />
                          <button type="submit" className="w-full bg-white text-black py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-green-500 hover:text-white transition-all rounded-sm">Validate</button>
                       </form>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-12">
                    <div className="bg-[#0d0d0d] border border-green-500/20 p-12 rounded-sm shadow-2xl">
                       <p className="text-green-500 text-[9px] font-black uppercase tracking-[0.5em] mb-3">Mastering Status</p>
                       <h3 className="text-6xl font-serif italic text-white tracking-tighter">ALL SYSTEMS GO</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                       <div className="bg-[#0d0d0d] border border-white/5 p-12 rounded-sm"><p className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-4">Books</p><h4 className="text-5xl font-serif italic text-white">{vault.books?.length || 0}</h4></div>
                    </div>
                 </div>
               )}
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
      `}</style>
    </div>
  );
};

export default SovereignVault;
