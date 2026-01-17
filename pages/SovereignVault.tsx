
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VaultStorage, VaultSheet, VaultAI, Book, VaultAudit } from '../types';

const SovereignVault: React.FC = () => {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<'sheets' | 'books' | 'ai' | 'inbound' | 'stationery' | 'audits'>('sheets');
  const [courierInput, setCourierInput] = useState('');
  const [vault, setVault] = useState<VaultStorage>(() => {
    const saved = localStorage.getItem('aca_sovereign_vault');
    return saved ? JSON.parse(saved) : { sheets: [], books: [], ai: [], audits: [] };
  });

  const [showTooltips, setShowTooltips] = useState(() => {
    const profile = localStorage.getItem('aca_author_profile');
    return profile ? JSON.parse(profile).showTooltips !== false : true;
  });

  useEffect(() => {
    const registryBooks = localStorage.getItem('aca_published_books');
    if (registryBooks) {
      const parsedBooks = JSON.parse(registryBooks);
      setVault(prev => ({ ...prev, books: parsedBooks }));
    }
  }, []);

  const restoreSheet = (sheet: VaultSheet) => {
    const currentSheets = JSON.parse(localStorage.getItem('wrap_sheets_v4') || '[]');
    const restoredSheet = { ...sheet.data, id: `restored-${Date.now()}` };
    localStorage.setItem('wrap_sheets_v4', JSON.stringify([...currentSheets, restoredSheet]));
    alert("Material restored from The Big House to your active registry.");
    navigate('/author-builder');
  };

  const claimCourierCode = () => {
    const code = courierInput.trim().toUpperCase();
    if (!code) return;
    const found = vault.sheets.find(s => s.dispatchKey === code);
    if (found) {
      alert(`Success: Manuscript "${found.data.title}" claimed. Restoring to Editor.`);
      restoreSheet(found);
    } else {
      alert("Invalid or expired Courier Code. Please verify the physical manuscript footer.");
    }
  };

  const deleteFromVault = (folder: 'sheets' | 'ai' | 'books' | 'audits', id: string) => {
    if (!window.confirm("Are you sure you want to permanently erase this archive from the Big House?")) return;
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
          <button className="w-full py-4 border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white hover:border-white/30 transition-all">Preview Source Asset</button>
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
          "Your Sovereign Vault. Everything logged in The Big House stays with you, even after you cross the gate. Archives are permanent, immutable, and secured."
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
            onClick={() => setActiveFolder('books')}
            className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'books' ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[inset_15px_0_30px_-15px_rgba(230,126,34,0.2)]' : 'bg-black border-white/5 border-l-transparent text-gray-700 hover:text-gray-400'}`}
          >
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Archive Block B</p>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">The Library</span>
            </div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.books.length}</span>
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
            onClick={() => setActiveFolder('ai')}
            className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'ai' ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[inset_15px_0_30px_-15px_rgba(230,126,34,0.2)]' : 'bg-black border-white/5 border-l-transparent text-gray-700 hover:text-gray-400'}`}
          >
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Intercept Log</p>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">The Wire</span>
            </div>
            <span className="text-[9px] font-bold px-3 py-1 bg-white/5 rounded-sm">{vault.ai.length}</span>
          </button>

          <button 
            onClick={() => setActiveFolder('inbound')}
            className={`w-full flex items-center justify-between p-8 transition-all border-l-4 ${activeFolder === 'inbound' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500 shadow-[inset_15px_0_30px_-15px_rgba(6,182,212,0.2)]' : 'bg-black border-white/5 border-l-transparent text-gray-700 hover:text-gray-400'}`}
          >
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Newspaper Bridge</p>
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Inbound Desk</span>
            </div>
            <span className="text-[11px] font-serif italic text-cyan-500/60">About Time</span>
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
               <p className="text-[10px] font-bold text-gray-600 mb-4 uppercase tracking-widest">Facility Uplink</p>
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div>
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">Sovereign-4.0-Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">Vault: Secured</span>
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
                       <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Ref: {s.id}</span>
                       <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Logged: {new Date(s.timestamp).toLocaleDateString()}</span>
                       {s.dispatchKey && <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest border border-cyan-500/20 px-2">Key: {s.dispatchKey}</span>}
                    </div>
                    <h3 className="text-4xl font-serif italic text-white group-hover:text-orange-500 transition-colors tracking-tighter">{s.data.title || "Untitled Sheet"}</h3>
                    <p className="text-sm text-gray-600 italic font-light max-w-xl">"{s.data.content.substring(0, 100)}..."</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <button 
                      onClick={() => restoreSheet(s)} 
                      className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl rounded-sm"
                    >
                      Restore to Registry
                    </button>
                    <button 
                      onClick={() => deleteFromVault('sheets', s.id)}
                      className="text-gray-800 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'books' && (
            <div className="grid md:grid-cols-2 gap-10 animate-fade-in">
              {vault.books.length === 0 && <div className="col-span-2 p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">"The Library is currently empty."</div>}
              {vault.books.map((b) => (
                <div key={b.id} className="p-10 bg-[#0d0d0d] border border-white/5 flex gap-10 group rounded-sm shadow-xl hover:border-orange-500/20 transition-all">
                  <div className="w-32 h-48 shrink-0 relative">
                    <img src={b.coverUrl} className="w-full h-full object-cover grayscale opacity-30 group-hover:opacity-100 group-hover:grayscale-0 transition-all shadow-2xl border-l-8 border-black rounded-r-sm" alt={b.title} />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <div className="space-y-6 flex flex-col justify-center">
                    <div>
                      <h3 className="text-3xl font-serif italic text-white mb-2 leading-none">{b.title}</h3>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Released Year: {b.releaseYear}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/book/${b.slug}`)} 
                      className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline text-left"
                    >
                      Examine Volume →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'audits' && (
            <div className="grid gap-6 animate-fade-in">
              {(!vault.audits || vault.audits.length === 0) && <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">"No Sovereign Audits logged in Block C."</div>}
              {vault.audits?.map((a) => (
                <div key={a.id} className="p-12 bg-[#0d0d0d] border border-white/5 rounded-sm flex items-center justify-between group shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/40 group-hover:bg-orange-500 transition-colors"></div>
                   <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Report Ref: {a.id}</p>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Audit Date: {new Date(a.timestamp).toLocaleDateString()}</p>
                      <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest border border-cyan-500/20 px-2">Path: {a.goal}</p>
                    </div>
                    <h3 className="text-3xl font-serif italic text-white">{a.report.suggestedTitle}</h3>
                    <div className="flex gap-6">
                       <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Marketability: <span className="text-orange-500">{a.report.marketabilityScore}%</span></div>
                       <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Intensity: <span className="text-cyan-500">{a.report.resourceIntensity}/100</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <button 
                      className="px-10 py-5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all rounded-sm bg-black"
                      onClick={() => alert(`Sovereign Report Detail:\n\nSummary: ${a.report.summary}\n\nLegal: ${a.report.legalSafetyAudit}`)}
                    >
                      Examine Report
                    </button>
                    <button 
                      onClick={() => deleteFromVault('audits', a.id)}
                      className="text-gray-800 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'ai' && (
            <div className="grid gap-6 animate-fade-in">
              {vault.ai.length === 0 && <div className="p-32 text-center border border-dashed border-white/5 italic text-gray-800 font-serif text-3xl opacity-20">"No intercepted dialogue logged."</div>}
              {vault.ai.map((a) => (
                <div key={a.id} className="p-12 bg-[#0d0d0d] border border-white/5 rounded-sm flex items-center justify-between group shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors"></div>
                   <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Freq: Intercept {a.id.split('-')[1]}</p>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Captured: {new Date(a.timestamp).toLocaleDateString()}</p>
                    </div>
                    <h3 className="text-3xl font-serif italic text-white">Re: {a.topic}</h3>
                    <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">{a.history.length} Intercepted Transmission Segments.</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <button 
                      className="px-10 py-5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all rounded-sm bg-black"
                      onClick={() => alert("Transmission logs are review-only. Use the transcript for audit purposes.")}
                    >
                      Open Transcript
                    </button>
                    <button 
                      onClick={() => deleteFromVault('ai', a.id)}
                      className="text-gray-800 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'inbound' && (
            <div className="max-w-2xl mx-auto py-20 animate-fade-in">
               <div className="bg-[#0d0d0d] border border-cyan-500/20 p-12 shadow-2xl rounded-sm text-center">
                  <h3 className="text-3xl font-serif italic text-white mb-6">About Time <span className="text-cyan-500">Inbound Desk.</span></h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-10 italic">
                    "Recover digital manuscripts from physical printouts. Enter the Courier Code below to claim the prose for newspaper review."
                  </p>
                  <div className="space-y-6">
                    <input 
                      value={courierInput}
                      onChange={(e) => setCourierInput(e.target.value.toUpperCase())}
                      placeholder="ENTER COURIER CODE (e.g. AT-XXXX-XXXX)" 
                      className="w-full bg-black border border-white/10 p-6 text-2xl font-mono text-center tracking-[0.2em] text-cyan-400 focus:border-cyan-500 outline-none"
                    />
                    <button 
                      onClick={claimCourierCode}
                      className="w-full bg-cyan-500 text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-cyan-600 transition-all rounded-sm shadow-xl shadow-cyan-500/10"
                    >
                      Verify & Claim Manuscript
                    </button>
                  </div>
               </div>
               
               <div className="mt-12 p-10 border border-white/5 bg-white/[0.01] rounded-sm flex gap-6 items-start opacity-50">
                  <svg className="w-10 h-10 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Instruction</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">
                      The Courier Code serves as a digital link between the approved physical paper and the sovereign archive. This ensures no unvetted content exits the facility while preserving the author's refined digital draft.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {activeFolder === 'stationery' && (
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
              <StationeryItem 
                title="Email Header" 
                type="Asset: PNG-24" 
                desc="The official 1200x400 header for external dispatches. Features the Living Amber glow and Registry Scan texture." 
                icon="🖼️"
              />
              <StationeryItem 
                title="Courier Code Block" 
                type="Layout Component" 
                desc="The industrial footer for physical printouts. Designed to communicate securely with the About Time Inbound Desk." 
                icon="📟"
              />
              <StationeryItem 
                title="Sovereign Seal" 
                type="Vector Overlay" 
                desc="The irregular ink-stamp seal for high-security carceral documentation." 
                icon="⚖️"
              />
              <StationeryItem 
                title="Registry Table" 
                type="HTML Template" 
                desc="Refined formatting for Substack emails, focusing on data-integrity and high-end industrial aesthetics." 
                icon="📋"
              />
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
