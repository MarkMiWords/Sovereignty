
import React from 'react';
import { Link } from 'react-router-dom';

const WhyPublish: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center px-6 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale" 
            alt="Old typewriter and keys" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-5xl">
          <span className="text-accent tracking-[0.6em] uppercase text-[10px] font-bold mb-8 block animate-fade-in">Global Distribution</span>
          <h1 className="text-6xl md:text-9xl font-serif font-bold mb-10 leading-[0.85] tracking-tighter italic">
            Publishing <br />
            <span className="text-accent">Redefined.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed italic">
            "We provide the bridge from the pen to the world. A professional ecosystem for less than the price of a daily coffee."
          </p>
        </div>
      </section>

      {/* The Value Comparison Section */}
      <section className="py-32 px-6 lg:px-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
             <h2 className="text-4xl font-serif font-bold italic mb-6 text-white">Accessible <span className="text-accent">Power.</span></h2>
             <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Consolidating the System-Impacted Toolkit</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             <div className="p-12 border border-white/5 bg-black/40 flex flex-col items-center text-center group hover:border-accent/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-8">
                   <span className="text-gray-600 group-hover:text-accent transition-colors">$30</span>
                </div>
                <h4 className="text-white font-serif italic text-xl mb-4">Solo AI Writing</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-light mb-8">High-end assistants cost ~$30/month just for a chat window. No specialized carceral safety.</p>
                <div className="mt-auto text-[9px] font-bold text-gray-700 uppercase tracking-widest">No Publishing Tools</div>
             </div>
             
             <div className="p-12 border border-accent/40 bg-accent/5 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-accent text-white text-[8px] font-black tracking-widest px-4 py-1">SOVEREIGN RATE</div>
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-8 shadow-2xl">
                   <span className="text-white font-bold">$10</span>
                </div>
                <h4 className="text-white font-serif italic text-2xl mb-4">The Sovereign Pass</h4>
                <p className="text-sm text-gray-300 leading-relaxed font-light mb-8">Includes industrial OCR, legal auditing, artist collaboration, and a **10GB Secure Vault**.</p>
                <div className="mt-auto text-[10px] font-bold text-accent uppercase tracking-[0.3em]">Complete Ecosystem</div>
             </div>

             <div className="p-12 border border-white/5 bg-black/40 flex flex-col items-center text-center group hover:border-accent/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-8">
                   <span className="text-gray-600 group-hover:text-accent transition-colors">$80+</span>
                </div>
                <h4 className="text-white font-serif italic text-xl mb-4">Manual Path</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-light mb-8">Legal consults and manual transcription for complex systemic cases often exceed $80/chapter.</p>
                <div className="mt-auto text-[9px] font-bold text-gray-700 uppercase tracking-widest">Inconsistent Output</div>
             </div>
          </div>
        </div>
      </section>

      {/* The Substack Bridge Featurette */}
      <section className="py-32 px-6 lg:px-24 bg-[#0d0d0d] border-y border-white/5">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative aspect-square lg:aspect-video bg-black overflow-hidden group">
               <img 
                 src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2000&auto=format&fit=crop" 
                 className="w-full h-full object-cover grayscale opacity-40 group-hover:scale-105 transition-all duration-1000" 
                 alt="Laptop and notebook"
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-12 bg-black/80 backdrop-blur-md border border-accent/20 max-w-md">
                     <h3 className="text-3xl font-serif italic text-white mb-6">The Substack Bridge</h3>
                     <p className="text-xs text-gray-400 uppercase tracking-widest leading-loose mb-8">Your first chapter is on us. Reclaim your narrative without a cent upfront.</p>
                     <Link to="/substack-bridge" className="text-accent text-[10px] font-bold uppercase tracking-[0.4em] hover:underline">Explore The Infrastructure →</Link>
                  </div>
               </div>
            </div>
            <div className="space-y-10">
               <h2 className="text-4xl font-serif font-bold italic">Why ACA over <br/><span className="text-accent">Solo Publishing?</span></h2>
               <div className="space-y-8">
                  <div>
                    <h5 className="text-white text-lg font-serif italic mb-2">10GB Archive Storage</h5>
                    <p className="text-sm text-gray-500 leading-relaxed font-light italic">Most platforms limit image uploads. We provide industrial-grade storage for thousands of pages of evidence and drafts.</p>
                  </div>
                  <div>
                    <h5 className="text-white text-lg font-serif italic mb-2">Zero Tech Barrier</h5>
                    <p className="text-sm text-gray-500 leading-relaxed font-light italic">Most impact-affected authors lack high-speed tech. Our light OCR-Bridge works over basic mobile data or via scans.</p>
                  </div>
                  <div>
                    <h5 className="text-white text-lg font-serif italic mb-2">Instant Audience</h5>
                    <p className="text-sm text-gray-500 leading-relaxed font-light italic">We already have thousands of readers looking for authentic voices. You don't start at zero subscribers.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Pricing/Philosophy */}
      <section className="py-32 px-6 lg:px-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12">
           <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-16">
              <h3 className="text-3xl font-serif font-bold mb-6 italic">The "First Chapter" Philosophy</h3>
              <p className="text-gray-400 text-lg font-light leading-relaxed mb-10">
                We know funds are tight for those on the inside or transitioning out. Your first chapter is <span className="text-accent font-bold">free to curate</span>. Test the tools, verify the legal safety, and see your work in professional layout before spending a dollar.
              </p>
              <div className="grid md:grid-cols-2 gap-10">
                 <div className="p-8 bg-black/40 border border-white/5">
                    <h5 className="text-accent text-[10px] font-bold uppercase tracking-widest mb-4">Phase 01: The Launch</h5>
                    <p className="text-xs text-gray-500 italic">One full chapter. Free curation. Full standalone archive generation. Substack integration.</p>
                 </div>
                 <div className="p-8 bg-black/40 border border-white/5">
                    <h5 className="text-accent text-[10px] font-bold uppercase tracking-widest mb-4">Phase 02: The Series</h5>
                    <p className="text-xs text-gray-500 italic">Subscription-based ($10/mo). Serialized access to the Sovereign Pass suite with **10GB Vault** access.</p>
                 </div>
              </div>
           </div>

           <div className="bg-accent p-16 flex flex-col justify-center text-white shadow-2xl">
              <h3 className="text-2xl font-serif font-bold mb-6 italic">Why the $10 Rate?</h3>
              <p className="text-sm font-light leading-loose mb-10 opacity-90">
                Instead of a high-profit markup, we use a flat fee to cover the high-volume token usage for Gemini Pro and 10GB of secure cloud storage. It's a community rate for industrial-grade truth-telling.
              </p>
              <Link 
                to="/creator-hub" 
                className="bg-black text-white text-center py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all"
              >
                Start Free Chapter
              </Link>
           </div>
        </div>
      </section>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default WhyPublish;
