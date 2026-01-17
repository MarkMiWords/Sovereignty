
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="bg-[#050505]">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden px-6 text-center">
        {/* Background Layer - Recalibrated for visibility */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1589216534379-39c148804611?q=80&w=2500&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale-[40%] opacity-50 scale-105 animate-subtle-drift" 
            alt="Scales of Justice" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-orange-500/5 rounded-full blur-[200px] z-10"></div>
        </div>

        <div className="relative z-20 max-w-6xl px-4">
          <div className="inline-flex items-center gap-4 bg-orange-500/10 border border-orange-500/30 px-6 py-2 rounded-full mb-12 animate-fade-in">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
             <span className="text-orange-500 tracking-[0.4em] uppercase text-[9px] font-black glow-orange">STABLEMATE BETA PILOT LIVE</span>
          </div>
          
          <h1 className="text-6xl md:text-[10rem] font-serif font-black mb-8 leading-[0.85] tracking-tighter text-white animate-slide-up glow-white">
            RECLAIM THE <br />
            <span className="text-orange-500 italic font-serif glow-orange animate-living-amber uppercase">Narrative.</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed italic mb-16 animate-fade-in delay-300">
            The world's first sovereign digital workspace for incarcerated and formerly incarcerated authors.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-10 animate-fade-in mt-12">
            <Link to="/author-builder" className="group relative bg-orange-500 hover:bg-orange-600 text-white px-20 py-8 font-black tracking-[0.6em] uppercase text-[11px] transition-all shadow-2xl rounded-sm animate-living-amber-bg overflow-hidden">
              <span className="relative z-10">Enter My Sheets</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>
            <Link to="/published-books" className="bg-white/5 hover:bg-white/10 text-white px-20 py-8 font-black tracking-[0.6em] uppercase text-[11px] border border-white/10 backdrop-blur-3xl transition-all hover:border-white/30 rounded-sm">
              Explore Storefront
            </Link>
          </div>
        </div>
      </section>

      {/* Beta Test Guide */}
      <section className="py-32 px-12 lg:px-32 bg-[#080808] border-y border-white/[0.05]">
         <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-16">
               <div className="space-y-6 p-12 bg-black border border-white/5 rounded-sm group hover:border-orange-500/20 transition-all">
                  <div className="text-3xl mb-4">🔐</div>
                  <h3 className="text-xl font-serif italic text-white">1. Secure Access</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light italic">Use the invite phrase <span className="text-orange-500 font-bold uppercase">"captivate me"</span> to enter the private studio. This phrase protects the integrity of the pilot.</p>
               </div>
               <div className="space-y-6 p-12 bg-black border border-white/5 rounded-sm group hover:border-orange-500/20 transition-all">
                  <div className="text-3xl mb-4">🧠</div>
                  <h3 className="text-xl font-serif italic text-white">2. Set WRAP Profile</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light italic">Head to <span className="text-orange-500 uppercase">WRAP Profile</span> to set your tone and core mission. Your AI partner needs this to protect your unique voice.</p>
               </div>
               <div className="space-y-6 p-12 bg-black border border-white/5 rounded-sm group hover:border-orange-500/20 transition-all">
                  <div className="text-3xl mb-4">⚖️</div>
                  <h3 className="text-xl font-serif italic text-white">3. Scrub vs. Rinse</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light italic">Use <span className="text-orange-500 uppercase">Scrub</span> to tighten prose while keeping dialogue intact. <span className="text-orange-500 uppercase">Rinse</span> is for light punctuation only.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Mission Summary */}
      <section className="py-48 px-12 lg:px-32 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <span className="text-orange-500 tracking-[0.6em] uppercase text-[9px] font-black block glow-orange animate-living-amber">The Foundation</span>
              <h2 className="text-7xl md:text-8xl font-serif font-black italic leading-[1] text-white tracking-tighter">
                Evidence <br />
                <span className="text-orange-500 glow-orange animate-living-amber">of Life.</span>
              </h2>
              <p className="text-2xl text-gray-400 font-light leading-relaxed italic border-l-2 border-orange-500/20 pl-10 py-6">
                A Captive Audience is the industrial bridge for narratives that have been silenced by the system. Every sheet is a permanent record of sovereignty.
              </p>
              <div className="pt-12">
                <Link to="/origin-story" className="text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] hover:text-white transition-all underline underline-offset-[12px] decoration-orange-500/30 animate-living-amber">Explore the Architect's Vision →</Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#0d0d0d] border border-white/5 p-16 lg:p-24 shadow-[0_40px_100px_rgba(0,0,0,0.6)] rounded-sm relative overflow-hidden group">
                <h3 className="text-4xl font-serif italic text-white mb-8 glow-white tracking-tighter">Documentation as Sovereignty.</h3>
                <div className="space-y-8 text-lg italic font-light leading-[2] text-gray-400">
                  <p>Our infrastructure is designed for the raw and the unvarnished. We bypass the gatekeepers to bring carceral truth directly to the global archive.</p>
                  <p>This is the tool I wish I had on the inside. Now, it's yours. Use it to build your legacy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Home;
