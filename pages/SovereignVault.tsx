
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { VaultStorage, VaultSheet, Book } from '../types';
import { readJson, writeJson } from '../utils/safeStorage';
import { checkSystemHeartbeat } from '../services/geminiService';

const VAULT_NAME = 'aca_sovereign_registry';
const VAULT_VERSION = 4;

const SovereignVault: React.FC = () => {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<'sheets' | 'books' | 'technical' | 'heartbeat'>('sheets');
  const [heartbeat, setHeartbeat] = useState<{ status: 'loading' | 'online' | 'offline' | 'error', message: string }>({ status: 'loading', message: 'Checking Sovereignty...' });
  
  const [vault, setVault] = useState<VaultStorage>(() => {
    return readJson<VaultStorage>('sovereign_vault', { sheets: [], books: [], ai: [], audits: [] });
  });

  useEffect(() => {
    loadVaultBooks();
    refreshHeartbeat();
  }, []);

  const refreshHeartbeat = async () => {
    setHeartbeat({ status: 'loading', message: 'Checking Sovereignty...' });
    const result = await checkSystemHeartbeat();
    setHeartbeat(result);
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
            setVault(prev => ({ ...prev, books: request.result }));
          };
        }
      };
    } catch (e) {}
  };

  const restoreSheet = (sheet: VaultSheet) => {
    try {
      const currentSheets = readJson<any[]>('wrap_sheets_v4', []);
      const updatedRegistry = [{ ...sheet.data, id: `restored-${Date.now()}` }, ...currentSheets];
      writeJson('wrap_sheets_v4', updatedRegistry);
      alert("Restored to Studio.");
      navigate('/author-builder');
    } catch (e) {
      alert("Error: Data corrupted.");
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 pt-24 font-sans relative">
      <section className="max-w-7xl mx-auto px-6 py-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
             <span className="text-orange-500 tracking-[0.5em] uppercase text-[10px] font-black">Sovereign Vault</span>
          </div>
          <h1 className="text-7xl font-serif font-black italic text-white tracking-tighter uppercase">THE BIG <span className="text-orange-500">HOUSE.</span></h1>
        </div>
        <div className="pb-4 flex items-center gap-4">
           <div className={`w-3 h-3 rounded-full ${heartbeat.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : heartbeat.status === 'loading' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Engine Heartbeat: {heartbeat.status.toUpperCase()}</span>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 space-y-2 shrink-0">
          <button onClick={() => setActiveFolder('sheets')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'sheets' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">The Sheets</span>
          </button>
          <button onClick={() => setActiveFolder('books')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'books' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">The Bookshelf</span>
          </button>
          <button onClick={() => setActiveFolder('technical')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'technical' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Technical Brief</span>
          </button>
          <button onClick={() => setActiveFolder('heartbeat')} className={`w-full text-left p-6 transition-all border-l-2 ${activeFolder === 'heartbeat' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-black border-white/5 border-l-transparent text-gray-700'}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">System Heartbeat</span>
          </button>
        </aside>

        <main className="flex-grow">
          {activeFolder === 'sheets' && (
            <div className="grid gap-4 animate-fade-in">
              {vault.sheets.length === 0 && <div className="p-20 text-center border border-dashed border-white/5 italic text-gray-800 font-serif">Registry Empty.</div>}
              {vault.sheets.map((s) => (
                <div key={s.id} className="p-8 bg-[#0d0d0d] border border-white/5 flex items-center justify-between group rounded-sm">
                  <h3 className="text-2xl font-serif italic text-white tracking-tighter">{s.data.title || "Untitled Fragment"}</h3>
                  <button onClick={() => restoreSheet(s)} className="px-6 py-3 border border-orange-500 text-orange-500 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all">Restore</button>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'books' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              {(vault.books || []).length === 0 && <div className="col-span-full p-20 text-center border border-dashed border-white/5 italic text-gray-800 font-serif">No registered masters.</div>}
              {(vault.books || []).map((book) => (
                <div key={book.id} className="bg-[#0d0d0d] border border-white/5 p-6 rounded-sm">
                  <img src={book.coverUrl} className="w-full h-auto mb-4 grayscale" alt={book.title} />
                  <h3 className="text-xl font-serif italic text-white">{book.title}</h3>
                </div>
              ))}
            </div>
          )}

          {activeFolder === 'technical' && (
            <div className="space-y-8 animate-fade-in">
               <div className="bg-[#0a0a0a] border border-blue-500/20 p-10 rounded-sm shadow-2xl">
                  <h3 className="text-2xl font-serif italic text-white mb-4">Email Setup Manifest</h3>
                  
                  <div className="bg-red-500/10 border border-red-500/30 p-6 mb-8 rounded-sm">
                     <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                       <span className="animate-pulse">⚠</span> CRITICAL CLEANUP: DELETE OLD RECORDS
                     </p>
                     <p className="text-gray-400 text-xs italic">
                        If you have ANY existing MX records (from Google, Microsoft, or an old host), <strong>DELETE THEM NOW.</strong> You must only have the two Namecheap MX records listed below. Conflicts will cause "Hotmail Bounces."
                     </p>
                  </div>

                  <div className="space-y-6 text-[11px] font-mono leading-relaxed text-gray-400">
                     <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-sm">
                        <p className="text-blue-500 font-black mb-4 tracking-widest uppercase flex items-center gap-2">
                           STEP 1: THE MX MATRIX (CUSTOM MX)
                        </p>
                        <div className="space-y-3 text-gray-400">
                          <p>1. Scroll to <strong>MAIL SETTINGS</strong> in Namecheap.</p>
                          <p>2. Select <strong>CUSTOM MX</strong>.</p>
                          <div className="mt-4 bg-black p-4 border border-white/5 space-y-2">
                            <p className="text-white">Host: <span className="text-blue-500">@</span> | Value: <span className="text-blue-500">mx1.privateemail.com</span> | Priority: <span className="text-blue-500">10</span></p>
                            <p className="text-white">Host: <span className="text-blue-500">@</span> | Value: <span className="text-blue-500">mx2.privateemail.com</span> | Priority: <span className="text-blue-500">10</span></p>
                          </div>
                        </div>
                     </div>

                     <div className="p-6 bg-black border border-white/5 rounded-sm">
                        <p className="text-blue-500 font-black mb-4 tracking-widest uppercase">
                           STEP 2: TRUST RECORDS (SPF & DMARC)
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-600 mb-1">SPF (Verify Sender):</p>
                            <p className="select-all text-white bg-white/5 p-3 rounded-sm border border-white/10 text-[10px]">v=spf1 include:spf.privateemail.com ~all</p>
                          </div>
                          <div className="pt-4 border-t border-white/5">
                            <p className="text-blue-400 font-black mb-1">DMARC (The Hotmail Fix):</p>
                            <p className="text-[10px] text-gray-500 mb-2 italic">Add a TXT Record with Host "@"</p>
                            <p className="select-all text-white bg-white/5 p-3 rounded-sm border border-white/10 text-[10px]">v=DMARC1; p=quarantine; pct=100;</p>
                          </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeFolder === 'heartbeat' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-[#0a0a0a] border border-green-500/20 p-10 rounded-sm shadow-2xl">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-serif italic text-white">System Heartbeat</h3>
                    <button onClick={refreshHeartbeat} className="text-[9px] font-black uppercase tracking-widest text-green-500 border border-green-500/30 px-6 py-2 hover:bg-green-500 hover:text-white transition-all">Re-Scan Engine</button>
                 </div>

                 <div className="grid gap-6">
                    <div className="p-8 bg-black border border-white/5 rounded-sm flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sovereign Engine Status</p>
                          <p className={`text-xl font-serif italic ${heartbeat.status === 'online' ? 'text-green-500' : heartbeat.status === 'loading' ? 'text-amber-500' : 'text-red-500'}`}>
                             {heartbeat.status === 'online' ? 'Link Established' : heartbeat.status === 'loading' ? 'Syncing...' : 'Link Severed'}
                          </p>
                       </div>
                       <div className={`w-12 h-12 rounded-full border-2 ${heartbeat.status === 'online' ? 'border-green-500/30' : 'border-white/5'} flex items-center justify-center`}>
                          <div className={`w-3 h-3 rounded-full ${heartbeat.status === 'online' ? 'bg-green-500 animate-pulse' : heartbeat.status === 'loading' ? 'bg-amber-500 animate-bounce' : 'bg-red-500'}`}></div>
                       </div>
                    </div>

                    <div className="p-8 bg-black border border-white/10 rounded-sm">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Acoustic Diagnostics</p>
                       <p className="text-sm font-serif italic text-gray-400 leading-relaxed mb-6">"{heartbeat.message}"</p>
                       {heartbeat.status !== 'online' && (
                         <div className="p-6 bg-red-500/5 border border-red-500/20 text-xs text-red-200/80 italic leading-relaxed rounded-sm">
                           If the status is OFFLINE, the "links" to the AI partner will not work. Ensure your API key is properly injected into the environment. 
                         </div>
                       )}
                    </div>

                    <div className="p-8 border border-white/5 bg-white/[0.02] rounded-sm">
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Environmental Parameters</p>
                       <div className="grid grid-cols-2 gap-8 text-[11px] font-mono text-gray-600">
                          <div>
                             <p className="uppercase opacity-50 mb-1">Model Chain</p>
                             <p className="text-white">Gemini 3 Flash (v1.2)</p>
                          </div>
                          <div>
                             <p className="uppercase opacity-50 mb-1">Latent Context</p>
                             <p className="text-white">32,768 Tokens</p>
                          </div>
                       </div>
                    </div>
                 </div>
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
