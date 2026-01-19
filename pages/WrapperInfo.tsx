
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const THEMES = [
  { id: 'amber', name: 'Amber (Classic)', color: '#e67e22' },
  { id: 'blue', name: 'Sovereign Blue', color: '#3498db' },
  { id: 'red', name: 'Ruby (Emergency)', color: '#e74c3c' },
  { id: 'emerald', name: 'Emerald (Growth)', color: '#2ecc71' }
];

const FONT_PAIRINGS = [
  { name: 'Classic', desc: 'Serif titles with classic body text.' },
  { name: 'Modern', desc: 'Bold serif titles with clean sans-serif body.' },
  { name: 'Typewriter', desc: 'Industrial monospace for raw drafts.' },
  { name: 'Manuscript', desc: 'Lightweight italic serif for flow.' },
];

const WrapperInfo: React.FC = () => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('aca_author_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Architect',
      dialectLevel: 'Balanced',
      feedbackStyle: 'Direct',
      motivation: 'Personal Legacy',
      customContext: '',
      showTooltips: true,
      theme: 'amber',
      fontIndex: 0
    };
  });

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const saveProfile = () => {
    localStorage.setItem('aca_author_profile', JSON.stringify(profile));
    
    // Apply theme globally
    document.documentElement.className = profile.theme !== 'amber' ? `theme-${profile.theme}` : '';
    document.body.className = profile.theme !== 'amber' ? `theme-${profile.theme}` : '';
    
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const copySignature = () => {
    const sig = `
--------------------------------------------------
${profile.name.toUpperCase()} // AUTHOR DEPT.
A CAPTIVE AUDIENCE | SOVEREIGN ARCHIVE
--------------------------------------------------
REF: PROTOCOL BETA 4.0
DISPATCH_KEY: AT-SYNC-ACTIVE
URL: ACAPTIVEAUDIENCE.COM
--------------------------------------------------
    `.trim();
    navigator.clipboard.writeText(sig);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 font-sans selection:bg-[var(--accent)]/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full flex items-center justify-center">
          <svg viewBox="0 0 800 1000" className="w-full h-full opacity-[0.07]">
            <path 
              id="paper-path"
              className="paper-anim"
              d="M100,100 L700,100 L700,900 L100,900 Z" 
              fill="none" 
              stroke="var(--accent)" 
              strokeWidth="2"
            />
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 border-b border-white/5">
        <Link to="/author-builder" className="text-[var(--accent)] text-[11px] font-bold uppercase tracking-[0.4em] mb-12 block hover:underline transition-all">← Return to Studio</Link>
        <h1 className="text-7xl md:text-9xl font-serif font-black italic text-white mb-6 tracking-tighter leading-none uppercase">PROFILE.</h1>
        <p className="text-2xl md:text-3xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"Your WRAP Profile is the baseline for your partner. Calibrate it to protect your truth."</p>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 space-y-32">
        <div className="bg-[#0a0a0a] border border-white/10 p-12 lg:p-24 rounded-sm shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group/train">
          <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-[15rem] font-serif italic select-none group-hover/train:opacity-[0.07] transition-opacity duration-1000">WRAP</div>
          
          <div className="relative z-10">
            <h2 className="text-white text-4xl font-serif italic mb-4">Voice <span className="text-[var(--accent)]">Calibration.</span></h2>
            <p className="text-gray-500 text-base italic mb-16 max-w-xl">Training your WRAP Profile ensures that when you 'Scrub' or 'Rinse' your prose, the AI respects your unique dialect and dialogue.</p>

            <div className="grid gap-16">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.4em]">Author Name / Identity</label>
                <input 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-transparent border-b border-white/10 pb-6 text-3xl font-serif outline-none focus:border-[var(--accent)] text-white transition-all placeholder:text-gray-900" 
                  placeholder="e.g. Mark Mi Words" 
                />
              </div>

              {/* Chroma Calibration selector */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Chroma Calibration (Theme)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {THEMES.map(theme => (
                     <button 
                       key={theme.id}
                       onClick={() => setProfile({...profile, theme: theme.id})}
                       className={`p-6 border transition-all rounded-sm flex flex-col items-center gap-3 ${profile.theme === theme.id ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/5 hover:border-white/20'}`}
                     >
                        <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: theme.color }}></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{theme.name}</span>
                     </button>
                   ))}
                </div>
              </div>

              {/* Workspace Typography selector */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Workspace Typography</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {FONT_PAIRINGS.map((font, idx) => (
                     <button 
                       key={font.name}
                       onClick={() => setProfile({...profile, fontIndex: idx})}
                       className={`p-6 border transition-all rounded-sm flex flex-col items-center text-center gap-2 ${profile.fontIndex === idx ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/5 hover:border-white/20'}`}
                     >
                        <span className="text-xl font-serif italic text-white">{font.name}</span>
                        <span className="text-[7px] font-bold uppercase tracking-widest text-gray-600">{font.desc}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Dialect Integrity Level</label>
                  <select 
                    value={profile.dialectLevel} 
                    onChange={e => setProfile({...profile, dialectLevel: e.target.value})}
                    className="w-full bg-black border border-white/10 p-5 text-[11px] font-bold tracking-widest outline-none focus:border-[var(--accent)] text-gray-400 uppercase cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <option>Formal English (Standard)</option>
                    <option>Balanced (Light Slang)</option>
                    <option>Authentic (Street Dialect)</option>
                    <option>Raw (Heavy Vernacular)</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Information Balloons (Tooltips)</label>
                  <button 
                    onClick={() => setProfile({...profile, showTooltips: !profile.showTooltips})}
                    className={`w-full border p-5 text-[11px] font-black tracking-widest uppercase transition-all flex items-center justify-between ${profile.showTooltips ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-white/10 text-gray-600'}`}
                  >
                    {profile.showTooltips ? 'Balloons Active' : 'Balloons Hidden'}
                    <div className={`w-2 h-2 rounded-full ${profile.showTooltips ? 'bg-[var(--accent)] animate-pulse' : 'bg-gray-800'}`}></div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">The 'Don't-Touch' Rule (Core Mission)</label>
                <textarea 
                  value={profile.customContext}
                  onChange={e => setProfile({...profile, customContext: e.target.value})}
                  className="w-full bg-black border border-white/10 p-8 text-lg font-serif italic leading-relaxed outline-none focus:border-[var(--accent)] text-white h-48 rounded-sm shadow-inner" 
                  placeholder="Describe parts of your writing the AI should never change (e.g., specific slang, dialogue style, or raw emotion)..."
                />
              </div>

              <button 
                onClick={saveProfile}
                className="group relative bg-[var(--accent)] text-white py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-orange-600 transition-all rounded-sm overflow-hidden"
              >
                <span className="relative z-10">Synchronize WRAP Profile</span>
                <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Email Signature Tool */}
        <div className="bg-[#050505] border border-white/5 p-12 lg:p-20 relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <span className="text-[var(--accent)] text-[9px] font-black uppercase tracking-[0.5em]">Branding Assets</span>
              <h2 className="text-3xl font-serif italic">Dispatch <span className="text-[var(--accent)]">Signatures.</span></h2>
              <p className="text-gray-500 text-sm italic font-light max-w-xl">Use this monospace signature for your external emails to editors, care organizations, or legal teams.</p>
            </div>
            
            <div className="bg-black border border-white/10 p-8 rounded-sm font-mono text-[10px] text-gray-400 leading-relaxed shadow-inner group relative">
               <div className="absolute top-4 right-4 text-[8px] font-bold text-gray-800 uppercase tracking-widest italic group-hover:text-[var(--accent)] transition-colors">Digital Stationery</div>
               <pre className="whitespace-pre-wrap">
{`--------------------------------------------------
${profile.name.toUpperCase()} // AUTHOR DEPT.
A CAPTIVE AUDIENCE | SOVEREIGN ARCHIVE
--------------------------------------------------
REF: PROTOCOL BETA 4.0
DISPATCH_KEY: AT-SYNC-ACTIVE
URL: ACAPTIVEAUDIENCE.COM
--------------------------------------------------`}
               </pre>
            </div>

            <button 
              onClick={copySignature}
              className={`w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] transition-all border ${copyStatus === 'copied' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/30'}`}
            >
              {copyStatus === 'copied' ? 'Signature Synchronized (Copied)' : 'Copy Dispatch Signature'}
            </button>
          </div>
        </div>

        <div className="pt-24 text-center">
          <Link to="/author-builder" className="inline-block bg-white text-black px-20 py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-[var(--accent)] hover:text-white transition-all transform hover:-translate-y-2 rounded-sm">Return to Studio</Link>
        </div>
      </section>

      {showSavedToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white px-12 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(230,126,34,0.5)] animate-toast-up z-[100] border border-white/20">
          Memory Synchronized
        </div>
      )}

      <style>{`
        @keyframes paper-morph {
          0%, 100% { d: path("M100,100 L700,100 L700,900 L100,900 Z"); }
          50% { d: path("M200,200 C400,100 600,300 750,250 L650,750 C450,850 250,650 150,800 Z"); }
        }
        .paper-anim { animation: paper-morph 20s infinite ease-in-out; }
        @keyframes toast-up { from { opacity: 0; transform: translateY(50px) translateX(-50%); } to { opacity: 1; transform: translateY(0) translateX(-50%); } }
        .animate-toast-up { animation: toast-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default WrapperInfo;
