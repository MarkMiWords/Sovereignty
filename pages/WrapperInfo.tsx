
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const WrapperInfo: React.FC = () => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('aca_author_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      dialectLevel: 'Balanced',
      feedbackStyle: 'Direct',
      motivation: 'Personal Legacy',
      customContext: ''
    };
  });

  const [showSavedToast, setShowSavedToast] = useState(false);

  const saveProfile = () => {
    localStorage.setItem('aca_author_profile', JSON.stringify(profile));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 font-sans selection:bg-accent/30 overflow-x-hidden">
      {/* Refined Background Animation: The Living Sheet */}
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
            {/* Decorative Grid for Studio feel */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 border-b border-white/5">
        <Link to="/author-builder" className="text-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-12 block hover:underline transition-all">← Return to Studio</Link>
        <h1 className="text-7xl md:text-9xl font-serif font-bold italic text-white mb-6 tracking-tighter leading-none">
          W.R.A.P.P.E.R.
        </h1>
        <p className="text-2xl text-gray-500 font-light italic leading-relaxed max-w-2xl">
          "The digital bridge for system-impacted truth. Raw words, refined for the world."
        </p>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 space-y-32">
        {/* The Acronym Flow with Bridging Words */}
        <div className="space-y-16">
          <h2 className="text-accent text-[12px] font-black uppercase tracking-[0.5em] mb-8 border-l-2 border-accent pl-4">The Logic</h2>
          <div className="flex flex-col gap-2">
            {[
              { l: 'W', w: 'Writers' },
              { l: 'R', w: 'Reliable' },
              { l: 'A', w: 'Assistant' },
              { bridge: 'for' },
              { l: 'P', w: 'Polishing' },
              { l: 'P', w: 'Passages' },
              { bridge: 'and' },
              { l: 'E', w: 'Editing' },
              { l: 'R', w: 'Rough-drafts' },
            ].map((item, idx) => (
              item.bridge ? (
                <div key={`bridge-${idx}`} className="pl-32 py-1">
                  <span className="text-accent/60 text-2xl font-serif italic tracking-widest">{item.bridge}</span>
                </div>
              ) : (
                <div key={item.l} className="flex items-center gap-12 group">
                  <div className="relative flex items-center justify-center">
                    <span className="text-7xl md:text-9xl font-serif italic text-accent opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 w-24 md:w-32 inline-block leading-none">
                      {item.l}
                    </span>
                  </div>
                  <span className="text-4xl md:text-6xl font-serif italic text-white group-hover:translate-x-6 transition-transform duration-700 ease-out">
                    {item.w}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Global Dialect Engine & Subscription explanation */}
        <div className="grid md:grid-cols-2 gap-16 items-start">
           <div className="space-y-8 p-10 bg-white/[0.01] border border-white/5 rounded-sm hover:border-accent/20 transition-all">
              <h3 className="text-white text-3xl font-serif italic">The Multi-Dialect Ear</h3>
              <p className="text-gray-400 font-light leading-relaxed">
                WRAPPER is switchable. We have tuned its "ear" to the friction of various carceral environments. From Australian prison slang to UK roadman vernacular and US street dialects, it adapts its feedback to protect your authenticity while ensuring readability.
              </p>
           </div>
           <div className="bg-accent/5 border border-accent/20 p-10 rounded-sm">
              <h4 className="text-accent text-[11px] font-black uppercase tracking-widest mb-6">The Sovereign Contribution</h4>
              <p className="text-sm text-gray-400 leading-relaxed italic">
                The $10 monthly subscription funds the industrial token usage required for the Gemini 3 model and maintains your private **Sovereign Vault**. 
              </p>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed font-light italic">
                This enables WRAPPER to develop a long-term "Memory" of your voice—becoming a partner that grows with your narrative, sheet by sheet.
              </p>
           </div>
        </div>

        {/* Training Section */}
        <div className="bg-[#0a0a0a] border border-white/10 p-12 lg:p-24 rounded-sm shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group/train">
          <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-[15rem] font-serif italic select-none group-hover/train:opacity-[0.07] transition-opacity duration-1000">WRAP</div>
          
          <div className="relative z-10">
            <h2 className="text-white text-4xl font-serif italic mb-4">Studio Intelligence <span className="text-accent">Training.</span></h2>
            <p className="text-gray-500 text-base italic mb-16 max-w-xl">
              Calibrate WRAPPER to match your specific voice. This profile is locked into your private workspace to guide the AI's assistance.
            </p>

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
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Feedback Rigor</label>
                  <select 
                    value={profile.feedbackStyle} 
                    onChange={e => setProfile({...profile, feedbackStyle: e.target.value})}
                    className="w-full bg-black border border-white/10 p-5 text-[11px] font-bold tracking-widest outline-none focus:border-accent text-gray-400 uppercase cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <option>Gentle Mentor</option>
                    <option>Technical Editor</option>
                    <option>Brutal Honesty</option>
                    <option>Dialect Check Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">The Core Mission</label>
                <textarea 
                  value={profile.customContext}
                  onChange={e => setProfile({...profile, customContext: e.target.value})}
                  className="w-full bg-black border border-white/10 p-8 text-lg font-serif italic leading-relaxed outline-none focus:border-accent text-white h-48 rounded-sm shadow-inner" 
                  placeholder="Describe the 'main truth' you want this WRAPPER to protect and refine..."
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
          0% { d: path("M100,100 L700,100 L700,900 L100,900 Z"); }
          25% { d: path("M150,50 C300,150 500,50 650,150 L700,850 C500,950 300,850 100,950 Z"); }
          50% { d: path("M200,200 C400,100 600,300 750,250 L650,750 C450,850 250,650 150,800 Z"); }
          75% { d: path("M120,80 C320,180 480,80 680,180 L680,880 C480,980 320,880 120,980 Z"); }
          100% { d: path("M100,100 L700,100 L700,900 L100,900 Z"); }
        }
        .paper-anim {
          animation: paper-morph 20s infinite ease-in-out;
          transition: all 1s ease-in-out;
        }
        @keyframes toast-up {
          from { opacity: 0; transform: translateY(50px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        .animate-toast-up {
          animation: toast-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default WrapperInfo;
