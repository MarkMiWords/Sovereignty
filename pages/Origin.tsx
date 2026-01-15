
import React from 'react';
import { Link } from 'react-router-dom';

const Origin: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-orange-500/30 overflow-x-hidden pb-32">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 right-0 w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-0 w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24 border-b border-white/5">
        <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black mb-8 block animate-fade-in glow-orange">
          The Architect's Truth
        </span>
        <h1 className="text-7xl md:text-9xl font-serif font-black mb-12 italic leading-none tracking-tighter text-white animate-slide-up glow-white">
          Origin <span className="text-orange-500">Story.</span>
        </h1>
        <p className="text-2xl md:text-3xl text-gray-500 font-light italic leading-relaxed max-w-3xl">
          "When I was in prison, I passed the time and dealt with the pain by writing stories. It wasn't just my story—it was the truth of the men I encountered."
        </p>
      </section>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 space-y-32">
        {/* Movement 1: The Steel & The Ink */}
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-2 sticky top-64">
             <h2 className="text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] mb-4 border-l-2 border-orange-500 pl-4">Movement 01</h2>
             <h3 className="text-4xl font-serif italic text-white glow-white">The Steel & The Ink.</h3>
          </div>
          <div className="lg:col-span-3 prose prose-invert prose-lg text-gray-400 font-light leading-loose">
            <p>
              In the beginning, it was about survival. I encounter so many men with rich, amazing, unbelievable stories to offer. I began to compile them—page after page of handwritten notes, scratched out in the low light of a cell. Every word was a reclamation of humanity in a place designed to strip it away.
            </p>
            <p className="text-white italic text-2xl font-serif py-10 glow-white">
              "The sound of the gate closing is the sound of a chapter slamming shut on a life you thought was yours."
            </p>
          </div>
        </div>

        {/* Movement 2: The Digital Bridge */}
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-3 order-2 lg:order-1 prose prose-invert prose-lg text-gray-400 font-light leading-loose">
            <p>
              When I got out on bail, I spent countless hours manually typing those notes. It was a brutal grind before I realized that I could have had an app do it for me. It would have saved the bother, but the process taught me something vital: 
            </p>
            <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mt-6">
              Refinement is where the truth hardens.
            </p>
            <p>
              As I rewrote them for Substack, splitting stories into manageable chunks, I learned how to edit, how to introduce, and how to exit. I refined them within the Substack ecosystem, and by the time I was putting my book together, those refined digital versions had become something far more powerful than the original ink.
            </p>
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2 sticky top-64 lg:text-right">
             <h2 className="text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] mb-4 lg:border-r-2 lg:border-l-0 border-l-2 border-orange-500 lg:pr-4 lg:pl-0 pl-4">Movement 02</h2>
             <h3 className="text-4xl font-serif italic text-white glow-white">The Digital Bridge.</h3>
          </div>
        </div>

        {/* Movement 3: Bypassing the Gate */}
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-2 sticky top-64">
             <h2 className="text-orange-500 text-[11px] font-black uppercase tracking-[0.5em] mb-4 border-l-2 border-orange-500 pl-4">Movement 03</h2>
             <h3 className="text-4xl font-serif italic text-white glow-white">Bypassing the Gate.</h3>
          </div>
          <div className="lg:col-span-3 prose prose-invert prose-lg text-gray-400 font-light leading-loose">
            <p>
              I saw the barriers firsthand. It could be the best story ever written, but in my circumstances, nobody wanted to hear it. Traditional publishing wasn't going to give me a chance. 
            </p>
            <p className="bg-white/5 border border-white/10 p-10 rounded-sm italic text-xl text-gray-300 shadow-2xl">
              "A Captive Audience was originally just a clever name for a Substack channel. It became a publishing house when I realized that self-publishing was the only way to seize sovereignty over our words."
            </p>
            <p>
              The name took on a new life—a publishing company designed to give voices a stage they were never meant to have.
            </p>
          </div>
        </div>

        {/* Movement 4: The Invitation */}
        <div className="bg-[#0a0a0a] border border-white/5 p-12 lg:p-24 rounded-sm text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black mb-8 block glow-orange">The Invitation</span>
          <h3 className="text-5xl md:text-7xl font-serif italic text-white mb-12 glow-white tracking-tighter leading-none">Your truth needs to be <span className="text-orange-500">heard.</span></h3>
          <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl mx-auto mb-16">
            "I've included all the tools I wish I had when I first started writing. I hope you connect with your words and this technology to produce results that change lives—just like these stories changed mine."
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <Link to="/author-builder" className="bg-orange-500 hover:bg-orange-600 text-white px-16 py-6 font-black tracking-[0.5em] uppercase text-[10px] transition-all animate-pulse-orange shadow-2xl rounded-sm">
              Start Your Sheet
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Origin;
