
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const WrapperInfo: React.FC = () => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('aca_author_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Architect',
      dialectLevel: 'Balanced',
      feedbackStyle: 'Direct',
      motivation: 'Personal Legacy',
      customContext: '',
      showTooltips: true
    };
  });

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const saveProfile = () => {
    localStorage.setItem('aca_author_profile', JSON.stringify(profile));
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
    <div className="bg-[#050505] min-h-screen text-white pb-32 font-sans selection:bg-accent/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full flex items-center justify-center">
          <svg viewBox="0 0 800 1000" className="w-full h-full opacity-[0.07]">
            <path 
              id="paper-path"
              className="paper-anim"
              d="M100,100 L700,100 L700,900 L100,900 Z" 
              fill="none" 
              stroke="#e67e22" 
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
        <Link to="/author-builder" className="text-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-12 block hover:underline transition-all">← Return to Studio</Link>
        <h1 className="text-7xl md:text-9xl font-serif font-black italic text-white mb-6 tracking-tighter leading-none">WRAP.</h1>
        <p className="text-2xl md:text-3xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"The digital bridge for system-impacted truth. Your Write Right AI Partner."</p>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 space-y-32">
        {/* Intelligence Training */}
        <div className="bg-[#0a0a0a] border border-white/10 p-12 lg:p-24 rounded-sm shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group/train">
          <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-[15rem] font-serif italic select-none group-hover/train:opacity-[0.07] transition-opacity duration-1000">WRAP</div>
          
          <div className="relative z-10">
            <h2 className="text-white text-4xl font-serif italic mb-4">Studio Intelligence <span className="text-accent">Training.</span></h2>
            <p className="text-gray-500 text-base italic mb-16 max-w-xl">Calibrate WRAP to match your specific voice. This profile is locked into your private workspace to guide the AI's assistance.</p>

            <div className="grid gap-16">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Identity / Workspace Name</label>
                <input 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-transparent border-b border-white/10 pb-6 text-3xl font-serif outline-none focus:border-accent text-white transition-all placeholder:text-gray-900" 
                  placeholder="e.g. Mark Mi Words" 
                />
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Slang & Dialect Level</label>
                  <select 
                    value={profile.dialectLevel} 
                    onChange={e => setProfile({...profile, dialectLevel: e.target.value})}
                    className="w-full bg-black border border-white/10 p-5 text-[11px] font-bold tracking-widest outline-none focus:border-accent text-gray-400 uppercase cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <option>Standard English Only</option>
                    <option>Balanced (Light Context)</option>
                    <option>Authentic (Street Dialect)</option>
                    <option>Raw (Heavy Vernacular)</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Interface Guidance</label>
                  <button 
                    onClick={() => setProfile({...profile, showTooltips: !profile.showTooltips})}
                    className={`w-full border p-5 text-[11px] font-black tracking-widest uppercase transition-all flex items-center justify-between ${profile.showTooltips ? 'border-orange-500/50 bg-orange-500/5 text-orange-500' : 'border-white/10 text-gray-600'}`}
                  >
                    {profile.showTooltips ? 'Tooltips Active' : 'Tooltips Hidden'}
                    <div className={`w-2 h-2 rounded-full ${profile.showTooltips ? 'bg-orange-500 animate-pulse' : 'bg-gray-800'}`}></div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">The Core Mission</label>
                <textarea 
                  value={profile.customContext}
                  onChange={e => setProfile({...profile, customContext: e.target.value})}
                  className="w-full bg-black border border-white/10 p-8 text-lg font-serif italic leading-relaxed outline-none focus:border-accent text-white h-48 rounded-sm shadow-inner" 
                  placeholder="Describe the 'main truth' you want this WRAP partner to protect and refine..."
                />
              </div>

              <button 
                onClick={saveProfile}
                className="group relative bg-accent text-white py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-orange-600 transition-all rounded-sm overflow-hidden"
              >
                <span className="relative z-10">Update Studio Intelligence</span>
                <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Email Signature Tool */}
        <div className="bg-[#050505] border border-white/5 p-12 lg:p-20 relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <span className="text-orange-500 text-[9px] font-black uppercase tracking-[0.5em]">Branding Assets</span>
              <h2 className="text-3xl font-serif italic">Dispatch <span className="text-orange-500">Signatures.</span></h2>
              <p className="text-gray-500 text-sm italic font-light max-w-xl">Use this monospace signature for your external emails to editors, care organizations, or legal teams.</p>
            </div>
            
            <div className="bg-black border border-white/10 p-8 rounded-sm font-mono text-[10px] text-gray-400 leading-relaxed shadow-inner group relative">
               <div className="absolute top-4 right-4 text-[8px] font-bold text-gray-800 uppercase tracking-widest italic group-hover:text-orange-500 transition-colors">Digital Stationery</div>
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
          <Link to="/author-builder" className="inline-block bg-white text-black px-20 py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-accent hover:text-white transition-all transform hover:-translate-y-2 rounded-sm">Return to Studio</Link>
        </div>
      </section>

      {showSavedToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-accent text-white px-12 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(230,126,34,0.5)] animate-toast-up z-[100] border border-white/20">
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
