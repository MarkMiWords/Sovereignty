
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="bg-[#050505]">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden px-6 text-center">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1589216534379-39c148804611?q=80&w=2500&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale opacity-70 scale-105 animate-subtle-drift" 
            alt="Scales of Justice" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-orange-500/10 rounded-full blur-[200px] z-10"></div>
        </div>

        <div className="relative z-20 max-w-6xl px-4">
          <span className="text-orange-500 tracking-[0.9em] uppercase text-[10px] font-black mb-8 block animate-fade-in animate-living-amber glow-orange drop-shadow-[0_0_10px_rgba(230,126,34,0.5)]">
            A digital storytelling and media platform
          </span>
          <h1 className="text-6xl md:text-9xl font-serif font-black mb-8 leading-[0.9] tracking-tighter text-white animate-slide-up glow-white">
            Tell your <br />
            <span className="text-orange-500 italic font-serif glow-orange animate-living-amber">story.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed italic mb-12 animate-fade-in delay-300">
            Built around real, first-hand prison narratives. Giving weight to the words that have been silenced by the system.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-10 animate-fade-in mt-12">
            <Link to="/author-builder" className="bg-orange-500 hover:bg-orange-600 text-white px-16 py-6 font-black tracking-[0.6em] uppercase text-[10px] transition-all animate-pulse-orange shadow-2xl rounded-sm animate-living-amber-bg">
              Start Your Sheet
            </Link>
            <Link to="/narratives" className="bg-white/5 hover:bg-white/10 text-white px-16 py-6 font-black tracking-[0.6em] uppercase text-[10px] border border-white/10 backdrop-blur-3xl transition-all hover:border-white/30 rounded-sm">
              Explore Archives
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-48 px-12 lg:px-32 bg-[#050505] border-t border-white/[0.02] relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <span className="text-orange-500 tracking-[0.6em] uppercase text-[9px] font-black block glow-orange animate-living-amber">Mission Statement</span>
              <h2 className="text-6xl md:text-7xl font-serif font-black italic leading-[1] text-white tracking-tighter">
                Truth from <br />
                <span className="text-orange-500 glow-orange animate-living-amber">The Inside.</span>
              </h2>
              <p className="text-2xl text-gray-400 font-light leading-relaxed italic border-l-2 border-orange-500/20 pl-10 py-6">
                Our platform curates authentic, unvarnished narratives from those currently and formerly incarcerated, creating a digital bridge to the world.
              </p>
              <div className="pt-12">
                <Link to="/origin-story" className="text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] hover:text-white transition-all underline underline-offset-[12px] decoration-orange-500/30 animate-living-amber">Read the Architect's Journey →</Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#080808] border border-white/5 p-16 lg:p-24 shadow-[0_40px_100px_rgba(0,0,0,0.6)] rounded-sm relative overflow-hidden group">
                <h3 className="text-4xl font-serif italic text-white mb-8 glow-white tracking-tighter">Documentation as Sovereignty.</h3>
                <div className="space-y-8 text-lg italic font-light leading-[2] text-gray-400">
                  <p>In the beginning was the word. We specialize in narratives forged in the heat of systemic struggle. Every sheet is a record of humanity.</p>
                  <p>The infrastructure is ours; the truth is yours. We reclaim the narrative, one sheet at a time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes subtle-drift { 
          from { transform: scale(1.05) translate(0%, 0%); } 
          to { transform: scale(1.1) translate(0.5%, 0.5%); } 
        }
        @keyframes slide-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-subtle-drift { animation: subtle-drift 60s infinite alternate ease-in-out; }
        .animate-slide-up { animation: slide-up 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Home;
