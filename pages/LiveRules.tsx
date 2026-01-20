
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LiveRules: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-24 pb-32">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/author-builder')} className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12 block hover:underline">← Return to Forge</button>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <span className="text-orange-500 tracking-[0.8em] uppercase text-[10px] font-black block animate-pulse">Security Protocol</span>
            <h1 className="text-6xl md:text-8xl font-serif font-black italic text-white tracking-tighter leading-none">Live Link <br/><span className="text-orange-500">Ground Rules.</span></h1>
            <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"Before entering the acoustic link with WRAP, you must acknowledge the following behavioral guardrails."</p>
          </div>

          <div className="grid gap-8">
             <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-sm">
                <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">01. Narrative Integrity</h3>
                <p className="text-gray-400 text-sm font-serif italic leading-relaxed">The Live Link is for creative forging. Respect the truth. Respect the grit. DO NOT use the link for illegal directives or unauthorized legal advice.</p>
             </div>
             <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-sm">
                <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">02. Privacy Shield</h3>
                <p className="text-gray-400 text-sm font-serif italic leading-relaxed">Be mindful of your surroundings. Acoustic signatures are ephemeral but your vocal data is sensitive. Ensure you are in a secure environment.</p>
             </div>
             <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-sm">
                <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">03. Response Latency</h3>
                <p className="text-gray-500 text-sm font-serif italic leading-relaxed">Gemini 2.5 Native Audio is human-like, but structural complexity can cause sync delays. Allow the partner to complete their acoustic turn before responding.</p>
             </div>
          </div>

          <button 
            onClick={() => navigate('/author-builder')}
            className="w-full py-8 bg-orange-500 text-white text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-orange-600 transition-all rounded-sm"
          >
            I Acknowledge. Open Link.
          </button>
        </div>
      </section>
    </div>
  );
};

export default LiveRules;
