
import React from 'react';
import { Link } from 'react-router-dom';

const Mission: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-white">
      {/* Manifest Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center border-b border-white/5">
        <span className="text-accent tracking-[0.6em] uppercase text-[10px] font-bold mb-6 block animate-fade-in">The Manifesto</span>
        <h1 className="text-6xl md:text-9xl font-serif font-bold mb-12 italic leading-none tracking-tighter">
          From the <span className="text-accent">System</span>,<br />
          to the World.
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed italic opacity-80">
          "The brush with the law leaves a mark. We provide the light, the tech, and the stage to make those narratives unignorable."
        </p>
      </section>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {/* The Philosophy */}
        <section className="grid lg:grid-cols-2 gap-20 items-start">
           <div>
              <h2 className="text-3xl font-bold text-white mb-8 font-serif italic">Humanizing the Impacted</h2>
              <p className="text-gray-400 text-lg leading-relaxed font-light mb-6">
                A Captive Audience sits at the intersection of literature, justice, and sovereignty. We are not just a carceral project; we are a digital sanctuary for anyone navigating the friction of the legal system.
              </p>
              <p className="text-gray-500 leading-relaxed font-light">
                Whether your story is born in a cell, a family court hearing, or a fight for ownership, we believe your truth is a resource. We provide the infrastructure to bypass traditional gatekeepers.
              </p>
           </div>
           <div className="bg-[#0d0d0d] border border-accent/20 p-12 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-3xl"></div>
              <h3 className="text-accent text-[10px] font-bold uppercase tracking-widest mb-6">Sovereign Stories</h3>
              <p className="text-white text-xl font-serif italic leading-relaxed">
                "We don't just amplify voices; we reclaim sovereignty. From family law skirmishes to the hero's journey back from the brink."
              </p>
           </div>
        </section>

        {/* The Core Aims */}
        <section className="bg-[#0a0a0a] p-12 md:p-20 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif italic select-none">Impact</div>
          <h3 className="text-2xl font-bold text-white mb-16 italic font-serif">The Three Pillars of Sovereignty</h3>
          <ul className="space-y-16">
            <li className="flex gap-8 group">
              <span className="text-4xl font-serif text-accent italic opacity-40 group-hover:opacity-100 transition-opacity">01.</span>
              <div>
                <strong className="text-white block text-2xl mb-3 font-serif italic tracking-tight">Systemic Democratization</strong>
                <p className="text-gray-500 leading-relaxed font-light max-w-2xl">
                  Our **Sovereign Transcription** tools bridge the digital gap for those in low-tech environments or under high legal pressure. We turn raw testimony into global archives.
                </p>
              </div>
            </li>
            <li className="flex gap-8 group">
              <span className="text-4xl font-serif text-accent italic opacity-40 group-hover:opacity-100 transition-opacity">02.</span>
              <div>
                <strong className="text-white block text-2xl mb-3 font-serif italic tracking-tight">The Registry of Resilience</strong>
                <p className="text-gray-500 leading-relaxed font-light max-w-2xl">
                  We build permanent, immutable digital archives of human experience within the system. From custody battles to carceral survival, these stories cannot be erased.
                </p>
              </div>
            </li>
            <li className="flex gap-8 group">
              <span className="text-4xl font-serif text-accent italic opacity-40 group-hover:opacity-100 transition-opacity">03.</span>
              <div>
                <strong className="text-white block text-2xl mb-3 font-serif italic tracking-tight">Author Sovereignty</strong>
                <p className="text-gray-500 leading-relaxed font-light max-w-2xl">
                  A direct-to-reader model. We handle the tech; you keep the impact and the earnings. No middlemen sanitizing the grit of your lived experience.
                </p>
              </div>
            </li>
          </ul>
        </section>

        {/* Closing Thought */}
        <section className="text-center pb-20">
          <h3 className="text-4xl font-serif font-bold text-white mb-8 italic">The Narrative is the Reclamation.</h3>
          <p className="text-gray-400 text-lg font-light leading-relaxed max-w-3xl mx-auto mb-12 italic">
            "Justice isn't just a verdict; it's a story. We focus on the lived reality. From the hero's struggle to the victim's truth, the narrative is how we heal the world."
          </p>
          <div className="flex justify-center gap-8">
             <Link to="/why-publish" className="bg-white text-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-accent hover:text-white transition-all">Publish Your Story</Link>
             <Link to="/narratives" className="border border-white/10 text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-white/5 transition-all">Browse Archives</Link>
          </div>
        </section>
      </div>
      
      {/* Stats */}
      <section className="bg-black/40 border-t border-white/5 py-24">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
               <div className="text-4xl font-serif font-bold text-white tracking-tighter">IMPACTED</div>
               <div className="text-[9px] uppercase tracking-[0.4em] text-accent font-bold">Voice Standard</div>
            </div>
            <div className="space-y-2">
               <div className="text-4xl font-serif font-bold text-white tracking-tighter">UNFILTERED</div>
               <div className="text-[9px] uppercase tracking-[0.4em] text-accent font-bold">Grit Integrity</div>
            </div>
            <div className="space-y-2">
               <div className="text-4xl font-serif font-bold text-white tracking-tighter">SOVEREIGN</div>
               <div className="text-[9px] uppercase tracking-[0.4em] text-accent font-bold">Archive Tech</div>
            </div>
            <div className="space-y-2">
               <div className="text-4xl font-serif font-bold text-white tracking-tighter">DIVERSE</div>
               <div className="text-[9px] uppercase tracking-[0.4em] text-accent font-bold">Legal Narratives</div>
            </div>
         </div>
      </section>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Mission;
