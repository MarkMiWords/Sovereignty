
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { readJson, writeJson } from '../utils/safeStorage';

const THEMES = [
  { id: 'amber', name: 'Amber (Classic)', color: '#e67e22' },
  { id: 'blue', name: 'Sovereign Blue', color: '#3498db' },
  { id: 'red', name: 'Ruby (Emergency)', color: '#e74c3c' },
  { id: 'emerald', name: 'Emerald (Growth)', color: '#2ecc71' }
];

const FONT_PAIRINGS = [
  { name: 'Classic', desc: 'Serif titles / Serif body.' },
  { name: 'Modern', desc: 'Bold serif / Sans body.' },
  { name: 'Typewriter', desc: 'Monospace industrial.' },
  { name: 'Manuscript', desc: 'Italic flow serif.' },
];

const PERSONALITIES = [
  { level: 0, label: 'Mild', title: 'The Ghost', desc: 'Minimalist & Invisible. Only fixes errors.' },
  { level: 1, label: 'Steady', title: 'The Editor', desc: 'Balanced & Measured. Structured feedback.' },
  { level: 2, label: 'Cheeky', title: 'The Ally', desc: 'Opinionated & Industrial. Uses slang.' },
  { level: 3, label: 'Wild', title: 'The Firebrand', desc: 'Rambunctious & Outrageous. Fiercely helpful.' },
];

