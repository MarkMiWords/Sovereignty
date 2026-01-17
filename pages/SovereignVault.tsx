
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VaultStorage, VaultSheet, VaultAI, Book, VaultAudit, EfficiencyLog } from '../types';

const SovereignVault: React.FC = () => {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<'sheets' | 'books' | 'ai' | 'inbound' | 'stationery' | 'audits' | 'metrics'>('sheets');
  const [showHistoryNote, setShowHistoryNote] = useState(false);
  
  // Authorization Gate State
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

  // Simulation Logic
  const RESOURCE_CAPACITY = 100.00;
  const remainingResource = RESOURCE_CAPACITY - totalResourceLoad;
  const loadUsagePercent = (totalResourceLoad / RESOURCE_CAPACITY) * 100;

  useEffect(() => {
    const registryBooks = localStorage.getItem('aca_published_books');
    if (registryBooks) {
      const parsedBooks = JSON.parse(registryBooks);
      setVault(prev => ({ ...prev, books: parsedBooks }));
    }
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

  const restoreSheet = (sheet: VaultSheet) => {
    const currentSheets = JSON.parse(localStorage.getItem('wrap_sheets_v4') || '[]');
    const restoredSheet = { ...sheet.data, id: `restored-${Date.now()}` };
    localStorage.setItem('wrap_sheets_v4', JSON.stringify([...currentSheets, restoredSheet]));
    alert("Material restored from The Big House to your active registry.");
    navigate('/author-builder');
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

      <section className="max-w-7xl mx-auto px-6 py-12 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
           <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black block animate-living-amber glow-orange">Institutional Security Protocol</span>
        </div>
        <h1 className="text-7xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none mb-6 uppercase">THE BIG <span className="text-orange-500 animate-living-amber">HOUSE.</span></h1>
        <p className="text-xl text-gray-500 italic font-light max-w-3xl leading-relaxed">
          "Your Sovereign Vault. Archives are permanent, immutable, and secured using AU-Local data residency architecture."
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 relative z-10">
        <aside className="w-full md:w-80 space-y-3 shrink-0">
          <button 
            onClick={() => setActiveFolder('sheets')}
            className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'sheets' ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[inset_15px_0_30px_-15px_rgba(230,126,34,0.2)]' : 'bg-black border-white/5 border-l-transparent text-gray-700 hover:text-gray-400'}`}
          >
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Archive Block A</p>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">The Sheets</span>
            </div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.sheets.length}</span>
          </button>
          
          <button 
            onClick={() => setActiveFolder('metrics')}
            className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'metrics' ? 'bg-green-500/10 border-green-500 text-green-500 shadow-[inset_15px_0_30px_-15px_rgba(34,197,94,0.1)]' : 'bg-black border-white/5 border-l-transparent text-gray-700 hover:text-gray-400'}`}
          >
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Economic Audit</p>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Efficiency Audit</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          </button>

          <button 
            onClick={() => setActiveFolder('audits')}
            className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'audits' ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[inset_15px_0_30px_-15px_rgba(230,126,34,0.2)]' : 'bg-black border-white/5 border-l-transparent text-gray-700 hover:text-gray-400'}`}
          >
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Archive Block C</p>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sovereign Audits</span>
            </div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.audits?.length || 0}</span>
          </button>

          <button 
            onClick={() => setActiveFolder('stationery')}
            className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'stationery' ? 'bg-white/5 border-white text-white shadow-[inset_15px_0_30px_-15px_rgba(255,255,255,0.1)]' : 'bg-black border-white/5 border-l-transparent text-gray-700 hover:text-gray-400'}`}
          >
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Visual Identity</p>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Stationery</span>
            </div>
            <span className="text-[9px] font-serif italic opacity-30">Branding</span>
          </button>
          
          <div className="pt-12 mt-12 border-t border-white/5 space-y-6">
            <h4 className="text-[9px] font-black text-gray-800 uppercase tracking-widest px-8">System Status</h4>
            <div className="p-8 bg-white/[0.01] border border-white/5 rounded-sm">
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">AU-SYD-RESIDENCY: LIVE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div>
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">IRAP-COMPLIANCE: READY</span>
                  </div>
               </div>
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {activeFolder === 'sheets' && (
            <div className="grid gap-6 animate-fade-in">
              {vault.sheets.length === 0 && <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">"No sheets logged in Block A."</div>}
              {vault.sheets.map((s) => (
                <div key={s.id} className="p-12 bg-[#0d0d0d] border border-white/5 hover:border-orange-500/20 transition-all flex items-center justify-between group rounded-sm shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/20 group-hover:bg-orange-500 transition-colors"></div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Logged: {new Date(s.timestamp).toLocaleDateString()}</span>
                       {s.dispatchKey && <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest border border-cyan-500/20 px-2">Key: {s.dispatchKey}</span>}
                    </div>
                    <h3 className="text-4xl font-serif italic text-white group-hover:text-orange-500 transition-colors tracking-tighter">{s.data.title || "Untitled Sheet"}</h3>
                  </div>
                  <div className="flex items-center gap-8">
                    <button onClick={() => restoreSheet(s)} className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl rounded-sm">Restore to Registry</button>
                    <button onClick={() => deleteFromVault('sheets', s.id)} className="text-gray-800 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'metrics' && (
            !isMetricsAuthorized ? (
              <div className="h-full flex flex-col items-center justify-center p-20 animate-fade-in">
                 <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 p-12 text-center rounded-sm shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                    <div className="mb-8">
                       <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                       <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Efficiency Authorization</h3>
                       <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-2 italic">Institutional resource data secured.</p>
                    </div>
                    <form onSubmit={handleMetricsAccess} className="space-y-6">
                       <div className="relative">
                          <input 
                            type="password" 
                            value={passcodeInput}
                            onChange={(e) => setPasscodeInput(e.target.value)}
                            placeholder="ENTER SOVEREIGN KEY" 
                            className={`w-full bg-black border ${authError ? 'border-red-500 animate-shake' : 'border-white/10'} p-5 text-center text-xs font-mono tracking-[0.5em] text-white focus:border-green-500 outline-none transition-all placeholder:text-gray-800 rounded-sm`}
                          />
                       </div>
                       <button type="submit" className="w-full bg-white text-black py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-green-500 hover:text-white transition-all rounded-sm shadow-xl">Validate Sovereignty</button>
                    </form>
                 </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-12">
                 <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-8">
                    <div>
                      <h2 className="text-4xl font-serif italic text-green-500 uppercase tracking-tighter leading-none mb-2">Efficiency Audit: <span className="text-white">Authorized</span></h2>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Registry Data Flow: ACTIVE</p>
                    </div>
                    <button onClick={() => setIsMetricsAuthorized(false)} className="text-[8px] font-black text-gray-600 uppercase tracking-widest hover:text-white underline underline-offset-4 decoration-gray-800">Terminate Session</button>
                 </div>

                 <div className="bg-[#0d0d0d] border border-green-500/20 p-12 rounded-sm relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5 text-8xl font-serif italic text-green-500 select-none">Resource Load</div>
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                       <div className="space-y-8">
                          <div>
                             <p className="text-green-500 text-[9px] font-black uppercase tracking-[0.5em] mb-3">Sovereign Resource Runway</p>
                             <h3 className="text-6xl font-serif italic text-white tracking-tighter">{remainingResource.toFixed(2)} <span className="text-xl text-gray-600 italic">LOAD UNITS</span></h3>
                          </div>
                          <div className="space-y-3">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Resource Burn Rate</span>
                                <span className="text-green-500">{loadUsagePercent.toFixed(6)}%</span>
                             </div>
                             <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-1000" style={{ width: `${Math.max(0.5, loadUsagePercent)}%` }}></div>
                             </div>
                          </div>
                       </div>
                       <div className="bg-white/5 border border-white/10 p-10 text-center rounded-sm flex flex-col items-center justify-center">
                          <div className="text-white text-3xl mb-3">💎</div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Efficiency Tier</p>
                          <p className="text-[7px] text-green-500 mt-2 uppercase">FLASH-3-OPTIMIZED</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-[#0d0d0d] border border-white/5 p-12 rounded-sm group hover:border-green-500/20 transition-all">
                       <p className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-4">Human-Efficiency Gain</p>
                       <h4 className="text-5xl font-serif italic text-white mb-2">{totalHoursSaved.toFixed(1)} <span className="text-xl text-gray-600">hrs</span></h4>
                       <p className="text-[9px] text-gray-600 italic">"Time saved versus manual carceral transcription."</p>
                    </div>
                    <div className="bg-[#0d0d0d] border border-white/5 p-12 rounded-sm group hover:border-orange-500/20 transition-all">
                       <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-4">Aggregate Token Flow</p>
                       <h4 className="text-5xl font-serif italic text-white mb-2">{(totalTokens / 1000).toFixed(2)}k</h4>
                       <p className="text-[9px] text-gray-600 italic">"Aggregate token volume weight."</p>
                    </div>
                    <div className="bg-[#0d0d0d] border border-white/5 p-12 rounded-sm group hover:border-cyan-500/20 transition-all">
                       <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-4">Simulated Load Units</p>
                       <h4 className="text-5xl font-serif italic text-white mb-2">{totalResourceLoad.toFixed(3)}</h4>
                       <p className="text-[9px] text-gray-600 italic">"Total technical resource load units."</p>
                    </div>
                 </div>
              </div>
            )
          )}

          {activeFolder === 'stationery' && (
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
              <StationeryItem title="Sovereign Slate V1" type="Hardware Prototype" desc="Concept visualization for a low-power, zero-surveillance hardware device designed for carceral literary creation." icon="📱" />
              <StationeryItem title="Courier Code Block" type="Layout Component" desc="The industrial footer for physical printouts. Designed to communicate securely with the About Time Inbound Desk." icon="📟" />
              <StationeryItem title="Sovereign Seal" type="Vector Overlay" desc="The irregular ink-stamp seal for high-security carceral documentation." icon="⚖️" />
              <StationeryItem title="Registry Table" type="HTML Template" desc="Refined formatting for Substack emails, focusing on data-integrity." icon="📋" />
            </div>
          )}

          {activeFolder === 'audits' && (
             <div className="grid gap-6 animate-fade-in">
                {(vault.audits?.length || 0) === 0 && <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">"No Sovereign Audits logged in Block C."</div>}
                {vault.audits?.map((a) => (
                  <div key={a.id} className="p-12 bg-[#0d0d0d] border border-white/5 hover:border-orange-500/20 transition-all group rounded-sm shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors"></div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Logged: {new Date(a.timestamp).toLocaleDateString()}</span>
                         <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest border border-orange-500/20 px-2">Mode: {a.report.suggestedTitle}</span>
                      </div>
                      <h3 className="text-4xl font-serif italic text-white group-hover:text-orange-500 transition-colors tracking-tighter">{a.report.suggestedTitle || "Untitled Audit"}</h3>
                      <p className="text-sm text-gray-500 font-light italic leading-relaxed max-w-2xl">{a.report.summary}</p>
                    </div>
                    <button onClick={() => deleteFromVault('audits', a.id)} className="absolute top-12 right-12 text-gray-800 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                ))}
             </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </div>
  );
};

export default SovereignVault;
