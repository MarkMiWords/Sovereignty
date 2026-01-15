
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="bg-[#050505]">
      {/* Beta Banner */}
      <div className="bg-orange-500/5 border-b border-orange-500/10 py-3 text-center relative z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6">
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.5em] flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(230,126,34,1)]"></span>
            Sovereign Protocol Beta 4.0
          </p>
          <span className="text-gray-900 font-thin">|</span>
          <p className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.2em] italic">"Documenting the friction of the system."</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[100vh] flex items-center justify-center overflow-hidden px-6 text-center">
        {/* Cinematic Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#050505]/40 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1589578233442-c341bff13391?q=80&w=2500&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale opacity-40 scale-105 animate-subtle-zoom brightness-[0.7]" 
            alt="Scales of Justice" 
          />
          {/* Gradients for depth and readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] z-10"></div>
          
          {/* Central Glow Orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[180px] z-10 animate-pulse-slow"></div>
          
          {/* Grit Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] z-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        </div>

        <div className="relative z-20 max-w-6xl">
          <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black mb-10 block animate-fade-in glow-orange">
            Let us capture your words and build you an audience
          </span>
          <h1 className="text-8xl md:text-[11rem] font-serif font-black mb-14 leading-[0.85] tracking-tighter text-white animate-slide-up glow-white">
            Your <span className="text-orange-500 italic font-serif glow-orange">Story</span> <br />
            Matters.
          </h1>
          
          <div className="flex flex-col sm:flex-row justify-center gap-8 animate-fade-in mt-16 scale-110">
            <Link to="/narratives" className="bg-orange-500 hover:bg-orange-600 text-white px-16 py-7 font-black tracking-[0.5em] uppercase text-[10px] transition-all animate-pulse-orange shadow-2xl rounded-sm">
              The Archives
            </Link>
            <Link to="/login" className="bg-white/5 hover:bg-white/10 text-white px-16 py-7 font-black tracking-[0.5em] uppercase text-[10px] border border-white/10 backdrop-blur-xl transition-all hover:border-white/30 rounded-sm">
              My Sheets
            </Link>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30 z-20">
          <span className="text-[8px] font-black uppercase tracking-[0.6em] rotate-90 mb-4">Explore</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-64 px-12 lg:px-32 bg-[#050505] border-t border-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <span className="text-orange-500 tracking-[0.6em] uppercase text-[9px] font-black block glow-orange">Mission Protocol</span>
              <h2 className="text-6xl md:text-8xl font-serif font-black italic leading-[0.9] text-white">
                The Sovereign <br />
                <span className="text-orange-500 glow-orange">Pipeline.</span>
              </h2>
              <p className="text-2xl text-gray-500 font-light leading-relaxed italic border-l border-orange-500/20 pl-10 py-4">
                We provide the infrastructure for those who have brushed against the system to turn their friction into authority.
              </p>
              
              <div className="space-y-12">
                <div className="group flex gap-10 items-start">
                  <div className="w-12 h-12 rounded-sm border border-orange-500/30 flex items-center justify-center text-orange-500 text-xs font-black shrink-0 transition-all group-hover:bg-orange-500 group-hover:text-white shadow-lg">01</div>
                  <div>
                    <h4 className="text-white font-serif italic text-2xl mb-3 glow-white">Document the Truth</h4>
                    <p className="text-[10px] text-gray-600 leading-relaxed uppercase tracking-[0.2em] font-bold">Use our secure sheets to log your lived experience safely and anonymously.</p>
                  </div>
                </div>
                <div className="group flex gap-10 items-start">
                  <div className="w-12 h-12 rounded-sm border border-orange-500/30 flex items-center justify-center text-orange-500 text-xs font-black shrink-0 transition-all group-hover:bg-orange-500 group-hover:text-white shadow-lg">02</div>
                  <div>
                    <h4 className="text-white font-serif italic text-2xl mb-3 glow-white">Amplify the Voice</h4>
                    <p className="text-[10px] text-gray-600 leading-relaxed uppercase tracking-[0.2em] font-bold">We bridge your words to global platforms, ensuring the world hears your side.</p>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <Link to="/origin-story" className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-all underline underline-offset-8">Read the Architect's Journey →</Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#080808] border border-white/5 p-16 lg:p-24 shadow-2xl rounded-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <h3 className="text-4xl font-serif italic text-white mb-10 glow-white">Grit as a Resource.</h3>
                <div className="space-y-12 text-sm italic font-light leading-[2] text-gray-500">
                  <p>In the beginning was the word. We specialize in narratives forged in the heat of systemic struggle. Our tech makes high-end publishing accessible to the system-impacted.</p>
                  <p>The infrastructure is ours; the truth is yours. We reclaim the narrative, one sheet at a time.</p>
                </div>
                <div className="mt-16 h-[1px] w-full bg-gradient-to-r from-orange-500/40 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes subtle-zoom { from { transform: scale(1.05); } to { transform: scale(1.15); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        .animate-subtle-zoom { animation: subtle-zoom 40s infinite alternate linear; }
        .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default Home;
