
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Narrative } from '../types';
import { readArray } from '../utils/safeStorage';

const Home: React.FC = () => {
  const [latestNarratives, setLatestNarratives] = useState<Narrative[]>([]);

  useEffect(() => {
    const stories = readArray<Narrative>('external_registry', []);
    setLatestNarratives(stories.slice(0, 3));
  }, []);

  return (
    <div className="bg-black min-h-screen w-screen overflow-x-hidden flex flex-col selection:bg-[var(--accent)]/30">

      {/* Cinematic Main Entry */}
      <div className="h-screen flex flex-col md:flex-row">
        {/* THE FORGE: FORGE A STORY */}
        <Link
          to="/forge"
          className="relative flex-1 flex flex-col items-center justify-center group overflow-hidden border-b md:border-b-0 md:border-r border-white/5 transition-all duration-700 ease-in-out md:hover:flex-[1.5]"
        >
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2500&auto=format&fit=crop"
              className="w-full h-full object-cover grayscale brightness-[0.3] md:brightness-[0.2] md:group-hover:brightness-[0.45] md:group-hover:grayscale-0 md:group-hover:scale-110 transition-all duration-[4000ms]"
              alt="The Blacksmith Hammering Anvil"
            />
            {/* Smooth gradient overlays — no hard edges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 z-[1]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-[1]"></div>
            {/* Colour wash on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-950/70 via-orange-900/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-1000 z-[2]"></div>
            {/* Ember glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[150px] opacity-0 md:group-hover:opacity-40 transition-opacity duration-1000 bg-orange-500 z-[2]"></div>
          </div>

          {/* Animated sparks / particles */}
          <div className="absolute inset-0 z-[3] opacity-0 md:group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
            <div className="absolute w-1 h-1 rounded-full bg-orange-400 animate-spark-1"></div>
            <div className="absolute w-1 h-1 rounded-full bg-orange-300 animate-spark-2"></div>
            <div className="absolute w-0.5 h-0.5 rounded-full bg-yellow-400 animate-spark-3"></div>
          </div>

          <div className="relative z-10 text-center space-y-4 md:space-y-8 px-6 md:px-10">
            <div className="space-y-2">
              <span className="text-orange-500 tracking-[0.5em] md:tracking-[1em] uppercase text-[8px] md:text-[10px] font-black block opacity-100 md:opacity-40 md:group-hover:opacity-100 transition-all duration-700 md:transform md:translate-y-4 md:group-hover:translate-y-0">
                Sovereign Production
              </span>
              <h2 className="text-5xl md:text-[10rem] font-serif font-black italic text-white tracking-tighter leading-none md:group-hover:scale-105 md:group-hover:animate-forge-impact transition-all duration-700">
                FORGE <br />
                <span className="text-[var(--accent)] md:text-gray-800 md:group-hover:text-[var(--accent)] md:group-hover:animate-living-accent transition-colors duration-500">A Story.</span>
              </h2>
            </div>
            <p className="text-gray-400 md:text-gray-600 text-xs md:text-xl font-light italic max-w-xs mx-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-1000 delay-200 md:transform md:translate-y-4 md:group-hover:translate-y-0">
              Your story. Your voice. Your legacy.
            </p>
          </div>

          <div className="absolute bottom-6 md:bottom-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-1000 md:translate-y-4 md:group-hover:translate-y-0">
             <div className="flex flex-col items-center gap-2 md:gap-4">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-orange-500">Access Protocol</span>
                <div className="w-1 h-8 md:h-16 bg-gradient-to-b from-orange-500 to-transparent animate-pulse"></div>
             </div>
          </div>
        </Link>

        {/* THE ARCHIVE: READ A STORY */}
        <Link
          to="/published-books"
          className="relative flex-1 flex flex-col items-center justify-center group overflow-hidden transition-all duration-700 ease-in-out md:hover:flex-[1.5]"
        >
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2500&auto=format&fit=crop"
              className="w-full h-full object-cover grayscale brightness-[0.3] md:brightness-[0.2] md:group-hover:brightness-[0.45] md:group-hover:grayscale-0 md:group-hover:scale-110 transition-all duration-[4000ms]"
              alt="The Global Archive"
            />
            {/* Smooth gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 z-[1]"></div>
            <div className="absolute inset-0 bg-gradient-to-l from-black/30 via-transparent to-black/30 z-[1]"></div>
            {/* Colour wash on hover */}
            <div className="absolute inset-0 bg-gradient-to-tl from-cyan-950/70 via-cyan-900/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-1000 z-[2]"></div>
            {/* Cool glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[150px] opacity-0 md:group-hover:opacity-30 transition-opacity duration-1000 bg-cyan-500 z-[2]"></div>
          </div>

          {/* Floating dust motes */}
          <div className="absolute inset-0 z-[3] opacity-0 md:group-hover:opacity-100 transition-opacity duration-2000 pointer-events-none overflow-hidden">
            <div className="absolute w-1 h-1 rounded-full bg-cyan-300/60 animate-dust-1"></div>
            <div className="absolute w-0.5 h-0.5 rounded-full bg-white/40 animate-dust-2"></div>
            <div className="absolute w-1 h-1 rounded-full bg-cyan-400/40 animate-dust-3"></div>
          </div>

          <div className="relative z-10 text-center space-y-4 md:space-y-8 px-6 md:px-10">
            <div className="space-y-2">
              <span className="text-cyan-500 tracking-[0.5em] md:tracking-[1em] uppercase text-[8px] md:text-[10px] font-black block opacity-100 md:opacity-40 md:group-hover:opacity-100 transition-all duration-700 md:transform md:translate-y-4 md:group-hover:translate-y-0">
                Verified Registry
              </span>
              <h2 className="text-5xl md:text-[10rem] font-serif font-black italic text-white tracking-tighter leading-none md:group-hover:scale-105 transition-transform duration-700">
                READ <br />
                <span className="text-cyan-400 md:text-gray-800 md:group-hover:text-cyan-400 transition-colors duration-500">A Story.</span>
              </h2>
            </div>
            <p className="text-gray-400 md:text-gray-600 text-xs md:text-xl font-light italic max-w-xs mx-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-1000 delay-200 md:transform md:translate-y-4 md:group-hover:translate-y-0">
              Stories forged in fire. Published without permission.
            </p>
          </div>

          <div className="absolute bottom-6 md:bottom-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-1000 md:translate-y-4 md:group-hover:translate-y-0">
             <div className="flex flex-col items-center gap-2 md:gap-4">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-cyan-500">Open Registry</span>
                <div className="w-1 h-8 md:h-16 bg-gradient-to-b from-cyan-500 to-transparent animate-pulse"></div>
             </div>
          </div>
        </Link>
      </div>

      {/* RECENT TRUTHS (Teaser Section) */}
      {latestNarratives.length > 0 && (
        <section className="bg-[#050505] py-16 md:py-32 px-4 md:px-6 border-t border-white/5 relative z-40">
           <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 md:mb-16 gap-4">
                 <div>
                    <span className="text-orange-500 tracking-[0.5em] uppercase text-[9px] font-black block mb-4">Latest Submissions</span>
                    <h2 className="text-3xl md:text-5xl font-serif italic font-black text-white">Recent <span className="text-gray-700">Truths.</span></h2>
                 </div>
                 <Link to="/narratives" className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all underline underline-offset-8">Examine Full Archive →</Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                 {latestNarratives.map((n) => (
                    <div key={n.id} className="p-6 md:p-8 bg-white/[0.02] border border-white/5 rounded-sm hover:border-orange-500/20 transition-all">
                       <h3 className="text-lg md:text-xl font-serif italic text-white mb-4 line-clamp-1">{n.title}</h3>
                       <p className="text-sm text-gray-500 font-light italic mb-6 md:mb-8 leading-relaxed line-clamp-3">"{n.excerpt}"</p>
                       <Link to="/narratives" className="text-[8px] font-black uppercase tracking-widest text-orange-500">Read in Archive</Link>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* Central Logo - desktop only */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center pointer-events-auto">
         <Link to="/origin-story" className="relative p-2 group/logo transition-all duration-1000 hover:scale-110">
            <div className="absolute inset-0 bg-black/85 blur-2xl rounded-full scale-125 -z-10 transition-all duration-1000 group-hover/logo:bg-black group-hover/logo:blur-3xl group-hover/logo:scale-150"></div>
            <Logo variant="light" className="w-64 h-64 transition-transform duration-[4000ms] ease-in-out group-hover/logo:rotate-[360deg]" />
         </Link>
      </div>

      <style>{`
        @keyframes forge-impact { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02) translateX(2px); } 55% { transform: scale(1.02) translateX(-2px); } }
        .animate-forge-impact { animation: forge-impact 0.2s 2; }

        @keyframes spark-1 {
          0% { top: 70%; left: 30%; opacity: 0; }
          20% { opacity: 1; }
          100% { top: 20%; left: 45%; opacity: 0; transform: scale(0); }
        }
        @keyframes spark-2 {
          0% { top: 75%; left: 55%; opacity: 0; }
          30% { opacity: 1; }
          100% { top: 15%; left: 40%; opacity: 0; transform: scale(0); }
        }
        @keyframes spark-3 {
          0% { top: 80%; left: 40%; opacity: 0; }
          25% { opacity: 1; }
          100% { top: 25%; left: 60%; opacity: 0; transform: scale(0); }
        }
        .animate-spark-1 { animation: spark-1 3s ease-out infinite; }
        .animate-spark-2 { animation: spark-2 4s ease-out infinite 0.8s; }
        .animate-spark-3 { animation: spark-3 3.5s ease-out infinite 1.5s; }

        @keyframes dust-1 {
          0% { top: 80%; left: 20%; opacity: 0; }
          30% { opacity: 0.6; }
          100% { top: 10%; left: 35%; opacity: 0; }
        }
        @keyframes dust-2 {
          0% { top: 70%; left: 60%; opacity: 0; }
          40% { opacity: 0.4; }
          100% { top: 5%; left: 50%; opacity: 0; }
        }
        @keyframes dust-3 {
          0% { top: 85%; left: 45%; opacity: 0; }
          35% { opacity: 0.5; }
          100% { top: 15%; left: 70%; opacity: 0; }
        }
        .animate-dust-1 { animation: dust-1 8s ease-out infinite; }
        .animate-dust-2 { animation: dust-2 10s ease-out infinite 2s; }
        .animate-dust-3 { animation: dust-3 9s ease-out infinite 4s; }
      `}</style>
    </div>
  );
};

export default Home;
