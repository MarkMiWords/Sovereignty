
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="bg-black h-screen w-screen overflow-hidden flex flex-col md:flex-row selection:bg-[var(--accent)]/30">
      
      {/* THE FORGE: FORGE A STORY */}
      <Link 
        to="/author-builder" 
        className="relative flex-1 flex flex-col items-center justify-center group overflow-hidden border-b md:border-b-0 md:border-r border-white/5 transition-all duration-700 ease-in-out hover:flex-[1.4]"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=2500&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale brightness-[0.15] group-hover:brightness-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[3000ms]" 
            alt="The Blacksmith's Forge" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          {/* Subtle Spark Overlay Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none mix-blend-screen" style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/stardust.png)'}}></div>
        </div>
        
        <div className="relative z-10 text-center space-y-8 px-10">
          <div className="space-y-2">
            <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black block opacity-40 group-hover:opacity-100 transition-all duration-700 transform translate-y-4 group-hover:translate-y-0">
              Sovereign Production
            </span>
            <h2 className="text-7xl md:text-[9rem] font-serif font-black italic text-white tracking-tighter leading-none group-hover:scale-105 transition-transform duration-700">
              FORGE <br />
              <span className="text-gray-800 group-hover:text-[var(--accent)] group-hover:animate-living-accent transition-colors duration-500">A Story.</span>
            </h2>
          </div>
          <p className="text-gray-600 text-sm md:text-xl font-light italic max-w-xs mx-auto opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-100 transform translate-y-4 group-hover:translate-y-0">
            Transform raw experience into industrial-grade digital manuscripts.
          </p>
        </div>

        {/* Action Indicator */}
        <div className="absolute bottom-20 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-4 group-hover:translate-y-0">
           <div className="flex flex-col items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500">Enter The Forge</span>
              <div className="w-1 h-16 bg-gradient-to-b from-orange-500 to-transparent animate-pulse"></div>
           </div>
        </div>
      </Link>

      {/* THE ARCHIVE: READ */}
      <Link 
        to="/published-books" 
        className="relative flex-1 flex flex-col items-center justify-center group overflow-hidden transition-all duration-700 ease-in-out hover:flex-[1.4]"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2500&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale brightness-[0.15] group-hover:brightness-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[3000ms]" 
            alt="The Global Archive" 
          />
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        </div>

        <div className="relative z-10 text-center space-y-8 px-10">
          <div className="space-y-2">
            <span className="text-cyan-500 tracking-[0.8em] uppercase text-[10px] font-black block opacity-40 group-hover:opacity-100 transition-all duration-700 transform translate-y-4 group-hover:translate-y-0">
              Verified Registry
            </span>
            <h2 className="text-7xl md:text-[9rem] font-serif font-black italic text-white tracking-tighter leading-none group-hover:scale-105 transition-transform duration-700">
              READ <br />
              <span className="text-gray-800 group-hover:text-cyan-400 transition-colors duration-500">A Story.</span>
            </h2>
          </div>
          <p className="text-gray-600 text-sm md:text-xl font-light italic max-w-xs mx-auto opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-100 transform translate-y-4 group-hover:translate-y-0">
            Browse authentic carceral narratives locked into the global registry.
          </p>
        </div>

        {/* Action Indicator */}
        <div className="absolute bottom-20 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-4 group-hover:translate-y-0">
           <div className="flex flex-col items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-cyan-500">Open Registry</span>
              <div className="w-1 h-16 bg-gradient-to-b from-cyan-500 to-transparent animate-pulse"></div>
           </div>
        </div>
      </Link>

      {/* FIXED CENTER ANCHOR */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none hidden md:flex flex-col items-center">
         <div className="bg-[#050505] p-12 rounded-full border border-white/10 shadow-[0_0_120px_rgba(0,0,0,1)]">
            <h1 className="text-3xl font-black uppercase tracking-[0.6em] text-white">A.C.A</h1>
         </div>
      </div>

      <style>{`
        body { overflow: hidden !important; }
      `}</style>
    </div>
  );
};

export default Home;