const WrapperInfo: React.FC = () => {
  const [profile, setProfile] = useState(() => {
    return readJson<any>('aca_author_profile', {
      name: 'Architect',
      dialectLevel: 'Balanced',
      vocalIntensity: 1,
      feedbackStyle: 'Direct',
      motivation: 'Prison Life',
      region: 'Australia',
      showTooltips: true,
      theme: 'amber',
      fontIndex: 0
    });
  });

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [sigMode, setSigMode] = useState<'visual' | 'monospace'>('visual');
  const visualSigRef = useRef<HTMLDivElement>(null);

  const saveProfile = () => {
    writeJson('aca_author_profile', profile);
    
    // Apply theme globally
    document.documentElement.className = profile.theme !== 'amber' ? `theme-${profile.theme}` : '';
    document.body.className = profile.theme !== 'amber' ? `theme-${profile.theme}` : '';
    
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const copySignature = async () => {
    if (sigMode === 'monospace') {
      const sig = `
--------------------------------------------------
${profile.name.toUpperCase()} // AUTHOR DEPT.
A CAPTIVE AUDIENCE | SOVEREIGN ARCHIVE
--------------------------------------------------
REF: PROTOCOL BETA 4.1
DISPATCH_KEY: AT-SYNC-ACTIVE
URL: ACAPTIVEAUDIENCE.COM
--------------------------------------------------
      `.trim();
      navigator.clipboard.writeText(sig);
    } else {
      if (visualSigRef.current) {
        const range = document.createRange();
        range.selectNode(visualSigRef.current);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        document.execCommand('copy');
        window.getSelection()?.removeAllRanges();
      }
    }
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const currentPersonality = PERSONALITIES[profile.vocalIntensity || 0];

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 font-sans selection:bg-[var(--accent)]/30 overflow-x-hidden pt-24">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(230,126,34,0.03)_0%,transparent_70%)]"></div>
      </div>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <Link to="/author-builder" className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12 block hover:underline transition-all group">
          <span className="group-hover:-translate-x-1 inline-block transition-transform">←</span> Return to Studio
        </Link>
        <h1 className="text-6xl md:text-8xl font-serif font-black italic text-white mb-6 tracking-tighter leading-none uppercase glow-white">WRAP <span className="text-orange-500">Profile.</span></h1>
        <p className="text-xl md:text-2xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"Calibrate your partner's frequency and your workspace aesthetics."</p>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 space-y-24">
        {/* Core Settings Forge */}
        <div className="bg-[#0a0a0a] border border-white/10 p-10 lg:p-20 rounded-sm shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif italic select-none pointer-events-none">FORGE</div>
          
          <div className="relative z-10 space-y-16">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">Identity Registry</label>
              <input 
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full bg-transparent border-b border-white/10 pb-6 text-4xl font-serif italic outline-none focus:border-orange-500 text-white transition-all placeholder:text-gray-900" 
                placeholder="Author Name..." 
              />
            </div>

            {/* Vocal Intensity Slider */}
            <div className="space-y-10 p-10 bg-black border border-white/5 rounded-sm">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                   <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">Vocal Intensity</label>
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentPersonality.title}</span>
                </div>
                <p className="text-[11px] text-gray-500 italic max-w-md">{currentPersonality.desc}</p>
              </div>

              <div className="relative pt-4">
                 <input 
                   type="range" 
                   min="0" 
                   max="3" 
                   step="1"
                   value={profile.vocalIntensity || 0}
                   onChange={e => setProfile({...profile, vocalIntensity: parseInt(e.target.value)})}
                   className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-orange-500"
                 />
                 <div className="flex justify-between mt-6 text-[8px] font-black text-gray-700 uppercase tracking-[0.4em]">
                   <span>Mild</span>
                   <span>Steady</span>
                   <span>Cheeky</span>
                   <span className="text-orange-500 animate-pulse">Firebrand</span>
                 </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
               {/* Themes */}
               <div className="space-y-6">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Chroma Calibration</label>
                  <div className="grid grid-cols-2 gap-4">
                    {THEMES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setProfile({...profile, theme: t.id})}
                        className={`p-6 border transition-all rounded-sm flex flex-col items-center gap-3 ${profile.theme === t.id ? 'border-orange-500 bg-orange-500/5' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <div className="w-6 h-6 rounded-full shadow-xl" style={{ backgroundColor: t.color }}></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{t.name}</span>
                      </button>
                    ))}
                  </div>
               </div>

               {/* Fonts */}
               <div className="space-y-6">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Typography Registry</label>
                  <div className="grid grid-cols-2 gap-4">
                    {FONT_PAIRINGS.map((f, idx) => (
                      <button 
                        key={f.name}
                        onClick={() => setProfile({...profile, fontIndex: idx})}
                        className={`p-6 border transition-all rounded-sm flex flex-col items-center text-center gap-2 ${profile.fontIndex === idx ? 'border-orange-500 bg-orange-500/5' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <span className="text-xl font-serif italic text-white">{f.name}</span>
                        <span className="text-[7px] font-bold uppercase tracking-widest text-gray-600">{f.desc}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <button 
              onClick={saveProfile}
              className="w-full py-8 bg-orange-500 text-white text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-orange-600 transition-all rounded-sm glow-orange"
            >
              Synchronize WRAP Profile
            </button>
          </div>
        </div>

        {/* Signature Forge Tool */}
        <div className="bg-[#050505] border border-white/5 p-10 lg:p-20 rounded-sm relative shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-8xl font-serif italic select-none">SIG</div>
          
          <div className="relative z-10 space-y-12">
            <div className="space-y-2">
              <span className="text-orange-500 text-[9px] font-black uppercase tracking-[0.5em]">Media Assets</span>
              <h2 className="text-3xl font-serif italic">Dispatch <span className="text-orange-500">Signatures.</span></h2>
              <p className="text-gray-500 text-sm italic font-light">One-click assets for your external correspondence.</p>
            </div>

            <div className="flex gap-4 border-b border-white/5 pb-4">
               <button 
                 onClick={() => setSigMode('visual')}
                 className={`text-[9px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${sigMode === 'visual' ? 'text-orange-500 border-orange-500' : 'text-gray-700 border-transparent hover:text-gray-400'}`}
               >
                 Visual Mode
               </button>
               <button 
                 onClick={() => setSigMode('monospace')}
                 className={`text-[9px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${sigMode === 'monospace' ? 'text-orange-500 border-orange-500' : 'text-gray-700 border-transparent hover:text-gray-400'}`}
               >
                 Monospace Mode
               </button>
            </div>
            
            <div className="bg-black border border-white/10 p-12 rounded-sm shadow-inner group relative min-h-[220px] flex items-center justify-center">
               {sigMode === 'monospace' ? (
                 <pre className="font-mono text-[10px] text-gray-400 leading-relaxed whitespace-pre-wrap">
{`--------------------------------------------------
${profile.name.toUpperCase()} // AUTHOR DEPT.
A CAPTIVE AUDIENCE | SOVEREIGN ARCHIVE
--------------------------------------------------
REF: PROTOCOL BETA 4.1
DISPATCH_KEY: AT-SYNC-ACTIVE
URL: ACAPTIVEAUDIENCE.COM
--------------------------------------------------`}
                 </pre>
               ) : (
                 <div 
                   ref={visualSigRef} 
                   className="flex items-center gap-10 text-left py-4"
                   style={{ color: '#ffffff', fontFamily: "'Playfair Display', serif" }}
                 >
                    <div className="w-20 h-20 border-r border-white/10 pr-10 flex items-center">
                       <Logo variant="light" className="w-full h-auto" />
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-2xl font-black italic tracking-tighter" style={{ color: '#ffffff' }}>{profile.name}</h4>
                       <p className="text-[8px] font-bold uppercase tracking-[0.4em]" style={{ color: '#e67e22', fontFamily: "Inter, sans-serif" }}>Author // Sovereign Archive</p>
                       <p className="text-[10px] text-gray-500 font-serif italic" style={{ fontFamily: "serif" }}>www.acaptiveaudience.com</p>
                    </div>
                 </div>
               )}
            </div>

            <button 
              onClick={copySignature}
              className={`w-full py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all border ${copyStatus === 'copied' ? 'bg-green-500 border-green-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
            >
              {copyStatus === 'copied' ? 'Registry Copied' : `Copy ${sigMode === 'visual' ? 'Visual' : 'Monospace'} Signature`}
            </button>
          </div>
        </div>
      </section>

      {showSavedToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(230,126,34,0.4)] animate-toast-up z-[100] border border-white/20">
          Memory Synchronized
        </div>
      )}

      <style>{`
        @keyframes toast-up { from { opacity: 0; transform: translateY(50px) translateX(-50%); } to { opacity: 1; transform: translateY(0) translateX(-50%); } }
        .animate-toast-up { animation: toast-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: #e67e22;
          border: 4px solid black;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(230, 126, 34, 0.5);
        }
      `}</style>
    </div>
  );
};

export default WrapperInfo;
